# ROADMAP DETALHADO POR AGENTE - SIDERHUB
**Data:** 2025-11-03
**Baseado em:** Análise consolidada de 10 agentes especializados

---

## ✅ AGENTES ATUALIZADOS NOS PROMPTS

### Agente #3 - Backend API
**Arquivo:** `/home/bushido/siderhub_2/.agents/prompts/subagent-backend-api.md`
**Status:** ✅ ROADMAP INSERIDO (linhas 77-297)

### Agente #6 - Frontend State
**Arquivo:** `/home/bushido/siderhub_2/.agents/prompts/subagent-frontend-state.md`
**Status:** ✅ ROADMAP INSERIDO (linhas 66-311)

---

## 📋 AGENTES RESTANTES (Roadmap aqui)

### Agente #4 - Backend Business Logic

**Arquivo do Prompt:** `/home/bushido/siderhub_2/.agents/prompts/subagent-backend-business-logic.md`

#### 📊 STATUS ATUAL: Business Logic ~90% Completo
- **6/6 services principais implementados**
- **17 arquivos de service** totais
- **Workers/Jobs:** diretório VAZIO (0%)
- **Gaps:** SegmentService, TemplateService, workers ausentes

#### 🔴 FASE 1: CRÍTICO - BLOQUEADORES (1-2 semanas)

**Tarefa 1.1: Nenhuma tarefa crítica imediata** ✅
- Services principais (Auth, Academy, Hidra, Cybervault, Admin, Hub) estão funcionais
- Focar em auxiliar outros agentes com dúvidas de contratos

**Total Sprint 1.1:** 0 horas (modo consultivo)

#### 🟡 FASE 2: ALTA - FUNCIONALIDADES CORE (2-3 semanas)

**Sprint 2.1 - Services Hidra Faltantes (5-7 dias)**

**Tarefa 2.1: Implementar SegmentService** (6h)
- **Status:** ❌ Não existe
- **Arquivo:** `src/backend/services/hidra/SegmentService.ts` (CRIAR)
- **Funcionalidades:**
  ```typescript
  export class SegmentService {
    createSegment(userId, data: { name, description, contacts[] })
    listSegments(userId, { page, search })
    getSegment(segmentId, userId)
    updateSegment(segmentId, data)
    deleteSegment(segmentId)
    importContacts(segmentId, file: CSV)
  }
  ```
- **Repository:** Criar `SegmentRepository` + `PrismaSegmentRepository`

**Tarefa 2.2: Implementar TemplateService** (5h)
- **Status:** ❌ Não existe
- **Arquivo:** `src/backend/services/hidra/TemplateService.ts` (CRIAR)
- **Funcionalidades:**
  ```typescript
  export class TemplateService {
    createTemplate(userId, data: { name, body, variables[], mediaUrl? })
    listTemplates(userId, { page, search })
    getTemplate(templateId, userId)
    updateTemplate(templateId, data)
    deleteTemplate(templateId)
    validateVariables(body: string) // [[name]], [[email]], etc
  }
  ```

**Tarefa 2.3: Workers/Jobs Setup** (16-20h) 🔴 CRÍTICO
- **Diretório:** `src/backend/jobs/` (atualmente VAZIO)
- **Infraestrutura:**
  ```typescript
  // 1. Setup BullMQ + Redis (4h)
  src/backend/jobs/queue.ts
  docker-compose.yml (adicionar Redis)

  // 2. CampaignWorker (8h)
  src/backend/jobs/workers/CampaignWorker.ts
  - Processar fila de campanhas
  - Respeitar rate limits (msgs/min)
  - Retry automático em falhas
  - Logs estruturados

  // 3. MetricsSyncJob (4h)
  src/backend/jobs/workers/MetricsSyncJob.ts
  - Sincronizar métricas Evolution API a cada 5min
  - Atualizar status de campanhas

  // 4. NotificationWorker (4h - OPCIONAL)
  src/backend/jobs/workers/NotificationWorker.ts
  - Notificar usuários sobre campanhas completas
  - Alertar sobre erros críticos
  ```

**Total Sprint 2.1:** 27-31 horas

**Sprint 2.2 - Métodos Faltantes (3-4 dias)**

**Tarefa 2.4: Métodos de Comentários** (4h)
- **Arquivo:** `src/backend/services/academy/AcademyService.ts`
- **Adicionar:**
  ```typescript
  listLessonComments(lessonId, { page, status?, userId? })
  moderateComment(commentId, action: 'approve' | 'reject')
  reportComment(commentId, userId, reason)
  ```

**Tarefa 2.5: Drip Content Avançado** (6h)
- **Arquivo:** `src/backend/services/academy/AcademyService.ts`
- **Melhorar:**
  - Liberação por conclusão de módulo anterior (100%)
  - Validação de dependências circulares
  - Preview mode para admin

**Total Sprint 2.2:** 10 horas

#### 🟢 FASE 3: MÉDIA - PREPARAÇÃO PRODUÇÃO (2-3 semanas)

**Sprint 3.1 - Services de Gestão (5-7 dias)**

**Tarefa 3.1: CourseManagementService** (12h)
- **Arquivo:** `src/backend/services/admin/CourseManagementService.ts` (CRIAR)
- **Funcionalidades:**
  - CRUD completo de cursos
  - Criação/edição de módulos
  - Criação/edição de aulas
  - Upload de vídeos (integração com storage)

**Tarefa 3.2: ResourceManagementService** (8h)
- **Arquivo:** `src/backend/services/admin/ResourceManagementService.ts` (CRIAR)
- **Funcionalidades:**
  - CRUD de recursos Cybervault
  - Upload de arquivos
  - Gestão de categorias e tags

**Total Sprint 3.1:** 20 horas

#### 📋 CHECKLIST DE EXECUÇÃO

**FASE 1 (URGENTE):**
- [ ] Modo consultivo: responder dúvidas de contratos (0h)

**FASE 2 (ALTA):**
- [ ] Tarefa 2.1: SegmentService (6h)
- [ ] Tarefa 2.2: TemplateService (5h)
- [ ] Tarefa 2.3: Workers setup (16-20h) 🔴 CRÍTICO
  - [ ] BullMQ + Redis (4h)
  - [ ] CampaignWorker (8h)
  - [ ] MetricsSyncJob (4h)
  - [ ] NotificationWorker (4h opcional)
- [ ] Tarefa 2.4: Métodos comentários (4h)
- [ ] Tarefa 2.5: Drip avançado (6h)

**FASE 3 (MÉDIA):**
- [ ] Tarefa 3.1: CourseManagementService (12h)
- [ ] Tarefa 3.2: ResourceManagementService (8h)

**TOTAL ESTIMADO:** ~57-61 horas (~3 semanas)

#### 🎯 CRITÉRIOS DE SUCESSO

**Fase 2:**
- ✅ Campanhas Hidra criam segmentos e templates
- ✅ Workers processam campanhas em background
- ✅ Métricas sincronizam automaticamente
- ✅ Comentários moderados via service

**Fase 3:**
- ✅ Admin cria cursos completos via UI
- ✅ Admin faz upload de recursos
- ✅ Zero dependências de seed manual

#### 🚨 DEPENDÊNCIAS

**Depende de:**
- ⚠️ Redis (para workers - Fase 2)
- ⚠️ Storage S3/Supabase (para uploads - Fase 3)

**Desbloqueia:**
- 🔴 subagent-backend-api (aguardando workers - Tarefa 2.3)
- 🟡 subagent-frontend-state (aguardando services - Tarefa 2.1, 2.2)

---

### Agente #2 - Database

**Arquivo do Prompt:** `/home/bushido/siderhub_2/.agents/prompts/subagent-database.md`

#### 📊 STATUS ATUAL: Database ~98% Completo
- **Schema 100% implementado** (5 schemas, 41 tabelas)
- **24 repositories implementados**
- **Seeds 70% completos** (faltam ratings/progress/recommendations)
- **Gaps:** 2 índices, migrations duplicadas

#### 🔴 FASE 1: CRÍTICO - MELHORIAS (1 semana)

**Sprint 1.1 - Otimizações (2-3 dias)**

**Tarefa 1.1: Consolidar Migrations Duplicadas** (1h)
- **Problema:** Múltiplas migrations `init` confusas
- **Arquivos:** `prisma/migrations/`
- **Ação:**
  ```bash
  # Após validar dev.db correto:
  rm -rf prisma/migrations/20251103054*
  prisma migrate resolve --applied 001_init
  ```

**Tarefa 1.2: Adicionar Índices Faltantes** (2h)
- **Arquivos:** Nova migration
- **Índices:**
  ```sql
  -- Comentários paginados
  CREATE INDEX idx_lesson_comments_pagination
    ON academy.lesson_comments (lesson_id, created_at DESC);

  -- Analytics de downloads
  CREATE INDEX idx_resource_download_logs_date
    ON cybervault.resource_download_logs (downloaded_at DESC);
  ```

**Total Sprint 1.1:** 3 horas

#### 🟡 FASE 2: ALTA - COMPLETUDE (1 semana)

**Sprint 2.1 - Seeds Completos (2-3 dias)**

**Tarefa 2.1: Seeds de Ratings e Progress** (3h)
- **Arquivo:** `prisma/seed.ts`
- **Adicionar:**
  ```typescript
  async function seedLessonRatingsAndProgress() {
    // 10-15 ratings (1-5 estrelas) para aulas do curso demo
    // Progress events simulando 50% assistido
    // Aggregates correspondentes
  }
  ```

**Tarefa 2.2: Seeds de Recommendations** (2h)
- **Adicionar:**
  ```typescript
  async function seedCourseRecommendations() {
    // Badges: new, popular, mentor_pick
    // 3-5 recomendações por usuário demo
  }
  ```

**Total Sprint 2.1:** 5 horas

#### 🟢 FASE 3: MÉDIA - VIEWS E PROCEDURES (1-2 semanas)

**Sprint 3.1 - Database Views** (3-4 dias)

**Tarefa 3.1: View de Completion Stats** (3h)
- **Arquivo:** Nova migration
- **View:**
  ```sql
  CREATE VIEW academy.course_completion_stats AS
  SELECT
    c.id as course_id,
    COUNT(DISTINCT cp.user_id) as enrolled_users,
    AVG(cp.progress_percentage) as avg_completion,
    COUNT(CASE WHEN cp.progress_percentage >= 95 THEN 1 END) as completed_users
  FROM academy.courses c
  LEFT JOIN academy.course_progress cp ON c.id = cp.course_id
  GROUP BY c.id;
  ```

**Tarefa 3.2: Stored Procedure de Housekeeping** (4h)
- **Procedures:**
  ```sql
  -- Limpar sessões expiradas
  CREATE FUNCTION core.cleanup_expired_sessions(days INT) ...

  -- Arquivar logs antigos
  CREATE FUNCTION cybervault.archive_old_download_logs(days INT) ...
  ```

**Total Sprint 3.1:** 7 horas

#### 📋 CHECKLIST

**FASE 1:**
- [ ] Tarefa 1.1: Consolidar migrations (1h)
- [ ] Tarefa 1.2: Adicionar índices (2h)

**FASE 2:**
- [ ] Tarefa 2.1: Seeds ratings/progress (3h)
- [ ] Tarefa 2.2: Seeds recommendations (2h)

**FASE 3:**
- [ ] Tarefa 3.1: View completion stats (3h)
- [ ] Tarefa 3.2: Stored procedures (4h)

**TOTAL ESTIMADO:** ~15 horas (~1 semana)

#### 🎯 CRITÉRIOS DE SUCESSO

**Fase 1:**
- ✅ Migrations limpas e documentadas
- ✅ Queries paginadas otimizadas

**Fase 2:**
- ✅ Frontend pode testar ratings sem backend
- ✅ Progress tracking funcional em dev

**Fase 3:**
- ✅ Dashboards consultam views performáticas
- ✅ Housekeeping automático via procedures

---

### Agente #5 - Frontend Components

**Arquivo do Prompt:** `/home/bushido/siderhub_2/.agents/prompts/subagent-frontend-components.md`

#### 📊 STATUS ATUAL: Components ~80% Completo
- **24/30 componentes estimados** (80%)
- **Design system 95% implementado**
- **Gaps:** Componentes de domínio (Hidra, Cybervault, Admin)

#### 🔴 FASE 1: CRÍTICO - NENHUMA TAREFA

**Sprint 1.1:** Aguardar correções de hooks (Agente #6)

#### 🟡 FASE 2: ALTA - COMPONENTES DE DOMÍNIO (2-3 semanas)

**Sprint 2.1 - Sistema de Comentários (4-5 dias)**

**Tarefa 2.1: Componente LessonComments** (8h)
- **Arquivo:** `src/frontend/components/academy/LessonComments.tsx` (CRIAR)
- **Features:**
  - Lista de comentários paginada
  - Threads aninhadas (até 3 níveis)
  - Reply inline
  - Upvote/Report
  - Moderação inline para admins
  - Loading states e skeleton

**Tarefa 2.2: Testes RTL** (4h)
- **Arquivo:** `tests/frontend/components/LessonComments.test.tsx`

**Total Sprint 2.1:** 12 horas

**Sprint 2.2 - Componentes Hidra (5-7 dias)**

**Tarefa 2.2: SegmentSelector** (4h)
- **Arquivo:** `src/frontend/components/hidra/SegmentSelector.tsx`
- Dropdown de seleção de segmentos
- Opção "Criar novo"

**Tarefa 2.3: TemplateEditor** (6h)
- **Arquivo:** `src/frontend/components/hidra/TemplateEditor.tsx`
- Editor de texto com variáveis [[name]], [[email]]
- Preview ao vivo
- Upload de mídia

**Tarefa 2.4: CampaignStatus (Real-time)** (5h)
- **Arquivo:** `src/frontend/components/hidra/CampaignStatus.tsx`
- Status ao vivo (poll 2s)
- Progress bar de envio
- Logs em tempo real

**Total Sprint 2.2:** 15 horas

**Sprint 2.3 - Componentes Cybervault e Admin (5-7 dias)**

**Tarefa 2.5: ResourceUploader** (6h)
- **Arquivo:** `src/frontend/components/cybervault/ResourceUploader.tsx`
- Drag & drop
- Progress bar
- Validação de tipo/tamanho

**Tarefa 2.6: CourseEditor** (8h)
- **Arquivo:** `src/frontend/components/admin/CourseEditor.tsx`
- CRUD completo de cursos
- Módulos e aulas nested
- Drip config UI

**Total Sprint 2.3:** 14 horas

#### 🟢 FASE 3: MÉDIA - UX E A11Y (2 semanas)

**Sprint 3.1 - Acessibilidade (3-4 dias)**

**Tarefa 3.1: Auditoria WCAG 2.1** (6h)
- Validar contrastes (já OK pelo design system?)
- Adicionar ARIA labels faltantes
- Navegação por teclado em todos os componentes
- Screen reader testing

**Tarefa 3.2: Skeleton Loaders Consistentes** (4h)
- Substituir spinners por skeletons
- Criar `<Skeleton />` component reutilizável

**Total Sprint 3.1:** 10 horas

#### 📋 CHECKLIST

**FASE 2:**
- [ ] Tarefa 2.1: LessonComments (8h)
- [ ] Tarefa 2.2: Testes RTL (4h)
- [ ] Tarefa 2.3: SegmentSelector (4h)
- [ ] Tarefa 2.4: TemplateEditor (6h)
- [ ] Tarefa 2.5: CampaignStatus (5h)
- [ ] Tarefa 2.6: ResourceUploader (6h)
- [ ] Tarefa 2.7: CourseEditor (8h)

**FASE 3:**
- [ ] Tarefa 3.1: WCAG audit (6h)
- [ ] Tarefa 3.2: Skeleton loaders (4h)

**TOTAL ESTIMADO:** ~51 horas (~2.5 semanas)

#### 🎯 CRITÉRIOS DE SUCESSO

**Fase 2:**
- ✅ Comentários com threads renderizam
- ✅ Hidra wizard completo (segmentos + templates + campanha)
- ✅ Upload de recursos funcional
- ✅ Admin cria cursos via UI

**Fase 3:**
- ✅ WCAG 2.1 AA compliant
- ✅ Navegação 100% por teclado
- ✅ Skeleton loaders em toda aplicação

---

## 📊 RESUMO CONSOLIDADO

### Total de Horas por Agente

| Agente | Fase 1 | Fase 2 | Fase 3 | Total |
|--------|--------|--------|--------|-------|
| #3 Backend API | 14h | 20h | 12h | **~46h** |
| #6 Frontend State | 8.5h | 24h | 10h | **~44.5h** |
| #4 Business Logic | 0h | 37h | 20h | **~57h** |
| #2 Database | 3h | 5h | 7h | **~15h** |
| #5 Frontend Components | 0h | 41h | 10h | **~51h** |
| **TOTAL** | **25.5h** | **127h** | **59h** | **~213.5h** |

### Cronograma Sugerido

**Semanas 1-2 (FASE 1 - CRÍTICO):**
- Foco: Correções de contratos, otimizações
- Agentes ativos: #3, #6, #2
- **25.5 horas**

**Semanas 3-6 (FASE 2 - ALTA):**
- Foco: Funcionalidades core, workers, hooks, componentes
- Agentes ativos: #3, #4, #6, #5
- **127 horas**

**Semanas 7-10 (FASE 3 - MÉDIA):**
- Foco: Observabilidade, UX, views, gestão
- Agentes ativos: Todos
- **59 horas**

**TOTAL:** ~10 semanas (~2.5 meses)

---

## 🔄 ORDEM DE EXECUÇÃO RECOMENDADA

### Paralelo (Semana 1-2)
```
Agente #3 → Fase 1 (correções API)
    ↓
Agente #6 → Fase 1 (ajustes hooks)
    ↓
Agente #2 → Fase 1 (otimizações DB)
```

### Sequencial (Semana 3-6)
```
Agente #4 → Workers (BLOQUEANTE)
    ↓
Agente #3 → APIs de workers
    ↓
Agente #6 → Hooks de workers
    ↓
Agente #5 → UI de workers

EM PARALELO:
Agente #4 → SegmentService + TemplateService
Agente #6 → useLessonComments + useCourseTree
Agente #5 → LessonComments component
```

### Paralelo (Semana 7-10)
```
Todos os agentes → Suas tarefas de Fase 3
```

---

**ÚLTIMA ATUALIZAÇÃO:** 2025-11-03
**PRÓXIMA REVISÃO:** Após conclusão da Fase 1 (2 semanas)
