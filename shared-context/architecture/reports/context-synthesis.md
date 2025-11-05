# Context Synthesis
Generated: 2025-11-03T17:07:41Z

## Product Objectives & Domains
- North-star: centralizar acesso, engajar Academia, elevar adoção do Hidra, manter Cybervault ativo e atingir NPS > 60 (`PRD_SiderHub.md:33`–`PRD_SiderHub.md:45`).
- Hub: homepage estilo Netflix com banners agendáveis, carrossel de SaaS e overview de métricas Hidra/Academia (`PRD_SiderHub.md:80`–`PRD_SiderHub.md:202`).
- Academia: cursos modulares com drip, player com tracking, ratings e discussões threadadas (`PRD_SiderHub.md:154`–`PRD_SiderHub.md:509`).
- Hidra: conexão Evolution API criptografada, dashboard com totais, wizard de campanhas e logs (`PRD_SiderHub.md:518`–`PRD_SiderHub.md:1130`).
- Cybervault: biblioteca filtrável, tracking de downloads e badges de destaque (`PRD_SiderHub.md:1230`–`PRD_SiderHub.md:1330`).
- Admin & RBAC: gestão de banners/membros/cursos, feature toggles e acesso granular (`PRD_SiderHub.md:1333`–`PRD_SiderHub.md:1504`).

## UI System Essentials
- Tokens neon (`colors`, `surfaces`, `glows`, `typography`) sustentam formulários/Admin/Hidra (`src/shared/design/tokens.ts`).
- Tipografia uppercase com tracking largo aplicada nas páginas principais (ex.: `src/frontend/pages/Hidra/Dashboard.tsx`).
- Componentes comuns (`Button`, `Card`, `Input`) seguem variáveis neon e são reutilizados em Admin/Hidra/Cybervault.

## Architecture & Code Alignment
- Backend — Academy expõe comentários com paginação + replies e moderação; `AcademyService` valida drip/lock antes de criar/listar (ex.: `src/backend/api/academy/index.ts`). Admin inclui `GET /admin/members` com filtros/paginação e RBAC (`src/backend/api/admin/index.ts`). Hidra consolida dashboard e campanhas; BullMQ workers presentes (`src/backend/jobs/workers/*.ts`).
- Frontend state — Query client unificado (`src/frontend/lib/queryClient.ts`) inclui keys para comments/ratings/progress/dashboard; hooks `useLessonComments`, `useCampaignStats`, `useAdminMembers`, `useResourceDownload` estabilizam consumo.
- Frontend UI — `App.tsx` monta rotas guardadas + hidratação. Hidra Dashboard importa `colors/surfaces` corretamente para tint de erro (`src/frontend/pages/Hidra/Dashboard.tsx`). Admin usa `BannerForm`/`MemberTable`; Cybervault detail dispara downloads via hook.
- Testing — Supertest cobre academy/admin/hidra/hub/cybervault; Vitest cobre hooks; Playwright cobre jornadas multi-domínio. Cobertura para workers BullMQ ainda ausente.

## Subagent Ownership Map
- Context agents — manter índices atualizados e sinalizar analyzer para reclassificar recomendações defasadas.
- Backend business logic — garantir auditoria/moderação consistente e contratos de Admin/Hidra estáveis; expor telemetria mínima dos workers.
- Backend API — manter docs de endpoints em `.agents/shared-context/architecture/api/*` alinhadas às respostas reais.
- Frontend-state — validar documentação dos hooks e manter `queryKeys` coerentes, evitando chaves divergentes.
- Frontend-components — substituir placeholders residuais e alinhar tokens/spacing a UI system.
- Testing — adicionar cenários para workers/filas e RBAC/paginação de `GET /admin/members`.

## Gaps & Risks
- Workers BullMQ sem testes: faltam suites unit/integration para filas e workers (`src/backend/jobs/**`).
- Rate limits: rotas sensíveis (register/refresh) sem políticas dedicadas; avaliar `rateLimit.ts`.
- Documentação: garantir atualização contínua de `architecture/api/*.md` após ajustes finos de contratos.
