# AdminService

## Purpose
- Centraliza operações administrativas: banners do hub, toggles de funcionalidades e overrides de acesso de membros.
- Garante validação consistente (Zod + shared schemas) antes da camada de API.

## Dependencies
- `BannerRepository` → CRUD dos banners (ordem, CTAs, agendamento).
- `FeatureToggleRepository` → listar e atualizar status/rollout das flags.
- `MemberAccessRepository` → recuperar/permutar access map consolidado por usuário (Hidra, Cybervault, Academy, etc.).
- `MemberAccessOverrideRepository` → criar/remover overrides por feature.
- `InvitationRepository` → listar convites pendentes/ativos, impedir duplicidades (`findPendingByEmail`) e criar registros.
- `UserRepository` → listar membros com filtros (page, pageSize, role, search) e recuperar dados básicos/metadata.
- `bannerSchema` de `@utils/validation` para validar payloads.
- `emailSchema` de `@utils/validation` para convites.
- Logger (`createLogger('AdminService')`).

## Methods
- `listMembers(filters?)` → aplica validação Zod (`page>=1`, `pageSize<=100`, `role?`, `search? 2..160`), delega `UserRepository.list` e agrega `MemberAccessRepository.getAccessMapByUser` retornando `PaginatedResponse<AdminMemberItem>`.
- `listBanners()` → retorna todos `HeroBanner`.
- `createBanner(params)` → valida schema estendido (`order`, `createdBy`), persiste via `BannerRepository.create`.
- `updateBanner(id, params)` → valida update (ordem opcional, `updatedBy`), verifica consistência de schedule e atualiza via repositório.
- `deleteBanner(id)` → remove banner e retorna `{ ok: true }`.
- `getFeatureToggles()` → devolve `FeatureToggle[]`.
- `updateFeatureToggle(id, status, rolloutPercentage?)` → aplica regra: somente `gradual` aceita rollout.
- `setAccessOverride(userId, feature, enabled, permissions, options?)` → valida `FeatureAccessKey`, delega para repositório com `grantedBy`/`reason`.
- `removeAccessOverride(userId, feature)` → apaga override existente.
- `listInvitations(filters?)` → usa `InvitationRepository.list`, normalizando `limit` (default 50) e aceitando `status`/`search`. Retorna `Invitation[]`.
- `createInvitation(params)` → valida expiração (`expiresAt > now`), impede duplicidade (`findPendingByEmail`), gera código (`UUID` sanitizado) e persiste via `InvitationRepository.create`. Erros: `ADMIN_INVITE_INVALID_EXPIRY` (400) e `ADMIN_INVITE_DUPLICATE` (409).

## Notes
- Zod garante limites de `bannerSchema` (URLs, CTAs) e `permissions` (até 20 itens).
- `setAccessOverride` default `grantedBy = userId` quando `options.grantedBy` não informado (útil para testes/scripts).
- Todos métodos logam operações (`info`).
- Repositórios devem lidar com transações/ordenação.
- `createInvitation` retorna `Invitation` já com `grantedAccess` e não expõe plaintext do token (apenas `code`).
- `listMembers` exige RBAC (`admin|super_admin` via camada API) e mantém `accessMap` completo por membro para alimentar `/admin/members` (sem paginação cursor neste ciclo).

## Exposed By
- `src/backend/services/admin/AdminService.ts`
- Export em `src/backend/services/admin/index.ts`

## Consumed By
- subagent-backend-api (`/api/admin/*` rotas)
- subagent-frontend-state (painel admin)
- subagent-testing (mocks em testes unitários)
