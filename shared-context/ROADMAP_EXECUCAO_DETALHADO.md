# ROADMAP DE EXECUÇÃO DETALHADO - SIDERHUB
**Gerado em:** 2025-11-03
**Baseado em:** Análise consolidada de 10 agentes especializados
**Status do Projeto:** 72% completo

---

## 📊 MÉTRICAS DE COMPLETUDE POR MÓDULO

| Módulo | Backend | Frontend | Testes | Status Global |
|--------|---------|----------|---------|---------------|
| **Auth/SSO** | 95% | 90% | 85% | ✅ 90% COMPLETO |
| **Hub Principal** | 90% | 75% | 70% | 🟢 78% COMPLETO |
| **Academia** | 85% | 60% | 65% | 🟡 70% COMPLETO |
| **Hidra** | 90% | 45% | 60% | 🟡 65% COMPLETO |
| **Cybervault** | 85% | 40% | 55% | 🟡 60% COMPLETO |
| **Admin** | 80% | 30% | 50% | 🟠 53% COMPLETO |

---

## 🔴 TOP 10 GAPS CRÍTICOS

### PRIORIDADE MÁXIMA (BLOQUEADORES)

#### 1. Contratos API/Frontend Desalinhados
- **Responsável:** Agente #3 (Backend API) + Agente #6 (Frontend)
- **Arquivos:**
  - `src/backend/api/hub/index.ts`
  - `src/frontend/hooks/useHubData.ts`
- **Problema:** Backend retorna estrutura achatada, frontend espera nested
- **Esforço:** 4 horas
- **Ação:** Alinhar HubOverviewPayload ou ajustar hook

#### 2. POST Rating Retorna Tipo Errado
- **Responsável:** Agente #3 (Backend API)
- **Arquivo:** `src/backend/api/academy/index.ts`
- **Problema:** Retorna `LessonRating`, frontend espera `LessonRatingSummary`
- **Esforço:** 2 horas
- **Ação:** Retornar agregação com average + totalRatings

#### 3. GET `/academy/lessons/:id/progress` Não Existe
- **Responsável:** Agente #3 (Backend API)
- **Arquivo:** `src/backend/api/academy/index.ts`
- **Problema:** Hook tenta buscar, endpoint não existe
- **Esforço:** 3 horas
- **Ação:** Criar endpoint de snapshot de progresso

#### 4. Workers/Jobs Completamente Ausentes
- **Responsável:** Agente #4 (Business Logic) + Agente #9 (Integrações)
- **Diretório:** `src/backend/jobs/` (VAZIO)
- **Problema:** Sem processamento assíncrono, campanhas não escalam
- **Esforço:** 16-20 horas
- **Ação:** Setup BullMQ + Redis, implementar CampaignWorker

### PRIORIDADE ALTA

#### 5. Testes Duplicados
- **Responsável:** Agente #7 (Testing)
- **Arquivos:**
  - `tests/backend/services/AcademyService.test.ts` (raiz)
  - `tests/backend/services/academy/AcademyService.test.ts`
- **Esforço:** 1 hora
- **Ação:** Deletar duplicata, manter apenas subpasta

#### 6. Hooks Faltantes
- **Responsável:** Agente #6 (Frontend State)
- **Hooks:** `useLessonComments`, `useCourseTree`
- **Esforço:** 6-8 horas
- **Ação:** Implementar hooks documentados

#### 7. QueryClient Duplicado
- **Responsável:** Agente #6 (Frontend State)
- **Arquivos:** `src/frontend/App.tsx`, `src/frontend/lib/queryClient.ts`
- **Esforço:** 30 minutos
- **Ação:** Usar instância de lib, remover de App.tsx

### PRIORIDADE MÉDIA

#### 8. Documentação Desatualizada
- **Responsável:** Context Analyzer
- **Arquivo:** `.agents/shared-context/architecture/analysis/recommendations.jsonl`
- **Esforço:** 2 horas
- **Ação:** Remover tarefas concluídas, atualizar status

#### 9. E2E Tests Desatualizados
- **Responsável:** Agente #7 (Testing)
- **Diretório:** `tests/e2e/`
- **Esforço:** 8-10 horas
- **Ação:** Atualizar specs Playwright, adicionar novos fluxos

#### 10. Observabilidade Ausente
- **Responsável:** Agente #8 (Infra) + Agente #9 (Integrações)
- **Esforço:** 12-16 horas
- **Ação:** Setup Prometheus/Grafana, correlationId, alerting

---

## 🎯 ROADMAP DE 3 FASES

### FASE 1: CRÍTICO - BLOQUEADORES (1-2 semanas)

#### Sprint 1.1 - Alinhamento de Contratos (2-3 dias)
**Objetivo:** Corrigir incompatibilidades API/Frontend

**Tarefas:**
1. [ ] **Alinhar `/api/hub` com `useHubData`** (4h)
   - Agente: #3 + #6
   - Decisão: Backend ajusta para estrutura esperada
   - Arquivos: `src/backend/api/hub/index.ts`, `src/frontend/hooks/useHubData.ts`

2. [ ] **Corrigir POST rating response** (2h)
   - Agente: #3
   - Backend retorna `LessonRatingSummary` com agregação
   - Arquivo: `src/backend/api/academy/index.ts`

3. [ ] **Implementar GET progress** (3h)
   - Agente: #3
   - Criar endpoint de snapshot
   - Arquivo: `src/backend/api/academy/index.ts`

4. [ ] **Padronizar ms vs seconds** (2h)
   - Agente: #3
   - Decisão: usar `seconds` em toda API
   - Atualizar contratos e validações Zod

**Deliverable:** Frontend e Backend integrados sem erros

#### Sprint 1.2 - Correções Técnicas (1-2 dias)

5. [ ] **Consolidar QueryClient** (30min)
   - Agente: #6
   - Remover duplicação em App.tsx
   - Usar instância de lib/queryClient.ts

6. [ ] **Remover testes duplicados** (1h)
   - Agente: #7
   - Deletar arquivo da raiz
   - Manter apenas versão em subpasta

7. [ ] **Atualizar recommendations.jsonl** (2h)
   - Agente: Context Analyzer
   - Remover tarefas concluídas
   - Atualizar status real

**Total Fase 1:** ~14.5 horas

---

### FASE 2: ALTA - FUNCIONALIDADES CORE (2-3 semanas)

#### Sprint 2.1 - Sistema de Comentários (4-5 dias)

8. [ ] **Endpoints de moderação** (4h)
   - Agente: #3
   - GET /admin/comments/pending
   - PUT /admin/comments/:id/approve
   - PUT /admin/comments/:id/reject

9. [ ] **Hook useLessonComments** (3h)
   - Agente: #6
   - CRUD de comentários
   - Threads aninhadas

10. [ ] **Componente LessonComments** (5h)
    - Agente: #6
    - UI com threads (até 3 níveis)
    - Moderação inline para admins

11. [ ] **Testes de comentários** (4h)
    - Agente: #7
    - Unit + Integration + Component tests

**Total Sprint 2.1:** 16 horas

#### Sprint 2.2 - Workers e Filas (5-7 dias)

12. [ ] **Setup BullMQ + Redis** (4h)
    - Agente: #4 + #9
    - Instalar dependências
    - Docker Compose para Redis

13. [ ] **CampaignWorker** (6h)
    - Agente: #4
    - Worker de processamento assíncrono
    - Respeita limites de envio

14. [ ] **APIs de controle** (3h)
    - Agente: #3
    - POST /hidra/campaigns/:id/start
    - PUT /hidra/campaigns/:id/pause
    - GET /hidra/campaigns/:id/status

15. [ ] **UI tempo real** (4h)
    - Agente: #6
    - Dashboard com status ao vivo
    - Logs de envio

**Total Sprint 2.2:** 17 horas

#### Sprint 2.3 - Drip Content Avançado (3-4 dias)

16. [ ] **Lógica de dependências** (4h)
    - Agente: #4
    - Módulo 2 só após 100% do Módulo 1
    - Service de validação

17. [ ] **UI config Admin** (4h)
    - Agente: #6
    - Formulário de regras de liberação
    - Seletor de datas/dependências

18. [ ] **Indicadores visuais** (2h)
    - Agente: #6
    - Tooltips explicando bloqueios
    - Countdown para liberação

**Total Sprint 2.3:** 10 horas

**Total Fase 2:** ~43 horas

---

### FASE 3: MÉDIA - PREPARAÇÃO PRODUÇÃO (2-3 semanas)

#### Sprint 3.1 - Observabilidade (4-6 dias)

19. [ ] **Prometheus + Grafana** (6h)
    - Agente: #8 + #9
    - Métricas de latência, throughput
    - Dashboards configurados

20. [ ] **CorrelationID middleware** (2h)
    - Agente: #8
    - RequestID em todos os logs
    - Propagação consistente

21. [ ] **Alerting básico** (4h)
    - Agente: #8
    - Alertas para erros 500
    - Alertas para filas travadas

**Total Sprint 3.1:** 12 horas

#### Sprint 3.2 - Storage S3/Supabase (5-7 dias)

22. [ ] **Integração Supabase Storage** (6h)
    - Agente: #9
    - Setup de buckets
    - Signed URLs

23. [ ] **Upload com progresso** (4h)
    - Agente: #6
    - UI de upload de vídeos
    - Barra de progresso

24. [ ] **Encoding automático** (8h - OPCIONAL)
    - Agente: #9
    - Worker FFmpeg
    - Múltiplas resoluções

**Total Sprint 3.2:** 10-18 horas

#### Sprint 3.3 - UX e Acessibilidade (3-4 dias)

25. [ ] **Auditoria WCAG 2.1** (4h)
    - Agente: #6
    - Contrastes, ARIA labels
    - Navegação por teclado

26. [ ] **Skeleton loaders** (3h)
    - Agente: #6
    - Substituir spinners

27. [ ] **Mobile responsiveness** (3h)
    - Agente: #6
    - Testes em dispositivos reais

**Total Sprint 3.3:** 10 horas

**Total Fase 3:** ~32-40 horas

---

## 📅 CRONOGRAMA SUGERIDO

### Semana 1-2 (FASE 1)
- **Foco:** Correções críticas
- **Esforço:** 14.5 horas
- **Agentes ativos:** #3, #6, #7, Context Analyzer

### Semana 3-5 (FASE 2)
- **Foco:** Funcionalidades core
- **Esforço:** 43 horas
- **Agentes ativos:** #3, #4, #6, #7, #9

### Semana 6-8 (FASE 3)
- **Foco:** Preparação produção
- **Esforço:** 32-40 horas
- **Agentes ativos:** #6, #8, #9

**TOTAL ESTIMADO:** 89.5-97.5 horas (~2.5-3 meses em desenvolvimento)

---

## 🎯 TAREFAS POR AGENTE

### Agente #1 - Arquitetura Geral
- Monitorar alinhamento arquitetural
- Atualizar architecture.md
- Validar decisões dos outros agentes
- Gerar relatórios de completude

### Agente #2 - Database
- Consolidar migrations duplicadas (Fase 1)
- Adicionar 2 índices faltantes (Fase 1)
- Completar seeds (Fase 2)

### Agente #3 - Backend API
- **CRÍTICO:** Alinhar contratos (Fase 1)
- **CRÍTICO:** Corrigir endpoints (Fase 1)
- Endpoints de moderação (Fase 2)
- APIs de controle workers (Fase 2)

### Agente #4 - Business Logic
- Implementar workers (Fase 2)
- Lógica de drip avançado (Fase 2)
- SegmentService/TemplateService (Fase 2)

### Agente #5 - Segurança
- Validar correções de Fase 1
- Audit log middleware (Fase 3)

### Agente #6 - Frontend
- **CRÍTICO:** Ajustar hooks (Fase 1)
- Consolidar QueryClient (Fase 1)
- Sistema de comentários (Fase 2)
- UI workers (Fase 2)
- UX e A11y (Fase 3)

### Agente #7 - Testing
- Remover duplicatas (Fase 1)
- Testes de comentários (Fase 2)
- Atualizar E2E (Fase 3)

### Agente #8 - Infra
- Setup Prometheus/Grafana (Fase 3)
- CorrelationID middleware (Fase 3)
- Alerting (Fase 3)

### Agente #9 - Integrações
- Setup workers (Fase 2)
- Integração Supabase (Fase 3)
- Observabilidade (Fase 3)

### Agente #10 - Consolidador
- Gerar relatórios semanais
- Atualizar este roadmap
- Validar métricas de completude

---

## ✅ CRITÉRIOS DE SUCESSO

### Fase 1
- [ ] Frontend carrega Hub sem erros
- [ ] Ratings funcionam corretamente
- [ ] Player retoma de onde parou
- [ ] Zero testes duplicados
- [ ] Documentação sincronizada

### Fase 2
- [ ] Comentários com threads funcionais
- [ ] Campanhas processam em background
- [ ] Drip content avançado operacional
- [ ] Coverage de testes > 70%

### Fase 3
- [ ] Métricas visíveis no Grafana
- [ ] Logs com correlationId
- [ ] Upload de vídeos funcional
- [ ] WCAG 2.1 AA compliant
- [ ] Mobile 100% responsivo

---

## 🚨 DECISÕES NECESSÁRIAS

**URGENTE - Product Owner:**
1. ❓ Alinhar contratos: Backend ajusta ou Frontend? (Recomendado: Backend)
2. ❓ Workers: BullMQ ou alternativa?
3. ❓ Storage: Supabase ou S3?

**IMPORTANTE - Tech Lead:**
4. ❓ Encoding de vídeos: Agora ou depois?
5. ❓ Redis: Obrigatório ou opcional?
6. ❓ Prometheus: Agora ou pós-launch?

---

**ÚLTIMA ATUALIZAÇÃO:** 2025-11-03
**PRÓXIMA REVISÃO:** Após conclusão da Fase 1 (2 semanas)
