# Architecture Overview — SiderHub

Status: 🚧 Em construção (Main Orchestrator mantém)

## Tech Stack
- **Backend**: Node.js 20, Express 4, TypeScript 5, Prisma 5, Zod, JWT + bcrypt, Redis (opcional para filas/sessions cache)
- **Frontend**: React 18, Vite, TypeScript, Zustand (state), React Query (data fetching), React Hook Form + Zod resolver, Tailwind CSS + Design Tokens neon + ShadcnUI
- **Database**: PostgreSQL 14 (schemas `core`, `academy`, `hidra`, `cybervault`, `admin`)
- **Testing**: Jest + Supertest (API), Vitest + React Testing Library (UI), Playwright (E2E)
- **Tooling**: ESLint (Airbnb + custom), Prettier, Husky (pre-commit), pnpm

## Domínios Principais

### 1. Identidade & SSO
- Membros entram via login unificado (email + senha + MFA futuro)
- Roles: `member`, `mentor`, `admin`, `super_admin`
- Permissões granulares configuradas no painel
- Sessões: JWT access (15min) + refresh (7d) com rotation, registro no schema `core.sessions`
- Integra com mapas de acesso para SaaS (Hidra, Cybervault) e cursos

### 2. Hub Principal (“Netflix style”)
- Hero banners configuráveis pelo admin (ordem, CTA, timers)
- Carrossel de SaaS habilitados por membro
- Seção “Academia” com cards de cursos, status (locked, in-progress, completed)
- Seção “Recomendações” (conteúdo com base em progressos)

### 3. Academia
- Estrutura: Curso → Módulos → Aulas (vídeo, material de apoio, quiz)
- Progress tracking por usuário (percentual, timestamps)
- Comentários por aula (moderação pelos mentores)
- Drip release (datas de liberação) e gating por role/feature flag

### 4. Hidra (WhatsApp Campaign Orchestrator)
- Configuração da Evolution API individual (URL https:// + API key criptografada)
- Campanhas (info, target lists, horários, status)
- Disparo: coordenação + estatísticas (enviadas, entregues, falhas)
- Logs de fallback quando Evolution API não responde

### 5. Cybervault (Biblioteca de Recursos)
- Categorias (templates, playbooks, assets)
- Recursos com metadados (tipo, formato, tamanho, tags, autor)
- Controle de acesso por role, tracking de downloads/visualizações
- Busca por tags, texto e filtros

### 6. Painel de Administração
- Gestão de membros e convites
- Gestão de banners, cursos, módulos, aulas, assets
- Configuração de roles/permissions por SaaS
- Visão geral de métricas (engajamento, cursos, Hidra, Cybervault)

## Arquitetura Lógica
```
src/
  shared/
    types/        # contratos globais (domínio + API)
    utils/        # utilidades (apiClient, validation, error maps)
    design/
      tokens.ts   # design tokens do UI Design System
  backend/
    api/          # rotas Express (agrupadas por domínio)
    services/     # business logic, orquestra workflows
    repositories/ # Prisma calls (thin layer)
    middleware/   # auth, rate limiting, error handler
    jobs/         # workers (fila de notificações, se necessário)
  frontend/
    components/
      common/     # buttons, cards, inputs (seguir Design System)
      hub/        # hero, carrosséis, dashboards
      academy/    # course cards, player, progress
      hidra/      # campaign forms, stats
      cybervault/ # resource cards, list, filters
    hooks/        # react-query hooks (useCourses, useCampaigns)
    store/        # Zustand stores (auth, ui prefs)
    pages/        # roteamento (app shell, admin, hub)
    layouts/      # AuthLayout, AdminLayout, HubLayout
```

## Design Patterns & Convenções
- **Padrões Backend**: Service Layer + Repository + DTO mapeados via shared types. Validação com Zod antes de tocar nos services. Middlewares para auth (JWT, role guard) e audit log.
- **Padrões Frontend**: Atomic/Feature-based components, hooks para dados, store para estados de sessão. Design Tokens replicam variáveis do UI doc.
- **Naming**: arquivos kebab-case, componentes PascalCase, funções camelCase, tipos PascalCase, enums PascalCase singular, env vars SCREAMING_SNAKE_CASE.
- **Internationalization**: textos centralizados (placeholder). Priorizar português pt-BR inicialmente.
- **Accessibility**: contrastes do design system + aria labels, focus states neon.

## API Response Shape
Todos endpoints retornam `ApiResponse<T>` do shared types:
```
type ApiSuccess<T> = { success: true; data: T; timestamp: string; meta?: Record<string, unknown> };
type ApiError = { success: false; error: { code: string; message: string; details?: unknown }; timestamp: string };
type ApiResponse<T> = ApiSuccess<T> | ApiError;
```

## Segurança
- Password hashing `bcrypt` (cost 12) + MFA planejado (decisão d-003)
- Refresh token rotation + device tracking (IP, user agent)
- Secrets (Evolution API key) com criptografia em repouso (libsodium / AES-GCM via KMS)
- Rate limiting (login, campaigns triggers) + audit log
- Headers de segurança (CSP estrito, HSTS, X-Frame-Options deny)
- File storage: S3 compatível (Cybervault) com signed URLs

## Observabilidade
- Logging estruturado (Pino) com correlation-id por request
- Métricas via Prometheus/Grafana (latência API, jobs, campanhas)
- Alerting: falhas de envio Hidra, erros 500, picos de latency

## Documentação Modular
Este overview referencia documentação detalhada em `.agents/shared-context/architecture/*` (interfaces, api, schemas, hooks, components, services, utilities, middleware). Subagents devem atualizar os arquivos específicos quando criarem novos artefatos.
