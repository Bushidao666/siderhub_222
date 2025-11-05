# Schema admin

## Visão Geral
- Reúne entidades administradas pelo painel (banners, feature flags, convites e overrides de acesso).
- Conecta-se com `core.users` para autoria/controle de permissão.
- Usa enums `BannerStatus`, `FeatureToggleStatus`, `InvitationStatus` e `FeatureAccessKey[]`.

## Tabelas

### `admin.hero_banners`
- **PK**: `id` (`uuid`).
- **Campos**: títulos, descrições, CTAs (primária/secundária com `label/href/external`; flag primária default `false`), `image_url`, `order`, `status`, janela `starts_at`/`ends_at`, `created_by_id`.
- **Índices**: `status`, `(status, order)` para suportar ordenação do hub com filtro por visibilidade ativa.
- **Relacionamentos**: N:1 com `core.users` (`Restrict` para manter histórico de autoria).
- **Uso**: hero do hub; `order` determina empilhamento; status permite scheduling.

### `admin.feature_toggles`
- **PK**: `id` (`uuid`); **Unique**: `feature_key`.
- **Campos**: `description`, `status` (`enabled/disabled/gradual`), `rollout_percentage`, timestamps.
- **Relacionamentos**: N:1 com `core.users` (criador, `Restrict`).
- **Uso**: governança de rollout de funcionalidades (ex.: liberar Cybervault gradualmente).

### `admin.member_access_overrides`
- **PK**: `id` (`uuid`); **Unique**: `(user_id, feature)`.
- **Campos**: `user_id`, `feature` (`text` para aceitar chaves custom), `enabled`, `permissions[]`, `reason`, `granted_by_id`, `granted_at`.
- **Relacionamentos**: N:1 com `core.users` tanto para o owner (cascade) quanto para quem concedeu (restrict).
- **Uso**: sobrescrever mapa padrão (`core.member_access`), permitindo exceções por membro.

### `admin.invitation_templates`
- **PK**: `id` (`uuid`).
- **Campos**: `name`, `subject`, `body_markdown`, `visibility`, `created_at`.
- **Uso**: base para e-mails/mensagens de convite no painel.

### `admin.invitations`
- **PK**: `id` (`uuid`); **Unique**: `code`.
- **Campos**: `email`, `role`, `status`, `invited_by_id`, `granted_access` (`FeatureAccessKey[]`), `expires_at`, `accepted_by_id`, `accepted_at`, `created_at`.
- **Relacionamentos**: N:1 com `core.users` para `invited_by` (restrict) e opcionalmente `accepted_by`; 1:N com `core.users` (lista inversa). Cascata evita órfãos em deleção de membros.
- **Uso**: fluxo de onboarding, alimenta `RegisterRequest.inviteCode` e monitoramento de convites pendentes.

## Notas
- Migrations incluem ajuste para `feature` (`text`) em overrides, permitindo chaves externas.
- Ao revogar acesso, services devem tratar overrides + `core.member_access` de forma consistente.
