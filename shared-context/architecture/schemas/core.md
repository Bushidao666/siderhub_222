# Schema core

## Visão Geral
- Abriga identidade, sessões e mapa de acesso a funcionalidades do ecossistema.
- Campos auditáveis (`created_at`, `updated_at`) presentes em todas as entidades.
- Usa enums compartilhados `UserRole` e `FeatureAccessKey` (tabela `public`).

## Tabelas

### `core.users`
- **PK**: `id` (`uuid`).
- **Campos principais**: `email` (único), `password_hash`, `role`, colunas normalizadas do `UserProfile` (`profile_display_name`, `profile_avatar_url`, `profile_bio`, `profile_timezone`, `profile_badges[]`, `profile_social_links` como JSON com default `[]`), `last_login_at`, timestamps padrão.
- **Índices**: unique em `email`.
- **Relacionamentos**:
  - 1:N com `core.sessions`, `core.member_access`, academies (`academy.courses`, `course_progress`, comentários), hidra (`campaigns`, `contact_segments`, `message_templates`), cybervault (`resources`, `resource_download_logs`) e admin (`hero_banners`, `feature_toggles`, convites).
  - 1:1 opcional com `hidra.evolution_api_config`.
- **Uso**: identidade e autoria em todos domínios, mantendo campos auditáveis e arrays (`profile_badges`) prontos para filtragem simples.

### `core.sessions`
- **Chave primária**: `id` (`uuid`).
- **Campos**: `user_id`, `refresh_token_hash` (único), `user_agent`, `device` (default `unknown`), `ip_address`, `last_used_at`, `expires_at`.
- **Índices**: `user_id`, `expires_at` para expurgos; hash único previne duplicidade na rotação de refresh tokens.
- **Relacionamentos**: N:1 com `core.users` (cascade). Nenhum cascade para outras tabelas.
- **Uso**: rastrear sessões ativas, metadata de dispositivos, permitir logout seletivo.

### `core.member_access`
- **Chave primária**: `id` (`uuid`).
- **Campos**: `user_id`, `feature` (`FeatureAccessKey`), `enabled`, `permissions` (`text[]`), `granted_by_id`, `granted_at`.
- **Índices**: composto único `(user_id, feature)` e índice em `feature` para filtros por módulo.
- **Relacionamentos**: N:1 com `core.users` (owner) e opcional com usuário que concedeu acesso.
- **Uso**: RBAC granular alimentando front (hub + admin). Services devem tratar `permissions=['*']` como acesso total.

## Notas
- Tanto `core.users` quanto `core.member_access` são fontes para construir payloads de `LoginResponse` (`activeSessions`, `accessMap`).
- Todos os enums residem em `public`, permitindo reuso cross-schema.
