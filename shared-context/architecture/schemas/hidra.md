# Schema hidra

## Visão Geral
- Focado em orquestrar campanhas WhatsApp via Evolution API, com config criptografada e telemetria.
- Usa enums `CampaignStatus`, `CampaignChannel`, `EvolutionConnectionStatus`, `ContactImportSource`.
- Chaves estrangeiras evitam cascata destrutiva onde histórico precisa ser preservado (segmentos/template com `Restrict`).

## Tabelas

### `hidra.evolution_api_config`
- **PK**: `id` (`uuid`); **Unique**: `user_id`.
- **Campos**: `base_url`, `api_key_encrypted` (`bytea`), `connected_at`, `last_health_check_at`, `status`, `error_message`.
- **Relacionamentos**: 1:1 com `core.users` (cascade). Campanhas referenciam config opcionalmente.
- **Uso**: persistir credenciais criptografadas (libsodium) e health check.

### `hidra.contact_segments`
- **PK**: `id` (`uuid`).
- **Campos**: `user_id`, `name`, `description`, `import_source`, `total_contacts`.
- **Relacionamentos**: N:1 com `core.users`; 1:N com `hidra.campaigns` (`Restrict` impede apagar segmento ativo sem migração).
- **Uso**: listas de disparo segmentadas.

### `hidra.message_templates`
- **PK**: `id` (`uuid`).
- **Campos**: `user_id`, `title`, `body`, `variables[]`, `media_url`.
- **Relacionamentos**: N:1 com `core.users`; 1:N com `hidra.campaigns` (`Restrict`).
- **Uso**: templates reutilizáveis com placeholders.

### `hidra.campaigns`
- **PK**: `id` (`uuid`).
- **Campos**: `user_id`, `evolution_config_id` (opcional), `name`, `description`, `channel`, `status`, timestamps (`scheduled_at`, `started_at`, `completed_at`), `segment_id`, `template_id`, `external_id`, `max_messages_per_minute`.
- **Índices/Constraints**: unique `external_id` (idempotência com Evolution API) e `(user_id, status)` para dashboard filtrado.
- **Relacionamentos**: N:1 com `core.users` (owner), `hidra.evolution_api_config` (opcional), `contact_segments`, `message_templates`; 1:N com `campaign_runs`, 1:1 com `campaign_metrics`, 1:N com `campaign_timeline_points`.
- **Uso**: entidade central da orquestração; status reflete lifecycle (draft → completed/failed).

### `hidra.campaign_runs`
- **PK**: `id` (`uuid`).
- **Campos**: `campaign_id`, `initiated_by`, `started_at`, `ended_at`, `status`, `summary`.
- **Relacionamentos**: N:1 com `campaigns` (cascade) e `core.users` (initiator `Restrict`).
- **Uso**: histórico de execuções/disparos.

### `hidra.campaign_metrics`
- **PK**: `campaign_id` (`uuid`).
- **Campos**: `total_messages`, `delivered`, `failed`, `pending`, `average_delivery_ms`, `last_updated_at`.
- **Relacionamentos**: 1:1 com `campaigns` (cascade).
- **Uso**: agregados de performance, guardados atomically para leitura rápida pelo dashboard.

### `hidra.campaign_timeline_points`
- **PK**: `id` (`uuid`); **Unique**: `(campaign_id, timestamp)` para evitar duplicidade por tick.
- **Campos**: `timestamp`, `delivered`, `failed`.
- **Relacionamentos**: N:1 com `campaigns` (cascade).
- **Uso**: série temporal para charts de evolução de envios.

### View `hidra.campaign_owner_metrics_view`
- **Campos**: `owner_id`, `total_campaigns`, `running_campaigns`, `scheduled_campaigns`, `delivered_messages`, `failed_messages`, `pending_messages`.
- **Fonte**: agrega `hidra.campaigns` + `hidra.campaign_metrics` (LEFT JOIN) resumindo métricas por owner.
- **Uso**: alimentar cards de métricas no Hub/Admin sem recalcular agregados a cada request.

## Notas
- Campos `api_key_encrypted` armazenam bytes criptografados; services devem cuidar de envelope libsodium.
- `max_messages_per_minute` suporta throttling; índices permitem dashboards filtrarem por `status` rapidamente.
- View substitui consultas manuais para overview; services devem considerar `COALESCE` já aplicado nos totais.
