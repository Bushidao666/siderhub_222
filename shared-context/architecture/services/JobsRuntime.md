# Jobs Runtime (BullMQ)

## Purpose
- Centralizar configuração das filas BullMQ usadas para campanhas Hidra, sincronização de métricas e rotinas de limpeza.
- Oferecer inicialização única (`initJobs`) com shutdown gracioso, reutilizável pelo `server.ts`.

## Dependencies
- `bullmq` (`Queue`, `Worker`, `QueueEvents`).
- Redis externo configurado via `REDIS_URL` (fallback `BULLMQ_REDIS_URL`), com prefixo default `siderhub` (`REDIS_PREFIX`).
- `BULLMQ_ENABLED` (default `true`) para desligar filas em ambientes locais/teste.
- Logger (`createLogger('jobs*')`).

## Queues
- `campaign-dispatch` → entrega jobs para disparos Hidra.
- `metrics-sync` → sincroniza métricas (Academy/Hidra/Cybervault/Admin).
- `cleanup` → executa rotinas de limpeza (jobs expirados, logs, auditoria).
- Instanciadas via `createQueues()` (`src/backend/jobs/queues/index.ts`) compartilhando conexão/prefixo.
- `QueueEvents` anexados para registrar `failed`/`error` por fila — importante para observabilidade inicial.

## Workers
- `startCampaignDispatchWorker()` (`src/backend/jobs/workers/CampaignDispatchWorker.ts`) → processa payload `{ campaignId, attemptedAt }`; placeholder integrações Hidra.
- `startMetricsSyncWorker()` (`src/backend/jobs/workers/MetricsSyncWorker.ts`) → processa `{ scope, triggeredAt }`; futuramente chama serviços de métricas.
- `startCleanupWorker()` (`src/backend/jobs/workers/CleanupWorker.ts`) → processa `{ target, triggeredAt }`; implementará limpeza (jobs/logs/tmp).
- Todos os workers retornam `null` quando `REDIS_URL` ausente e logam `warn` para facilitar debugging.
- Eventos `error`/`failed` registrados para evitar falhas silenciosas.

## Scheduling
- `initJobs()` (`src/backend/jobs/index.ts`) instancia filas + workers e agenda dois jobs recorrentes best-effort:
  - `metrics-sync` a cada 60s (`scope: 'academy'` inicial).
  - `cleanup:jobs` a cada 5 min (`target: 'jobs'`).
- `runtimeSafeAdd` encapsula `queue.add` com `catch` para evitar rejeições não tratadas.

## Shutdown
- `shutdownJobs()` garante `close()` em workers, filas e `QueueEvents` via `Promise.allSettled`.
- Invocado pelo `process.on('SIGINT'|'SIGTERM')` no `server.ts` (`src/backend/server.ts:255`).

## Open Items
- Aguardando confirmação do Main sobre políticas de concorrência/backoff/retention (ver pergunta `q-20251103T171555Z-redis-policies-reminder`).
- Workers ainda contêm `TODO` para integração real com Hidra/Métricas/Limpeza.
- Avaliar métricas/observabilidade adicionais (ex.: Prometheus) após políticas definidas.
