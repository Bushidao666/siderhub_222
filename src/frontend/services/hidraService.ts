import { ApiClient } from '../../shared/utils/apiClient';
import { assertSuccess, mapApiError } from '../../shared/utils/errorHandler';
import type {
  CampaignDetail,
  ContactSegment,
  CreateCampaignPayload,
  EvolutionApiConfig,
  HidraDashboardSummary,
  MessageTemplate,
  UpdateEvolutionConfigRequest,
} from '../../shared/types/hidra.types';
import { selectIsAuthenticated, useAuthStore } from '../store/auth';

const hidraApiClient = new ApiClient({
  getAccessToken: () => useAuthStore.getState().accessToken,
  onUnauthenticated: () => {
    void useAuthStore.getState().logout();
  },
});

const ensureAuthenticated = () => {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  if (!isAuthenticated) {
    throw new Error('Usuário não autenticado');
  }
};

export const hidraService = {
  async fetchDashboardSummary(): Promise<HidraDashboardSummary> {
    ensureAuthenticated();
    const response = await hidraApiClient.get<HidraDashboardSummary>('/hidra/dashboard');
    assertSuccess<HidraDashboardSummary>(response);
    return response.data;
  },
  async fetchSegments(): Promise<ContactSegment[]> {
    ensureAuthenticated();
    const response = await hidraApiClient.get<ContactSegment[]>('/hidra/segments');
    assertSuccess<ContactSegment[]>(response);
    return response.data;
  },
  async fetchTemplates(): Promise<MessageTemplate[]> {
    ensureAuthenticated();
    const response = await hidraApiClient.get<MessageTemplate[]>('/hidra/templates');
    assertSuccess<MessageTemplate[]>(response);
    return response.data;
  },
  async updateEvolutionConfig(payload: UpdateEvolutionConfigRequest): Promise<EvolutionApiConfig> {
    ensureAuthenticated();
    const response = await hidraApiClient.put<EvolutionApiConfig, UpdateEvolutionConfigRequest>(
      '/hidra/config',
      payload,
    );
    assertSuccess<EvolutionApiConfig>(response);
    return response.data;
  },
  async createCampaign(payload: CreateCampaignPayload): Promise<CampaignDetail> {
    ensureAuthenticated();
    const response = await hidraApiClient.post<CampaignDetail, CreateCampaignPayload>(
      '/hidra/campaigns',
      payload,
    );
    assertSuccess<CampaignDetail>(response);
    return response.data;
  },
};

export const handleHidraError = (error: unknown): string => {
  const message = mapApiError(error);
  console.error('Hidra request failed', message);
  return message;
};
