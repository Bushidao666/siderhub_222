# HidraService & EvolutionClient

## Purpose
- Sincronizar campanhas Hidra com a Evolution API (WhatsApp) mantendo estado local consistente.
- Publicar operações de criação, agendamento, métricas e health-check respeitando credenciais criptografadas.

## Dependencies
- `HidraConfigRepository` → busca credenciais por usuário, faz `upsertForUser` com a chave criptografada e atualiza status/health check.
- `CampaignRepository` → cria campanhas (`externalId`), atualiza status/métricas, fornece detalhes e agrega snapshot via `getDashboardSnapshot`.
- `CampaignRunRepository` → registra execuções agendadas (scheduler jobs).
- `EncryptionService` → criptografa no `updateConfig` e descriptografa `apiKeyEncrypted` antes de instanciar `EvolutionClient`.
- `EvolutionClient` → wrapper HTTP com retries (1s/2s/4s) e timeouts configuráveis.
- Logger (`createLogger('HidraService')`).

## Methods
- `updateConfig({ userId, baseUrl, apiKey, verifyConnection? })` → valida com `hydraConfigSchema`, criptografa a chave via `EncryptionService`, persiste usando `HidraConfigRepository.upsertForUser` e, por padrão, roda `EvolutionClient.testConnection`. Atualiza status `connected|error|disconnected`, registra `lastHealthCheckAt` quando bem-sucedido e retorna `EvolutionApiConfig` (sem plaintext da chave). Erros de expiração/HTTP viram status `error` e ficam registrados em `errorMessage`.
- `testConnection(userId)` → chama `EvolutionClient.testConnection`, atualiza status (`connected|error`) e `lastHealthCheckAt`.
- `getDashboardSummary(userId, { recentLimit? })` → obtém config atual + `CampaignRepository.getDashboardSnapshot`, aplica limite opcional e devolve `HidraDashboardSummary` com `totals`, `messageSummary` e `recentCampaigns` ordenados.
- `createCampaign(input)` → valida com Zod (`userId`, `name`, `segmentId`, etc.), chama Evolution `/campaigns`, persiste local com `externalId`, normaliza status remoto (`CampaignStatus`).
- `scheduleCampaign({ campaignId, scheduledAt, initiatedBy })` → garante presença de `externalId`, chama `/campaigns/:externalId/schedule`, registra run (`CampaignRunRepository.create`), normaliza status.
- `getCampaignMetrics(campaignId)` → sincroniza métricas remotas (`total/delivered/failed/pending/avgMs`) e persiste via `CampaignRepository.updateMetrics` + status.
- `syncEvolutionStatus(campaignId)` → wrapper que roda `getCampaignMetrics` e retorna `CampaignDetail` atualizado.
- `getCampaignDetail(campaignId)` → consulta repositório local.

## EvolutionClient Methods
- `testConnection()` → GET `/`.
- `createCampaign(payload)` → POST `/campaigns` (recebe `id`, `status`, `scheduledAt`).
- `scheduleCampaign(id, payload)` → POST `/campaigns/:id/schedule`.
- `getCampaignMetrics(id)` → GET `/campaigns/:id/metrics` (retorna contagens e status).

## Rules & Notes
- Overrides de `timeoutMs`/`maxAttempts` do `EvolutionClient` vêm de env (`HIDRA_EVOLUTION_TIMEOUT_MS`, `HIDRA_EVOLUTION_MAX_ATTEMPTS`) ou testes; valores fora do range (1s–30s, 1–5 tentativas) são ignorados com warn.
- Status remotos (`draft|scheduled|running|paused|completed|failed`) são mapeados para `CampaignStatus`.
- `externalId` obrigatório para operações Evolution; se ausente → `AppError('HIDRA_CAMPAIGN_MISSING_EXTERNAL_ID')`.
- Falhas na Evolution levantam `AppError` encapsulando a causa; chamadas logadas em `info`/`debug`.
- Defaults: canal `whatsapp`, `maxMessagesPerMinute` 60, `scheduledAt` opcional.
- `ScheduleCampaignInput` exige `initiatedBy` para auditar quem agendou (armazenado em `CampaignRunRepository`).
- `updateConfig` roda verificação imediata por padrão; pode marcar status `error` sem lançar exceção para permitir novas tentativas.
- `getDashboardSummary` limita `recentCampaigns` conforme `recentLimit` (default valores agregados zerados).

## Exposed By
- `src/backend/services/hidra/HidraService.ts`
- `src/backend/services/hidra/EvolutionClient.ts`
- `src/backend/services/hidra/index.ts`

## Consumed By
- subagent-backend-api (rotas `/api/hidra/*`)
- subagent-testing (mocks/fixtures)
- Jobs futuros (`syncEvolutionStatus`) para atualizar métricas.

## Hardening Plan — EvolutionClient & HidraService (2025-11-03)

### Configuração & Timeouts
- Expor parâmetros via env (`HIDRA_EVOLUTION_TIMEOUT_MS`, `HIDRA_EVOLUTION_MAX_ATTEMPTS`, `HIDRA_EVOLUTION_RETRY_BACKOFF_MS`) e injetar na factory em `src/backend/server.ts` para tornar o `EvolutionClient` configurável por ambiente.
- Padronizar timeout default para `8000ms`, com `maxAttempts` inicial `3` e backoff progressivo (`baseBackoffMs`, multiplicador 2). Documentar fallback seguro (`max 5 tentativas`) para evitar saturação.
- Registrar no progress tracker que toda chamada deve propagar `AppError` com `code` específico (`HIDRA_EVOLUTION_TIMEOUT`, `HIDRA_EVOLUTION_ABORTED`) ao exceder limites, assegurando que API possa diferenciar retryável x fatal.

### Observabilidade & Métricas
- Incluir `logger.debug/info` com `attempt`, `durationMs`, `status` para cada requisição Evolution, guardando `requestId` vindo do middleware quando disponível.
- Expor hooks para métricas (placeholder `metrics?.increment('hidra_evolution_success')`) para integração futura com Prometheus; manter assinatura opcional para não bloquear testes.
- Persistir `lastEvolutionSyncAt` e `lastEvolutionSyncStatus` no snapshot do repositório (nova coluna proposta) para que o Hub/Frontend exibam estado de sincronização.

### Degradação Gradual & Fallback
- `getCampaignMetrics` e `syncEvolutionStatus` devem retornar dados locais (último snapshot) quando a Evolution estiver indisponível, adicionando flag `isStale: true` no DTO.
- `getDashboardSummary` manterá fallback atual, mas precisa logar warning único por janela (ex.: 5 minutos) para evitar ruído.
- Garantir que `HubService` receba `HidraDashboardSummary` com `null` ou `isStale` sinalizado, permitindo frontend exibir mensagens de degradação.

### Próximos Passos Coordenados
1. Implementar variáveis de ambiente + wiring em `server.ts`.
2. Ajustar `EvolutionClient` para aceitar config estruturada (`timeoutMs`, `maxAttempts`, `baseBackoffMs`, `maxBackoffMs`).
3. Atualizar `HidraService` com camada de fallback/flag `isStale` e métricas básicas.
4. Alinhar rotas `/api/hidra/*` (backend-api) para incluir metadados (`isStale`, `lastSyncAt`) nos payloads.
