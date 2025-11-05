# Injeção de Tarefas — Context Analyzer

## [2025-11-03T05:20:29-03:00] Análise de Gaps e Atribuições

### subagent-backend-api
Status Atual: pending (antes: completed)
Tarefas Adicionadas:
- [ANALYZER] Add GET /hub/banners?status=active
- [ANALYZER] Add GET /academy/courses/featured
- [ANALYZER] Add GET /academy/courses/recommended
- [ANALYZER] Add GET /hidra/campaigns/metrics/overview
Justificativa: Frontend usa useHubData.ts; endpoints inexistentes no backend.
Prioridade: P0
Progress %: 100 → 85

### subagent-backend-business-logic
Status Atual: pending (antes: completed)
Tarefas Adicionadas:
- [ANALYZER] Wire Academy/Cybervault/Hidra/Admin services in server
- [ANALYZER] Create HubService aggregator (banners, featured, recs, metrics)
- [ANALYZER] AcademyService: implement lesson ratings (avg + CRUD)
- [ANALYZER] AcademyService: implement advanced drip rules (days/date/after completion)
Justificativa: PRD exige recursos ainda não suportados; server com stubs.
Prioridade: P0/P1
Progress %: 100 → 80

### subagent-frontend-state
Status Atual: pending (antes: completed)
Tarefas Adicionadas:
- [ANALYZER] Add useLessonRating hook (get/set)
- [ANALYZER] Add useVideoProgress hook (10s events, debounce)
- [ANALYZER] Update useHubData para endpoints /hub
Justificativa: Suporte aos novos endpoints e tracking de progresso/ratings.
Prioridade: P1
Progress %: 100 → 85

### subagent-frontend-components
Status Atual: pending (antes: completed)
Tarefas Adicionadas:
- [ANALYZER] LessonPlayer: star rating UI + average
- [ANALYZER] LessonPlayer: progress events + 90% complete
- [ANALYZER] HubHome: métricas overview
- [ANALYZER] Verificar tracking de download no DownloadModal
Justificativa: Alinhar UI ao PRD.
Prioridade: P1
Progress %: 100 → 90

### subagent-database
Status Atual: pending (antes: completed)
Tarefas Adicionadas:
- [ANALYZER] Prisma: ratings + progress events/aggregate
- [ANALYZER] Migrações e índices
Justificativa: Persistência para novas features.
Prioridade: P1
Progress %: 100 → 85

### subagent-testing
Status Atual: working (antes: working)
Tarefas Adicionadas:
- [ANALYZER] API tests: /hub/*, academy ratings/progress
- [ANALYZER] UI tests: rating + progress
Justificativa: Cobertura para endpoints/UI recém-adicionados.
Prioridade: P1
Progress %: 55 → 60
# Injeção de Tarefas — Context Analyzer

## [2025-11-03T08:22:43Z] Lote inicial

### subagent-backend-api
Status Novo: pending
Tarefas Adicionadas:
- Expor GET /hub/banners?status=active
- GET /academy/courses/featured
- GET /academy/courses/recommended
- Alias GET /hidra/campaigns/metrics/overview
- POST /academy/lessons/:id/rating e GET média
- POST /academy/lessons/:id/progress-tick (10s)

### subagent-frontend-state
Status Novo: pending
Tarefas Adicionadas:
- Ajustar useHubData para novos endpoints (ou alias)
- Hook useLessonVideoTracking (ticks 10s)
- Hook useLessonRating (submit/average)
- Registrar download em /cybervault/resources/:id/download

### subagent-frontend-components
Status Novo: pending
Tarefas Adicionadas:
- Integrar Video.js 8 no LessonPlayer
- Substituir cores RGBA por tokens no EvolutionConfigForm
- Componente RatingStars (1-5)

### subagent-backend-business-logic
Status Novo: pending
Tarefas Adicionadas:
- Drip policies: dias e após conclusão (AcademyService)
- Service + repos para Lesson Rating (create/avg)
- Persistência agregada de progresso (ticks)

### subagent-database
Status Novo: pending
Tarefas Adicionadas:
- Prisma models para ratings e progresso
- Migração + índices

## [2025-11-03T05:47:36-03:00] Consolidação de tasks_remaining

### subagent-backend-api
Status Atual: pending
Tasks:
- [ANALYZER] Expor GET /api/hub/banners?status=active com filtros e cache
- [ANALYZER] Implementar GET /api/academy/courses/featured
- [ANALYZER] Implementar GET /api/academy/courses/recommended
- [ANALYZER] Adicionar alias GET /api/hidra/campaigns/metrics/overview alinhado ao dashboard
- [ANALYZER] Implementar POST /api/academy/lessons/:id/rating e GET média
- [ANALYZER] Implementar POST /api/academy/lessons/:id/progress-tick (janela 10s)

### subagent-backend-business-logic
Status Atual: pending
Tasks:
- [ANALYZER] Wire services (Academy/Cybervault/Hidra/Admin) no server.ts
- [ANALYZER] Criar HubService aggregator (banners, featured, recs, metrics)
- [ANALYZER] AcademyService: ratings (create/update + média; 1 por usuário)
- [ANALYZER] AcademyService: drip (por dias, por data, após conclusão)
- [ANALYZER] Persistência agregada de progresso (ticks 10s + agregação)
- [ANALYZER] Remover casts any/unknown via mapeadores Prisma<->Domínio
- [ANALYZER] EvolutionClient: validar respostas com Zod
- [ANALYZER] TokenService: tipar expiresIn sem any

### subagent-database
Status Atual: pending
Tasks:
- [ANALYZER] Prisma: lesson_ratings (unique userId+lessonId, value 1..5)
- [ANALYZER] Prisma: lesson_progress_events (userId, lessonId, occurredAt, positionSec)
- [ANALYZER] Prisma: lesson_progress_aggregate (lastPositionSec, percentage)
- [ANALYZER] Preparar migrations + seeds mínimas + índices
- [ANALYZER] Atualizar prisma/seed.ts com exemplos

### subagent-frontend-components
Status Atual: pending
Tasks:
- [ANALYZER] Integrar Video.js 8 no LessonPlayer (quality-levels + hotkeys + progress)
- [ANALYZER] LessonPlayer: emitir eventos de progresso (ticks 10s + alerta 90%)
- [ANALYZER] LessonPlayer: UI de rating (RatingStars 1–5 + média)
- [ANALYZER] Substituir RGBA literais por tokens no EvolutionConfigForm
- [ANALYZER] HubHome: cards de métricas overview (Hidra)
- [ANALYZER] DownloadModal: confirmar download e invocar tracking

### subagent-frontend-state
Status Atual: pending
Tasks:
- [ANALYZER] Ajustar useHubData para novos endpoints /api/hub e academy/hidra alias
- [ANALYZER] Criar hook useLessonVideoTracking (ticks 10s, debounce, retry)
- [ANALYZER] Criar hook useLessonRating (fetch média + submit otimista)
- [ANALYZER] Integrar POST /api/cybervault/resources/:id/download no fluxo
- [ANALYZER] Atualizar query keys e invalidations para ratings/progresso

### subagent-testing
Status Atual: working
Tasks:
- [ANALYZER] API tests: /api/hub/banners + academy featured/recommended + lessons rating/progress
- [ANALYZER] UI/E2E tests: fluxo de rating e progresso (Video.js tracking)


## [2025-11-03T05:52:25-03:00] Reaplicação pós-overwrite

### subagent-backend-api
Status Atual: pending
Tasks:
- [ANALYZER] Substituir stubs no server.ts com serviços reais (Auth/Academy/Hidra/Cybervault/Admin)
- [ANALYZER] Criar router /api/hub com GET /hub/banners?status=active (cache + filtros)
- [ANALYZER] Implementar GET /api/academy/courses/featured
- [ANALYZER] Implementar GET /api/academy/courses/recommended
- [ANALYZER] Adicionar alias GET /api/hidra/campaigns/metrics/overview alinhado ao dashboard
- [ANALYZER] Implementar POST /api/academy/lessons/:id/rating e GET média
- [ANALYZER] Implementar POST /api/academy/lessons/:id/progress-tick (janela 10s)
- [ANALYZER] Validar POST /api/cybervault/resources/:id/download e alinhar ApiResponse
- [ANALYZER] Aplicar rate limiting nos endpoints críticos + requestId/meta
- [ANALYZER] Atualizar documentação API + testes Supertest para novos endpoints


## [$timestamp] Alinhamento pós-entrega Fase 3

### subagent-frontend-state
Status Atual: pending (antes: working)
Tarefas Adicionadas:
- [ANALYZER] Realinhar useHubData com HubOverviewPayload de /api/hub (banners/featured/recommendations/campaignMetrics) e só cair para alias quando o agregador falhar.
- [ANALYZER] Ajustar useLessonRating para lidar com POST /academy/lessons/:id/rating retornando LessonRating (repopular summary com novo fetch ou map de resposta) sem corromper o cache.
- [ANALYZER] Atualizar useLessonVideoTracking: converter payload para positionSeconds, remover campos não suportados e consumir o snapshot de progresso exposto pelo backend antes de retomar ticks.
Justificativa: Contratos divergentes entre hooks (Hub/lesson rating/progress) e as rotas recém-entregues.
Prioridade: P0/P1

### subagent-backend-api
Status Atual: pending (antes: working)
Tarefas Adicionadas:
- [ANALYZER] Expor GET /academy/lessons/:id/progress retornando LessonProgressAggregate (resume playback) e documentar payload.
- [ANALYZER] Harmonizar POST /academy/lessons/:id/rating para devolver LessonRatingSummary (média + total + userRating) ou atualizar doc/resposta e sincronizar clientes.
Justificativa: Frontend-state depende de snapshot de progresso e summary após submit de rating.
Prioridade: P0/P1

### subagent-frontend-components
Status Atual: pending (antes: working)
Tarefas Adicionadas:
- [ANALYZER] Atualizar HubMetricsOverview para aceitar HidraMessageSummary (sem campaignId) vindo de /api/hidra/campaigns/metrics/overview e sincronizar docs/tests.
Justificativa: Hook useHubData passa resumo Hidra sem campaignId; componente atual assume CampaignMetrics.
Prioridade: P1

## [2025-11-03T09:48:08Z] Navegação e páginas finais

### subagent-frontend-components
Status Proposto: pending
Tasks:
- [ANALYZER] Entregar App shell com React Router, layouts protegidos e reutilização do queryClient compartilhado
- [ANALYZER] Criar páginas Hidra (dashboard, campanhas, wizard, configurações) conectando componentes existentes
- [ANALYZER] Criar páginas Cybervault (biblioteca, detalhe) integrando DownloadModal e filtros
- [ANALYZER] Criar páginas Admin (dashboard, banners, members/feature toggles) alinhadas ao PRD
- [ANALYZER] Adicionar telas da Academia (CourseDetail, LessonDetail) e corrigir exports duplicados em pages/index.ts

### subagent-frontend-state
Status Proposto: pending
Tasks:
- [ANALYZER] Implementar hook useLessonComments com cache, optimistic update e documentação
- [ANALYZER] Implementar hook useCourseTree com carregamento lazy e invalidation coerente
- [ANALYZER] Expor utilitários de hidratação do queryClient e atualizar App para consumir instância compartilhada

### subagent-testing
Status Proposto: working
Tasks:
- [ANALYZER] Remover stub legacy tests/backend/services/AcademyService.test.ts e consolidar cenários
- [ANALYZER] Planejar/estender testes (integration/E2E) cobrindo rotas Hidra/Cybervault/Admin após implementação

## [2025-11-03T10:24:06Z] Realinhamento pós-resume — backlog crítico reaberto

### subagent-backend-api
Status Atual: pending
Tarefas Reforçadas:
- [ANALYZER] Substituir stubs no server.ts com serviços reais (Auth/Academy/Hidra/Cybervault/Admin)
- [ANALYZER] Criar router /api/hub com GET /hub/banners?status=active (cache + filtros)
- [ANALYZER] Implementar GET /api/academy/courses/featured
- [ANALYZER] Implementar GET /api/academy/courses/recommended
- [ANALYZER] Adicionar alias GET /api/hidra/campaigns/metrics/overview alinhado ao dashboard
- [ANALYZER] Implementar POST /api/academy/lessons/:id/rating retornando LessonRatingSummary
- [ANALYZER] Implementar POST /api/academy/lessons/:id/progress-tick (janela 10s)
- [ANALYZER] Expor GET /api/academy/lessons/:id/progress com LessonProgressAggregate
- [ANALYZER] Validar POST /api/cybervault/resources/:id/download e alinhar ApiResponse
- [ANALYZER] Aplicar rate limiting + requestId/logging nos endpoints críticos
- [ANALYZER] Atualizar documentação API e testes Supertest para novos contratos
Justificativa: Frontend-state/Testing continuam bloqueados pelos contratos de Hub, ratings e progress. Hardening obrigatório para liberar Playwright.
Progress % sugerido: 55

### subagent-backend-business-logic
Status Atual: pending
Tarefas Reforçadas:
- [ANALYZER] Instanciar services concretos no server.ts eliminando {} as any
- [ANALYZER] Criar HubService agregando banners, destaque/recomendações e métricas Hidra
- [ANALYZER] AcademyService: registrar/atualizar ratings e summary único por usuário
- [ANALYZER] AcademyService: consolidar progress ticks em snapshot + drip policies (dias, data, conclusão)
- [ANALYZER] Modelar repositories Prisma para ratings/progress/hub agregados
- [ANALYZER] Remover casts any/unknown via mapeadores Prisma<->domínio
- [ANALYZER] EvolutionClient: adicionar timeout/backoff e validar respostas com Zod
- [ANALYZER] TokenService: tipar expiresIn e fortalecer segurança
- [ANALYZER] Documentar serviços atualizados e adicionar testes de integração críticos
Justificativa: API depende dos serviços concretos para expor novos endpoints; casts e validação ainda pendentes.
Progress % sugerido: 50

### subagent-database
Status Atual: pending
Tarefas Reforçadas:
- [ANALYZER] Adicionar tabela academy.lesson_ratings com índice único (lessonId,userId)
- [ANALYZER] Adicionar tabela academy.lesson_progress_events (positionSec, occurredAt)
- [ANALYZER] Adicionar tabela academy.lesson_progress_aggregate (lastPositionSec, completion)
- [ANALYZER] Gerar migrations sequenciais e aplicar (ratings/progress)
- [ANALYZER] Atualizar prisma/seed.ts com ratings/progress demo
- [ANALYZER] Documentar novos schemas em architecture/schemas/*.md e notificar dependências
Justificativa: Services/API aguardam persistência para liberar jornadas de rating e retomada de lição.
Progress % sugerido: 55

### subagent-frontend-state
Status Atual: pending
Tarefas Reforçadas:
- [ANALYZER] Consolidar queryClient compartilhado e utilitários de hidratação no App shell
- [ANALYZER] Realinhar useHubData com payload do HubService e fallback p/ aliases
- [ANALYZER] Ajustar useLessonRating para consumir LessonRatingSummary sem corromper cache
- [ANALYZER] Atualizar useLessonVideoTracking (positionSeconds + resume snapshot)
- [ANALYZER] Criar hook useLessonComments com optimistic update e threads
- [ANALYZER] Criar hook useCourseTree com drip rules e invalidation coerente
- [ANALYZER] Integrar POST /api/cybervault/resources/:id/download com tracking e invalidations
Justificativa: App shell depende destes hooks para jornadas completas; cache duplicado e respostas divergentes causam regressões.
Progress % sugerido: 45

## [2025-11-03T10:56:00+00:00] Ajustes — Downloads e progresso da Academia

### subagent-frontend-state
Status Atual: pending (antes: completed)
Tarefas Adicionadas:
- [ANALYZER] Ajustar useResourceDownload/useResourceLibrary para usar ApiResponse<{ ok: true; totalDownloads }> e propagar total atualizado para o UI.
- [ANALYZER] Alinhar useCourseProgress/useCoursesProgressMap com endpoints reais (coordenação com backend para GET/PATCH progress) e adicionar fallback até a API estar disponível.
Justificativa: API já responde com totalDownloads e ainda não oferece endpoints de progresso; os hooks atuais retornam dados inconsistentes e o Hub segue sem percentuais.
Prioridade: P0

### subagent-frontend-components
Status Atual: in_progress (sem alteração)
Tarefas Adicionadas:
- [ANALYZER] Atualizar componentes do Cybervault (ResourceCard/DownloadModal/FilterBar) para consumir totalDownloads do hook ajustado e manter data-testids/UX alinhados.
Justificativa: A UI ainda assume recibos detalhados e ignora a contagem agregada devolvida pela API.
Prioridade: P1

### subagent-backend-api
Status Atual: pending (antes: consulting)
Tarefas Adicionadas:
- [ANALYZER] Expor GET e PATCH /academy/courses/:courseId/progress retornando CourseProgress para o usuário autenticado (coordenação com AcademyService) e atualizar docs/tests.
- [ANALYZER] Implementar GET /admin/dashboard entregando métricas básicas alinhadas ao hook useAdminDashboard e documentar contrato.
Justificativa: Hooks do frontend dependem de endpoints inexistentes hoje (progresso da Academia e dashboard admin) e permanecem em modo placeholder/erro.
Prioridade: P0

### subagent-backend-business-logic
Status Atual: pending (sem alteração)
Tarefas Adicionadas:
- [ANALYZER] Expor método em AcademyService para recuperar CourseProgress do usuário/curso e dar suporte aos novos endpoints de progresso.
Justificativa: API precisa de suporte direto no serviço para entregar progresso/summary consistentes sem duplicar lógica.
Prioridade: P0

## [2025-11-03T13:10:00Z] Hardening pós-entrega — contratos Hub/Cybervault

### subagent-backend-business-logic
Status Atual: in_progress
Tarefas Adicionadas:
- [ANALYZER] Substituir where as any em PrismaInvitationRepository.list por filtros tipados coerentes com ListInvitationFilters
- [ANALYZER] Ajustar CybervaultService.recordDownload para retornar receipt consistente (totalDownloads/lastDownloadedAt) e atualizar documentação/tests
- [ANALYZER] Expor configuração de timeout/backoff do EvolutionClient via HidraService e documentar parâmetros esperados
- [ANALYZER] Expor método em AcademyService para recuperar CourseProgress do usuário/curso e dar suporte aos novos endpoints de progresso
Justificativa: API e frontend dependem de contratos confiáveis para convites, downloads, resiliência Hidra e progresso da Academia.
Prioridade: P1

### subagent-backend-api
Status Atual: pending
Tarefas Adicionadas:
- [ANALYZER] Expor GET e PATCH /academy/courses/:courseId/progress retornando CourseProgress para o usuário autenticado (coordenação com AcademyService) e atualizar docs/tests.
- [ANALYZER] Implementar GET /admin/dashboard entregando métricas básicas alinhadas ao hook useAdminDashboard e documentar contrato.
Justificativa: Hooks do frontend dependem de endpoints inexistentes hoje (progresso da Academia e dashboard admin) e permanecem em modo placeholder/erro.
Prioridade: P0

### subagent-frontend-state
Status Atual: pending
Tarefas Adicionadas:
- [ANALYZER] Atualizar useHubData para consumir HubOverview nested (academy/hidra/cybervault) e revisar HubDataResult + testes MSW
- [ANALYZER] Ajustar useResourceDownload para o novo ResourceDownloadReceipt (ok/totalDownloads/lastDownloadedAt) e sincronizar tipos compartilhados
- [ANALYZER] Revisar documentação hooks (useHubData/useResourceDownload) e hidratação para refletir contratos atualizados
Justificativa: Hooks precisam espelhar o contrato final para evitar regressões no Hub e Cybervault.
Prioridade: P1

### subagent-frontend-components
Status Atual: in_progress
Tarefas Adicionadas:
- [ANALYZER] Refatorar HubHome e componentes associados para consumir HubOverview nested (academy, hidra, cybervault) e atualizar estados/tests
- [ANALYZER] Ajustar ResourceCard/ResourceLibrary para usar o novo ResourceDownloadReceipt (totalDownloads/live toast) e sincronizar contadores
- [ANALYZER] Atualizar documentação em architecture/components/* e mapping de data-testids para páginas Hub/Hidra/Cybervault/Admin
- [ANALYZER] Validar integrações com hooks atualizados (useHubData/useResourceDownload) garantindo design tokens e acessibilidade
Justificativa: UI deve refletir os contratos finais e manter rastreabilidade de testes.
Prioridade: P1

### subagent-testing
Status Atual: working
Tarefas Adicionadas:
- [ANALYZER] Implementar testes de integração para HubOverview nested e recibo de download do Cybervault (Supertest)
- [ANALYZER] Atualizar testes RTL/MSW para HubHome e ResourceLibrary consumindo useHubData/useResourceDownload ajustados
- [ANALYZER] Estender fluxo Playwright cobrindo login → hub → hidra → cybervault → admin validando toasts/metrics
- [ANALYZER] Consolidar relatórios de coverage atualizados e documentar em docs/testing.md
Justificativa: Cobertura precisa validar os novos contratos antes do handoff final.
Prioridade: P1

## [2025-11-03T11:46:16Z] Ajuste de escopo — threads, moderação, admin members e workers

### subagent-backend-api
Status Atual: blocked (70%)
Tarefas Atualizadas:
- [ANALYZER] Criar POST `/academy/lessons/:lessonId/comments/:commentId/replies` e ajustar GET para retornar replies aninhadas com `pendingModeration`, cobrindo validação Zod + Supertest.
- [ANALYZER] Expor endpoints de moderação (`GET /admin/academy/comments/pending`, `POST .../approve|reject`) com RBAC completo.
- [ANALYZER] Publicar `GET /admin/members` com filtros/paginação e access map alinhado ao AdminService.
- [ANALYZER] Atualizar documentação `architecture/api/academy-lesson-comments.md` e `architecture/api/admin-members.md`, além das suites jest correspondentes.
Justificativa: Destravar threads da Academia e painel de membros para frontend/testing.

### subagent-backend-business-logic
Status Atual: in_progress (55%)
Tarefas Atualizadas:
- [ANALYZER] Implementar LessonCommentReplyRepository + AcademyService com replies encadeados (até 3 níveis) e pendingModeration coerente.
- [ANALYZER] Implementar workflow de moderação (listPending/approve/reject) com auditoria.
- [ANALYZER] Provisionar infraestrutura BullMQ (Campaign/Metrics/Cleanup) integrada ao server.
- [ANALYZER] Estender AdminService.listMembers agregando access map/convites.
- [ANALYZER] Atualizar documentação/tests (AcademyService/AdminService/jobs) e notificar API/Frontend/Testing.
Justificativa: Cobrir gaps de threads, administração de membros e jobs assíncronos.

### subagent-frontend-state
Status Atual: in_progress (80%)
Tarefas Atualizadas:
- [ANALYZER] Ajustar `queryKeys.hidra.campaignStats` para chave exclusiva e revisar invalidations/testes.
- [ANALYZER] Estender `useLessonComments` com replies (3 níveis) e mutação `addReply` sinalizando pendingModeration.
- [ANALYZER] Criar `useCommentModeration` consumindo endpoints admin.
- [ANALYZER] Atualizar `useAdminMembers` para usar GET `/admin/members` real (filtros/paginação) e remover placeholders.
- [ANALYZER] Sincronizar documentação/fixtures MSW para threads/moderação/admin members, notificando consumidores.
Justificativa: Frontend depende de hooks alinhados para habilitar LessonDetail, Admin Members e Hidra cache saudável.

### subagent-frontend-components
Status Atual: in_progress (75%)
Tarefas Atualizadas:
- [ANALYZER] Implementar `CommentThread/CommentForm` com badges de pendingModeration e ações mentor/admin.
- [ANALYZER] Integrar LessonPlayer/LessonDetail a threads reais (estados pending/erro) consumindo `useLessonComments`.
- [ANALYZER] Conectar página Admin Members ao hook real com filtros/skeletons e access map.
- [ANALYZER] Transformar Hidra Wizard em fluxo multi-step real (SegmentSelector, TemplateEditor, Review) com dados do serviço.
- [ANALYZER] Atualizar documentação/data-testids (components/*) cobrindo threads, admin members e wizard.
Justificativa: Resolver mocks nas páginas críticas do PRD (LessonDetail, Admin Members, Hidra wizard).

### subagent-testing
Status Atual: working (72%)
Tarefas Atualizadas:
- [ANALYZER] Estender Supertest para replies/moderação e GET `/admin/members` garantindo RBAC/filtros.
- [ANALYZER] Atualizar suites RTL/MSW para LessonDetail threads, CourseDetail tree, Admin Members e Hidra wizard multi-step.
- [ANALYZER] Atualizar fluxo Playwright login → hub → hidra wizard → cybervault → admin validando toasts/metrics e registrando bloqueios.
- [ANALYZER] Planejar cobertura para os workers BullMQ (Campaign/Metrics/Cleanup) assim que disponíveis.
Justificativa: Garantir QA integrado às novas features críticas antes do handoff.

## [2025-11-03T11:30:01Z] Ajustes pós-auditoria (context analyzer)

### subagent-backend-business-logic
Status Atual: in_progress
Tarefas Adicionadas:
- [ANALYZER] Implementar infraestrutura BullMQ em `src/backend/jobs/` (CampaignWorker, MetricsSyncWorker, CleanupWorker) com wiring no server.
- [ANALYZER] Acrescentar métodos em AdminService/Repositories para listar membros com access map consumidos pelo painel (`/admin/members`).
- [ANALYZER] Estender AcademyService para suportar replies/thread de comentários (create/list) com pendingModeration.
Justificativa: PRD depende de jobs assíncronos, gestão granular de membros e threads de comentários; nenhum item foi entregue ainda.
Prioridade: P0

### subagent-backend-api
Status Atual: pending
Tarefas Adicionadas:
- [ANALYZER] Expor GET /admin/members retornando membros + access map, alinhando contratos com useAdminMembers.
- [ANALYZER] Criar endpoints de replies em `/academy/lessons/:id/comments/:commentId/replies` para sustentar threads.
Justificativa: Frontend e PRD exigem listagem real de membros e discussão aninhada; rotas inexistentes hoje.
Prioridade: P0

### subagent-frontend-components
Status Atual: in_progress
Tarefas Adicionadas:
- [ANALYZER] Conectar CourseDetail/LessonDetail a useCourseTree/useLessonComments, renderizando módulos, lições e threads moderadas.
- [ANALYZER] Transformar HidraWizard em fluxo multi-step real com dados dinâmicos, validação e estados neon.
Justificativa: Páginas críticas seguem com placeholders e não refletem o design/system previsto.
Prioridade: P0/P1

### subagent-frontend-state
Status Atual: pending
Tarefas Adicionadas:
- [ANALYZER] Corrigir queryKeys.hidra.campaignStats para chave exclusiva e revisar invalidations relacionadas.
Justificativa: Colisão atual compromete cache/tipagem das métricas Hidra.
Prioridade: P0

### subagent-testing
Status Atual: working
Tarefas Adicionadas:
- [ANALYZER] Planejar suites (Supertest/Vitest/Playwright) para novos endpoints `/admin/members` e threads de comentários, além do wizard real do Hidra.
Justificativa: Cobertura precisa acompanhar novos contratos e UX críticas.
Prioridade: P1

## [AUTO] Escopo atualizado e injeção de tarefas — Context Analyzer

### Timestamp
- 2025-11-03T$(date -u +%H:%M:%SZ)

### subagent-backend-business-logic
Status Anterior: in_progress (65%)
Status Novo: in_progress (65%)

Tarefas Adicionadas (tasks_remaining):
- [ANALYZER] Implementar LessonCommentReplyRepository (create/list) e integrar ao AcademyService com replies aninhadas (até 3 níveis)
- [ANALYZER] Criar fluxo de moderação (listPending/approve/reject) atualizando pendingModeration/moderationStatus com auditoria
- [ANALYZER] Provisionar BullMQ (queues/workers/scheduler) e integrar no server.ts (Campaign/Metrics/Cleanup)
- [ANALYZER] Estender AdminService.listMembers agregando roles, invites e access map para suportar GET /admin/members
- [ANALYZER] Sincronizar documentação e testes (services/jobs) e notificar backend-api/frontend-state/testing

Justificativa:
Foco consolidado em threads/replies, moderação de comentários, workers BullMQ e listagem real de membros para o painel Admin.

### subagent-testing
Status Anterior: working (85%)
Status Novo: working (85%)

Tarefas Adicionadas (tasks_remaining):
- [ANALYZER] Supertest: endpoints de replies/moderação (/academy/lessons/:id/comments/... e /admin/academy/comments/*) — RBAC e contratos
- [ANALYZER] Supertest: GET /admin/members (RBAC, filtros e paginação)
- [ANALYZER] RTL/MSW: LessonDetail threads + CourseDetail tree + Admin Members grid (selectors/data-testids)

Justificativa:
Cobertura de contratos críticos liberados e UI correspondente; preparar terreno para fluxo Playwright completo.


## [2025-11-03T17:24:25Z] Threads & queues follow-up

### subagent-frontend-components
Status Atual: in_progress
Tarefas Adicionadas:
- [ANALYZER] Permitir que CommentThread propague moderação para replies (aprovar/rejeitar em qualquer profundidade) e atualizar testes/Storybook

### subagent-backend-business-logic
Status Atual: in_progress
Tarefas Adicionadas:
- [ANALYZER] Substituir TODOs dos workers BullMQ por integrações reais (HidraService dispatch, métricas agregadas, limpeza programada)
- [ANALYZER] Introduzir QueueScheduler/Connection factory tipada para BullMQ e remover casts `as any`
