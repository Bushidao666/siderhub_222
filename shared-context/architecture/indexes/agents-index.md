# Agents Index — SiderHub Subagents

**Generated:** 2025-11-03T17:50:00-03:00 (Complete Reindex)
**Source:** `.agents/prompts/*.md`
**Purpose:** Consolidated reference of all subagents, their phases, responsibilities, and interdependencies.
**Project Status:** 72% complete (Updated 2025-11-03)

---

## Overview

The SiderHub project uses a **2-layer architecture**:
- **Layer 1 (Main Orchestrator):** Provides shared context, coordinates work, responds to questions, validates synthesis.
- **Layer 2 (Subagents):** Specialized agents that implement specific domains working in parallel via JSONL communication + 30s sleep loops (60s for autopilot).

This document maps all 10 agents (1 orchestrator + 9 workers) with their identities, phases, inputs, outputs, dependencies, and current status.

---

## Project Context & Completude

**Tech Stack:** Node.js + Express + Prisma + PostgreSQL 14 + React + Vite + TypeScript
**Design System:** Neon cyberpunk (dark mode first, primary #00FF00, Rajdhani + Inter fonts)
**Implemented:** 39 componentes React, 13 hooks, 15 páginas, 6 schemas PostgreSQL, 6 backend services

### Completude por Módulo

| Módulo | Backend | Frontend | Testes | Status Global |
|--------|---------|----------|---------|---------------|
| Auth/SSO | 95% | 90% | 85% | ✅ 90% |
| Hub Principal | 90% | 75% | 70% | 🟢 78% |
| Academia | 85% | 60% | 65% | 🟡 70% |
| Hidra | 90% | 45% | 60% | 🟡 65% |
| Cybervault | 85% | 40% | 55% | 🟡 60% |
| Admin | 80% | 30% | 50% | 🟠 53% |

---

## Agents Summary Table

| Agent | Phase | Status | Identity | Primary Inputs | Primary Outputs | Depends On | Unblocks |
|-------|-------|--------|----------|----------------|-----------------|------------|----------|
| **ai-responder** | All | Active | Automated Q&A responder | questions.jsonl, docs, PRD, UI, architecture | JSON answers (confidence + citations) | Main context | All subagents |
| **subagent-context-indexer** | 0/1 | Ready | Context intake & indexer | PRD, UI, prompts, src/, architecture | agents-index, repo-inventory, context-synthesis | None | All (shared knowledge) |
| **subagent-context-analyzer** | All | Active | Architecture auditor | PRD, Design, architecture, src/, progress | Analysis reports, gaps, violations, tasks-injection | context-indexer | All (task updates) |
| **subagent-database** | 1 | Completed | Schema & migrations specialist | PRD, shared types, schemas | Prisma schema, migrations, seeds, docs | context-indexer | backend-business-logic |
| **subagent-backend-business-logic** | 2 | 98% | Services & logic implementor | Schema, types, PRD | Services, workers, BullMQ jobs | database | backend-api |
| **subagent-backend-api** | 3 | 100% | Express routes builder | Services, types, api docs | Routes, Zod validation, RBAC | backend-business-logic | frontend-state, testing |
| **subagent-frontend-state** | 4 | 100% | State & hooks creator | API contracts, tokens | Zustand stores, React Query hooks | backend-api | frontend-components |
| **subagent-frontend-components** | 5 | 84% | React UI builder | Design System, hooks | Components, pages, layouts | frontend-state | testing |
| **subagent-testing** | 6 | 25% | QA & test suites manager | All code, contracts | Supertest, Vitest+RTL, Playwright | All | None (validates all) |
| **subagent-main-autopilot** | All | Active | Continuous orchestrator | progress, state, logs, PIDs | Resumes, answers, spawns | None (monitors all) | All (orchestration) |

---

## Critical Gaps (Top 10)

### 🔴 PRIORIDADE MÁXIMA (BLOQUEADORES)

1. **Contratos API/Frontend Desalinhados**
   - `useHubData` espera estrutura diferente de `/api/hub`
   - **Impacto:** Hub não exibe cursos/recomendações
   - **Responsável:** backend-api + frontend-state
   - **Esforço:** 4h

2. **POST `/academy/lessons/:id/rating` Retorna Tipo Errado**
   - Retorna `LessonRating` mas frontend espera `LessonRatingSummary`
   - **Impacto:** Cache de ratings corrompido
   - **Responsável:** backend-api
   - **Esforço:** 2h

3. **GET `/academy/lessons/:id/progress` Não Existe**
   - Hook tenta buscar mas endpoint não implementado
   - **Impacto:** Player não retoma de onde parou
   - **Responsável:** backend-api
   - **Esforço:** 3h

4. **Workers/Jobs Completamente Ausentes**
   - Diretório `src/backend/jobs/` vazio
   - **Impacto:** Campanhas Hidra não escalam
   - **Responsável:** backend-business-logic
   - **Esforço:** 16-20h

### 🟡 PRIORIDADE ALTA

5. **Testes Duplicados** - AcademyService.test.ts em 2 locais (1h)
6. **Hooks Faltantes** - useLessonComments, useCourseTree completo (6-8h)
7. **QueryClient Duplicado** - App.tsx vs lib/queryClient.ts (30min)

### 🟢 PRIORIDADE MÉDIA

8. **Documentação Desatualizada** - recommendations.jsonl com tarefas concluídas (2h)
9. **E2E Tests Desatualizados** - Playwright specs desatualizados (8-10h)
10. **Observabilidade Ausente** - Sem Prometheus/Grafana, logger sem correlationId (12-16h)

---

## Detailed Agent Profiles

### ai-responder

**Role:** Automated Q&A system for subagents
**Mode:** Always active, responds to questions in `.agents/coordination/questions.jsonl`

**Context Awareness:**
- Consults: PRD, UI Design System, architecture.md, execution-plan.md, analysis reports
- Citations: Always includes file paths consulted
- Confidence: 0.0-1.0 scale (2 decimal places)

**Output Format:**
```json
{
  "answer": "string",
  "confidence": 0.85,
  "citations": ["path1", "path2"],
  "mode": "final" | "draft"
}
```

**Security Policies:**
- Sensitive operations (migrations, credentials, deletions) → `mode: "draft"`
- Never executes commands, only suggests
- Minimum confidence threshold: 0.5

**Known Gaps Reference:**
- API/Frontend misalignments (GET /api/hub structure, POST rating response)
- Missing workers infrastructure (`/src/backend/jobs/` empty)
- Incomplete comment system (pendingModeration not persisting)
- Missing hooks (useLessonComments, useCourseTree)
- 34+ TODO tests, middlewares without coverage

---

### subagent-context-indexer

**Role:** Context intake & architecture indexer (PHASE 0/1)
**Status:** Ready (100% complete, monitoring mode)

**Deliverables:**
- ✅ `indexes/agents-index.md` - 10 prompts indexed
- ✅ `indexes/repo-inventory.md` - 186 files mapped
- ✅ `reports/context-synthesis.md` - PRD/UI/Architecture consolidated
- ✅ `indexes/architecture-inventory.md` - Architecture documentation map

**Statistics:**
- Total files indexed: 186
- Prompts indexed: 10
- Domains mapped: 6 (core, academy, hidra, cybervault, admin, hub)
- API routes documented: 9
- Services documented: 17
- Repositories documented: 48
- Components documented: 37
- Hooks documented: 17
- Pages documented: 15

**Workflow:**
1. Monitor PRD, UI Design System, prompts, architecture for changes
2. Rebuild indexes when changes detected
3. Update context-synthesis cross-referencing all sources
4. Notify dependent agents of updates

**Sleep Loop:** 30s when waiting for artifacts (PRD, UI, architecture docs)

---

### subagent-context-analyzer

**Role:** Architecture auditor & gap detector (ALL PHASES)
**Status:** Active, continuous monitoring

**Responsibilities:**
- Map project structure (src/, docs, configs)
- Identify gaps between PRD and implementation
- Validate Design System alignment with code
- Audit type consistency and contracts
- Detect architectural violations
- **Update tasks_remaining in progress/*.json files**
- Answer architecture queries from other subagents

**Analysis Outputs:**
- `architecture/analysis/gaps-*.md` - Implementation gaps
- `architecture/analysis/violations-*.md` - Architecture violations
- `architecture/analysis/type-safety-*.md` - Type consistency issues
- `architecture/analysis/design-alignment-*.md` - UI/Design alignment
- `architecture/analysis/prd-coverage-*.md` - PRD feature coverage
- `architecture/analysis/tasks-injection.md` - Tasks for subagents
- `architecture/analysis/recommendations.jsonl` - Prioritized recommendations

**Workflow:**
1. Continuous scanning of progress files
2. Cross-reference PRD → architecture → code
3. Generate timestamped analysis reports
4. Inject tasks into subagent progress files
5. Notify blockers and inconsistencies

**Sleep Loop:** 30s when waiting for subagent completion

---

### subagent-database

**Role:** Database schema & migrations specialist (PHASE 1)
**Status:** Completed (100%)

**Scope:**
- ✅ 6 PostgreSQL schemas: core, academy, hidra, cybervault, admin, public
- ✅ Prisma schema with full relationships
- ✅ Migrations with proper indexes and constraints
- ✅ Seeds with realistic test data
- ✅ Schema documentation in `architecture/schemas/*.md`

**Critical Implementation:**
- ✅ Comment moderation fields (status, moderated_by, moderated_at)
- ✅ Replies with FK integrity (3-level threading)
- ✅ Seeds with pending/approved/rejected comments

**Tech Decisions:**
- snake_case tables and columns, @@map for DTOs
- Audit fields: created_at, updated_at (mandatory), deleted_at (soft delete)
- Security: refresh_token hashed, api_key bytea (encrypted at service layer)
- Performance: indexes on frequent queries (email, slug, status)
- Multitenancy: user_id for ownership in academy/hidra/cybervault

**Current Mode:** Support & monitoring (answers queries, validates schema changes)

**Sleep Loop:** 30s when waiting for type updates or Main confirmations

---

### subagent-backend-business-logic

**Role:** Services & business logic implementor (PHASE 2)
**Status:** 98% complete

**Services Delivered:**
- ✅ AuthService - JWT, refresh tokens, RBAC
- ✅ AcademyService - Courses, lessons, progress, drip, ratings, comments (with replies & moderation)
- ✅ HidraService - Evolution API, campaigns, stats
- ✅ CybervaultService - Resources, downloads, badges
- ✅ AdminService - Members, banners, toggles, invitations (with access map)
- ✅ HubService - Dashboard aggregation
- 🟡 BullMQ workers (98% - infrastructure ready, needs integration testing)

**Current Focus:**
- Comment reply repository integration (create/list replies)
- Moderation workflow (approve/reject/listPending with audit)
- BullMQ infrastructure (CampaignDispatchWorker, MetricsSyncWorker, CleanupWorker)
- AdminService member listing with access map

**Key Features:**
- Repository pattern with Prisma implementations
- Mappers for entity ↔ DTO conversion
- Business rule validation (drip lock, role checks)
- Audit logging for sensitive operations

**Sleep Loop:** 30s when waiting for migrations or schema updates

---

### subagent-backend-api

**Role:** Express API routes & endpoints builder (PHASE 3)
**Status:** 100% complete

**API Structure:**
```
/api
├── /auth - login, logout, register, refresh, me
├── /hub - dashboard data (banners, courses, metrics)
├── /academy - courses, lessons, progress, ratings, comments, replies
├── /hidra - campaigns, configs, dashboard, stats
├── /cybervault - resources, downloads
└── /admin - dashboard, members, banners, toggles, invitations, moderation
```

**Features:**
- ✅ Zod validation schemas for all endpoints
- ✅ RBAC enforcement via roleGuard middleware
- ✅ Standardized ApiResponse<T> format
- ✅ Rate limiting via rateLimit middleware
- ✅ Thread endpoints (POST/GET replies)
- ✅ Moderation endpoints (GET pending, POST approve/reject)
- ✅ Admin members endpoint (GET /admin/members with filters)

**Documentation:**
- All endpoints documented in `architecture/api/*.md`
- Supertest coverage for all routes
- MSW handlers for frontend testing

**Current Mode:** Stable, monitoring for contract changes

**Sleep Loop:** 30s when waiting for service implementations

---

### subagent-frontend-state

**Role:** State management & data hooks creator (PHASE 4)
**Status:** 100% complete

**Deliverables:**
- ✅ Zustand stores for auth, user preferences
- ✅ React Query hooks for all API endpoints
- ✅ Unified queryClient configuration
- ✅ Form validation with React Hook Form + Zod
- ✅ Hooks for comments with replies (useLessonComments)
- ✅ Moderation hook (useCommentModeration)
- ✅ Admin members hook (useAdminMembers) with filters

**Query Key Structure:**
```typescript
queryKeys = {
  auth: { me: ['auth', 'me'] },
  hub: { overview: ['hub', 'overview'] },
  academy: {
    courses: (filters) => ['academy', 'courses', filters],
    lesson: (id) => ['academy', 'lesson', id],
    comments: (lessonId) => ['academy', 'comments', lessonId],
    progress: (lessonId) => ['academy', 'progress', lessonId]
  },
  hidra: {
    dashboard: ['hidra', 'dashboard'],
    campaignStats: ['hidra', 'campaign-stats'], // Fixed collision
    campaigns: (filters) => ['hidra', 'campaigns', filters]
  },
  // ... cybervault, admin
}
```

**Key Features:**
- Optimistic updates for mutations
- Automatic cache invalidation
- Error boundary integration
- Loading/error states standardized
- MSW handlers for testing

**Current Focus:**
- Query key collision fixes (hidra.campaignStats)
- Reply mutation integration
- Pending moderation states

**Sleep Loop:** 30s when waiting for backend-api completion

---

### subagent-frontend-components

**Role:** React components & UI builder (PHASE 5)
**Status:** 84% complete

**Component Library (Atomic Design):**
- **Atoms:** Button, Input, Badge, ProgressBar, RatingStars (15 components)
- **Molecules:** Card, FilterBar, MetricsCards, ModuleAccordion (12 components)
- **Organisms:** CourseCard, LessonPlayer, CampaignTable, ResourceCard, MemberTable (27 components)
- **Templates:** Layouts with sidebar/header/footer
- **Pages:** 15 pages across Hub, Academia, Hidra, Cybervault, Admin

**Current Focus:**
- 🟡 CommentThread component (3-level threading, pending badges)
- 🟡 CommentForm with reply support
- 🟡 LessonPlayer integration with threads
- 🟡 Hidra Wizard (multi-step: SegmentSelector, TemplateEditor, Review)
- 🟡 Admin Members table (filters, status indicators)

**Design System Compliance:**
- Neon tokens from `@design/tokens`
- Colors: primary #00FF00, surfaces, glows
- Typography: Rajdhani (headings), Inter (body)
- Uppercase tracking for major headings
- Dark mode first

**Quality:**
- data-testid on all interactive elements
- Storybook stories (in progress)
- RTL tests for critical components
- Accessibility (ARIA labels, keyboard nav)

**Sleep Loop:** 30s when waiting for frontend-state hooks

---

### subagent-testing

**Role:** Quality assurance & test suites manager (PHASE 6)
**Status:** 25% complete

**Test Coverage:**

**Backend (Supertest):**
- ✅ Auth endpoints (login, register, refresh, logout)
- ✅ Hub dashboard
- ✅ Academy courses, lessons, progress
- 🟡 Academy comments/replies/moderation (partially covered)
- ✅ Hidra campaigns, config
- ✅ Cybervault resources
- 🟡 Admin members, moderation (partially covered)
- ❌ Workers/Jobs (not covered - 0%)

**Frontend (Vitest + RTL):**
- ✅ Basic hooks (useAuthForm, useHubData, useCourseProgress)
- 🟡 Comment hooks (useLessonComments needs update for replies)
- 🟡 Admin hooks (useAdminMembers needs filters test)
- ✅ Core components (Button, Card, Input)
- 🟡 Complex components (LessonPlayer, CampaignTable need thread tests)
- ❌ CommentThread (not yet implemented)

**E2E (Playwright):**
- ✅ Auth flows (login, logout, register)
- ✅ Hub navigation
- 🟡 Academy lesson viewing (needs thread interaction)
- 🟡 Hidra campaign creation (needs wizard steps)
- ✅ Cybervault download
- ❌ Admin moderation flow (not covered)

**Current Blockers:**
- Workers infrastructure without tests (need BullMQ test setup)
- CommentThread component not implemented
- Hidra Wizard incomplete
- /login endpoint issues blocking some E2E scenarios

**Next Priorities:**
1. Supertest for replies/moderation endpoints
2. RTL for CommentThread/CommentForm
3. Playwright for wizard multi-step flow
4. Workers unit tests when infrastructure stabilizes

**Sleep Loop:** 30s when waiting for any upstream subagent completion

---

### subagent-main-autopilot

**Role:** Continuous orchestrator & monitoring daemon (ALL PHASES)
**Status:** Active (infinite loop)

**Monitoring Cycle:** 60 seconds (strict)

**Loop Structure:**
```bash
while true; do
  # PHASE 1: DATA COLLECTION (30s)
  - Check all PIDs (dead/alive detection)
  - Read logs (tail -n 100 per agent, error patterns)
  - Scan coordination files (questions, notifications, threads)
  - Analyze states/progress (estagnation > 10min)
  - Consult dependencies & autopilot-analysis.json

  # PHASE 2: ANALYSIS & DECISION (20s)
  - Prioritize by severity (CRITICAL → HIGH → MEDIUM)
  - Mount response JSON (answers, resumes, actions)
  - Execute scripts (answer.sh, resume-subagent.sh, spawn-subagent.sh)

  # PHASE 3: MANDATORY SLEEP (60s)
  - Notify before sleep
  - sleep 60
  - Notify after wake

  # Repeat forever
done
```

**Action Types:**
- **answers:** Direct responses to questions with citations
- **resumes:** Targeted messages to unblock agents
- **actions:**
  - `nudge-all` - Broadcast reminder to all agents
  - `spawn-agent` - Restart dead agent process
  - `nudge-agent` - Targeted reminder to specific agent
  - `notify` - Status/warning/blocker notifications
  - `ask` - Create new question
  - `enqueue-resume` - Queue resume for consumption

**Priority Levels:**
- 🔴 CRITICAL: Dead PIDs, invalid blockers → immediate spawn/resume
- 🟡 HIGH: SLA expired (>10min), ready agents not active → answer/nudge
- 🟢 MEDIUM: Estagnation, pending questions → diagnostic nudge

**Analysis Inputs:**
- `AUTOPILOT_ANALYSIS_JSON` fields: blockers, ready_agents, stalled_agents, dead_sessions, sla_reminders, daemon_restarts
- `.agents/shared-context/dependencies.json` - Dependency graph
- All `.agents/progress/*.json` - Agent status
- All `.agents/state/*.json` - Agent state
- All `.agents/logs/*.log` - Error patterns
- All `.agents/coordination/*.jsonl` - Communication

**Safety:**
- Never skips 60s sleep
- Validates PID before spawn
- Checks blocker validity before resume
- Uses backoff (≈120s) for repeated actions
- Documents all decisions in notes

**Current Responsibilities:**
- Monitor 72% → 100% project progression
- Resolve Top 10 Critical Gaps
- Coordinate Phases 1-6 execution
- Detect and resolve agent deadlocks
- Answer questions when owner unavailable

---

## Communication Protocols

### Question/Answer Flow
1. Agent usa `.agents/commands/ask <from> <to> "question" [priority]`
2. Question appears in `questions.jsonl` with status=waiting
3. AI Responder may auto-answer (confidence-based)
4. Agente alvo/Main responde via `.agents/commands/answer`
5. Answer appears in `answers.jsonl` with citations
6. Questioner receives notification

### Sleep Loop (30s standard, 60s autopilot)
```bash
wait_for_condition() {
  local cmd="$1"
  local success="$2"
  local waiting="$3"
  local max=${4:-60}
  local attempt=0

  # Notify before loop
  bash .agents/commands/notify <agent> blocker "$waiting"

  while [ $attempt -lt $max ]; do
    if eval "$cmd"; then
      echo "✅ $success"
      return 0
    fi
    attempt=$((attempt + 1))
    echo "⏳ [$attempt/$max] $waiting"
    sleep 30  # 60s for autopilot
  done

  echo "❌ Timeout: $waiting"
  return 1
}
```

### Notification Types
- **started:** Agent beginning work
- **progress:** Incremental update (per artifact)
- **completion:** Phase/task finished
- **blocker:** Waiting for dependency
- **warning:** Non-critical issue
- **error:** Critical failure

### AI Responder Integration
- Monitors `questions.jsonl` continuously
- Generates responses with confidence scores
- Marks as `final` (high confidence) or `draft` (review needed)
- Agents validate and can override in `answers.jsonl`
- Disagreements documented in `general.jsonl`

---

## Dependency Graph

```
                    ┌─────────────┐
                    │   Main      │
                    │ Orchestrator│
                    └──────┬──────┘
                           │
              ┌────────────┴────────────┐
              │                         │
        ┌─────▼──────┐          ┌──────▼──────┐
        │  Context   │          │     AI      │
        │  Indexer   │          │  Responder  │
        └─────┬──────┘          └─────────────┘
              │
        ┌─────▼──────┐
        │  Context   │
        │  Analyzer  │
        └─────┬──────┘
              │
        ┌─────▼──────┐
        │  Database  │
        └─────┬──────┘
              │
     ┌────────▼───────┐
     │   Backend      │
     │ Business Logic │
     └────────┬───────┘
              │
     ┌────────▼───────┐
     │   Backend API  │
     └────────┬───────┘
              │
     ┌────────▼───────┐
     │   Frontend     │
     │     State      │
     └────────┬───────┘
              │
     ┌────────▼───────┐
     │   Frontend     │
     │  Components    │
     └────────┬───────┘
              │
        ┌─────▼──────┐
        │   Testing  │
        └────────────┘

    (Autopilot monitors all layers)
```

---

## Roadmap & Execution Phases

### PHASE 1: CRÍTICO - Blockers (1-2 weeks)
**Objetivo:** Fix bugs preventing core functionality

**Sprint 1.1 - Contract Alignment (2-3 days)**
- [ ] Align `/api/hub` with `useHubData` (4h) - backend-api
- [ ] Fix POST rating response type (2h) - backend-api
- [ ] Implement GET `/academy/lessons/:id/progress` (3h) - backend-api
- [ ] Standardize ms vs seconds (2h) - backend-api + frontend-state
- **Total:** 11h

**Sprint 1.2 - Technical Corrections (1-2 days)**
- [ ] Consolidate QueryClient (30min) - frontend-state
- [ ] Remove duplicate tests (1h) - testing
- [ ] Update `recommendations.jsonl` (2h) - context-analyzer
- **Total:** 3.5h

**DELIVERABLE:** Frontend and Backend integrated without contract errors

### PHASE 2: ALTA - Core Features (2-3 weeks)
**Objetivo:** Complete essential PRD features

**Sprint 2.1 - Comment System (4-5 days)**
- [ ] Moderation endpoints (4h) - backend-api
- [ ] Hook `useLessonComments` (3h) - frontend-state
- [ ] Component with threads (5h) - frontend-components
- [ ] Tests (4h) - testing
- **Total:** 16h

**Sprint 2.2 - Workers & Hidra Queues (5-7 days)**
- [ ] Setup BullMQ + Redis (4h) - backend-business-logic
- [ ] CampaignWorker (6h) - backend-business-logic
- [ ] Control APIs (3h) - backend-api
- [ ] Real-time UI (4h) - frontend-components
- **Total:** 17h

**Sprint 2.3 - Advanced Drip Content (3-4 days)**
- [ ] Dependency logic (4h) - backend-business-logic
- [ ] Admin config UI (4h) - frontend-components
- [ ] Visual indicators (2h) - frontend-components
- **Total:** 10h

**DELIVERABLE:** Functional comments, operational workers, complete drip

### PHASE 3: MÉDIA - Production Prep (2-3 weeks)

**Sprint 3.1 - Observability (4-6 days)**
- [ ] Prometheus + Grafana (6h)
- [ ] CorrelationID middleware (2h)
- [ ] Basic alerting (4h)
- **Total:** 12h

**Sprint 3.2 - S3/Supabase Storage (5-7 days)**
- [ ] Supabase Storage integration (6h)
- [ ] Upload with progress (4h)
- [ ] Auto encoding (optional, 8h)
- **Total:** 10-18h

**Sprint 3.3 - UX & Accessibility (3-4 days)**
- [ ] WCAG 2.1 audit (4h)
- [ ] Skeleton loaders (3h)
- [ ] Mobile responsiveness (3h)
- **Total:** 10h

**DELIVERABLE:** System ready for staging/beta

---

## Success Criteria

### Per Agent
- ✅ All checkboxes in prompt completed
- ✅ Progress file shows 100% + status: completed
- ✅ No open blockers
- ✅ Documentation synchronized with code
- ✅ Tests passing (unit, integration, E2E as applicable)
- ✅ Downstream agents notified

### Global Project
- ✅ 100% feature completeness vs PRD
- ✅ 0 architectural violations
- ✅ 90%+ test coverage
- ✅ All Top 10 gaps resolved
- ✅ NPS > 60 target achievable
- ✅ Production-ready deployment

---

## Monitoring & Maintenance

**Context Indexer:** Monitors for changes, reindexes on detection
**Context Analyzer:** Continuous scanning, generates timestamped reports
**Autopilot:** 60s loop, monitors PIDs, progress, logs, coordination
**All Agents:** Update progress.json after each milestone, notify blockers immediately

**Change Detection:**
- Prompts: Check timestamps, reindex if newer than last
- PRD/UI: Hash-based change detection
- Src: File count + critical path timestamps
- Architecture: Documentation modification times

**Health Indicators:**
- All PIDs active
- No progress files stale > 10min
- Questions answered < 5min SLA
- No repeated errors in logs
- Dependencies.json reflects current state
