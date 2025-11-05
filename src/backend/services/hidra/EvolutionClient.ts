import { z } from 'zod';
import { AppError } from '../../errors/AppError';
import type { Logger } from '../../logger';
import { createLogger } from '../../logger';

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

interface RequestOptions<T> {
  body?: unknown;
  schema?: z.ZodType<T>;
}

export interface EvolutionClientConfig {
  baseUrl: string; // must be HTTPS per validation rules
  apiKey: string; // decrypted plaintext key
  timeoutMs?: number; // default 10000
  maxAttempts?: number; // default 3 (1s, 2s, 4s)
}

export interface EvolutionCreateCampaignRequest {
  name: string;
  description?: string;
  segmentId: string;
  templateId: string;
  rateLimit?: number;
  externalId?: string;
  scheduledAt?: string | null;
}

export interface EvolutionCreateCampaignResponse {
  id: string;
  status: string;
  scheduledAt?: string | null;
}

export interface EvolutionScheduleCampaignRequest {
  scheduledAt: string;
}

export interface EvolutionScheduleCampaignResponse {
  id: string;
  status: string;
  scheduledAt: string;
}

export interface EvolutionCampaignMetricsResponse {
  id: string;
  status: string;
  total: number;
  delivered: number;
  failed: number;
  pending: number;
  averageDeliveryMs: number;
  lastUpdatedAt: string | null;
}

const isoStringSchema = z.string().min(1);

const createCampaignResponseSchema = z
  .object({
    id: z.string().min(1),
    status: z.string().min(1),
    scheduledAt: isoStringSchema.nullable().optional(),
  })
  .passthrough();

const scheduleCampaignResponseSchema = z
  .object({
    id: z.string().min(1),
    status: z.string().min(1),
    scheduledAt: isoStringSchema,
  })
  .passthrough();

const campaignMetricsResponseSchema = z
  .object({
    id: z.string().min(1),
    status: z.string().min(1),
    total: z.number().nonnegative(),
    delivered: z.number().nonnegative(),
    failed: z.number().nonnegative(),
    pending: z.number().nonnegative(),
    averageDeliveryMs: z.number().nonnegative(),
    lastUpdatedAt: isoStringSchema.nullable().optional().transform((value) => value ?? null),
  })
  .passthrough();

export class EvolutionClient {
  private readonly logger: Logger;

  constructor(private readonly cfg: EvolutionClientConfig, logger?: Logger) {
    this.logger = logger ?? createLogger('EvolutionClient');
    if (!this.cfg.baseUrl.startsWith('https://')) {
      throw new AppError({ code: 'HIDRA_EVOLUTION_INSECURE_URL', message: 'Evolution baseUrl must use HTTPS' });
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.request('GET', '/');
      return true;
    } catch (e) {
      this.logger.warn('Evolution testConnection failed', { error: (e as Error).message });
      return false;
    }
  }

  async createCampaign(payload: EvolutionCreateCampaignRequest): Promise<EvolutionCreateCampaignResponse> {
    return this.request('POST', '/campaigns', {
      body: payload,
      schema: createCampaignResponseSchema,
    });
  }

  async scheduleCampaign(externalId: string, payload: EvolutionScheduleCampaignRequest): Promise<EvolutionScheduleCampaignResponse> {
    return this.request('POST', `/campaigns/${externalId}/schedule`, {
      body: payload,
      schema: scheduleCampaignResponseSchema,
    });
  }

  async getCampaignMetrics(externalId: string): Promise<EvolutionCampaignMetricsResponse> {
    return this.request('GET', `/campaigns/${externalId}/metrics`, {
      schema: campaignMetricsResponseSchema,
    });
  }

  async request<T = any>(method: HttpMethod, path: string, options: RequestOptions<T> = {}): Promise<T> {
    const url = new URL(path, this.cfg.baseUrl).toString();
    const maxAttempts = this.cfg.maxAttempts ?? 3;
    let attempt = 0;
    let lastError: unknown;
    const timeoutMs = this.cfg.timeoutMs ?? 10_000;

    while (attempt < maxAttempts) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.cfg.apiKey}`,
          },
          body: options.body ? JSON.stringify(options.body) : undefined,
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!res.ok) {
          const text = await res.text().catch(() => '');
          this.logger.warn('Evolution API non-2xx', { url, status: res.status, body: text });
          // 5xx retryable, 429 retryable; 4xx considered fatal
          if (res.status >= 500 || res.status === 429) {
            throw new AppError({ code: 'HIDRA_EVOLUTION_RETRYABLE', message: `HTTP ${res.status}`, details: text });
          }
          throw new AppError({ code: 'HIDRA_EVOLUTION_HTTP_ERROR', message: `HTTP ${res.status}`, details: text });
        }

        // Try JSON; fallback to text
        const ct = res.headers.get('content-type') ?? '';
        let data: unknown;
        if (ct.includes('application/json')) {
          data = await res.json();
        } else {
          data = await res.text();
        }

        if (options.schema) {
          try {
            return options.schema.parse(data);
          } catch (error) {
            throw new AppError({
              code: 'HIDRA_EVOLUTION_INVALID_RESPONSE',
              message: 'Evolution API returned an unexpected response shape',
              details: { url, data },
              cause: error,
            });
          }
        }

        return data as T;
      } catch (err) {
        clearTimeout(timeout);
        lastError = err;
        attempt += 1;
        const backoffMs = 1000 * Math.pow(2, attempt - 1);
        const isAbort = (err as Error).name === 'AbortError';
        const code = err instanceof AppError ? err.code : 'HIDRA_EVOLUTION_NETWORK';
        this.logger.warn('Evolution request attempt failed', { url, attempt, code, isAbort });
        if (attempt >= maxAttempts || (err instanceof AppError && code === 'HIDRA_EVOLUTION_HTTP_ERROR')) {
          break; // do not retry non-retryable errors
        }
        await new Promise((r) => setTimeout(r, backoffMs));
      }
    }

    throw new AppError({ code: 'HIDRA_EVOLUTION_REQUEST_FAILED', message: 'All attempts failed', details: { url, error: (lastError as Error)?.message } });
  }
}
