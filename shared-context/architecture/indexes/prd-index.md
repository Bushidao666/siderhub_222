# PRD Index
Source: .agents/shared-context/PRD_SiderHub.md
Generated: 2025-11-03T17:07:41Z

## Quick Overview
- **Objetivos primários** — centralizar acesso, engajar Academia, elevar adoção do Hidra e downloads Cybervault, NPS > 60 (`PRD_SiderHub.md:33`–`PRD_SiderHub.md:38`).
- **Objetivos secundários** — reduzir tickets de suporte, onboarding < 15min, conclusão > 60%, membros ativos semanais > 75% (`PRD_SiderHub.md:40`–`PRD_SiderHub.md:44`).
- **KPIs** — Engajamento, Academia, Hidra, Cybervault, Performance técnica com metas explícitas de tempo/resposta (`PRD_SiderHub.md:46`–`PRD_SiderHub.md:74`).

## Domain Feature Matrix
| Domínio | Principais features | KPIs / Requisitos |
|---|---|---|
| Hub (`PRD_SiderHub.md:80`) | Banners hero configuráveis, carrossel SaaS, vitrine da Academia, painel Hidra resumido, recomendações personalizadas | Homepage < 2s, acesso rápido a SaaS, métricas de uso em analytics |
| Academia (`PRD_SiderHub.md:154`) | Grid de cursos, status (bloqueado, em andamento), drip content, player com Video.js 8, ratings⭐, comentários threads, tracking a cada 10s | Course completion rate, video engagement, average progress, comentários por aula |
| Hidra (`PRD_SiderHub.md:518`) | Configuração Evolution API criptografada, dashboard (envios, entregues, falhas), wizard multi-step (5 passos), agendamentos, logs de fallback | Active campaigns, success rate, mensagens/dia, conformidade segurança |
| Cybervault (`PRD_SiderHub.md:1230`) | Biblioteca categorizada, busca + filtros, cards com metadata, tracking downloads, upload admin com tags | Downloads por membro, search efficiency, upload governance |
| Admin (`PRD_SiderHub.md:1333`) | CRUD banners, membros, cursos, recursos, analytics geral, feature toggles | Governança de acesso, redução de tickets, visibilidade 360º |
| Auth & Permissões (`PRD_SiderHub.md:1375`) | Login único, JWT access 15m + refresh 7d, roles (`member`, `mentor`, `admin`, `super_admin`), controles por SaaS, auditoria sessões | Segurança MFA futuro, uptime > 99.5%, compliance |

## Current Cycle Focus
- **Fluxo principal navegável** — jornada login → hub → hidra/cybervault/admin descrita nos casos de uso precisa funcionar ponta a ponta (`PRD_SiderHub.md:1996`–`PRD_SiderHub.md:2055`).
- **Hub overview completo** — consolidar banners, cursos em destaque/recomendados, métricas Hidra e recursos em `HubService`/`/api/hub` (`PRD_SiderHub.md:80`–`PRD_SiderHub.md:202`, `PRD_SiderHub.md:518`–`PRD_SiderHub.md:742`).
- **Lesson ratings** — captura notas 1–5, média, contagem e rating do usuário (`PRD_SiderHub.md:399`, `PRD_SiderHub.md:1556`).
- **Progress ticks de 10s** — registra posição/percentual, reativa progresso do curso e desbloqueios drip (`PRD_SiderHub.md:156`, `PRD_SiderHub.md:350`, `PRD_SiderHub.md:1553`).
- **Cybervault downloads auditáveis** — contadores por recurso + badges de destaque (`PRD_SiderHub.md:1230`–`PRD_SiderHub.md:1330`).
- **Painel Admin** — placeholders precisam evoluir para CRUD real de banners/membros/feature toggles (`PRD_SiderHub.md:1333`–`PRD_SiderHub.md:1504`).

## MVP vs Roadmap
- **MVP Core** — funcionalidades listadas no capítulo 6.1 + seções marcadas como essenciais (`PRD_SiderHub.md:2064`).
- **Pós-MVP** — melhorias e features futuras (templates Hidra, detalhamento Cybervault, integrações extras) (`PRD_SiderHub.md:2112`).

## User Stories & Use Cases
- **User Stories** — login hub, ver banners, acessar SaaS, assistir aula, comentar, criar campanha, baixar recurso, gerenciar banners (`PRD_SiderHub.md:1882`–`PRD_SiderHub.md:1973`).
- **Use Cases** — UC-01 login, UC-02 assistir aula, UC-03 campanhas Hidra (`PRD_SiderHub.md:1992`–`PRD_SiderHub.md:2033`).

## Open Questions & Decisions Needed
- Perguntas pendentes categorizadas (Alta/Média/Baixa prioridade) (`PRD_SiderHub.md:2175`–`PRD_SiderHub.md:2195`).
- Decisões já tomadas registradas (`PRD_SiderHub.md:2203`).

## Section Map (line anchors)
- 1. Visão Geral — `PRD_SiderHub.md:3`
- 2. Objetivos de Negócio — `PRD_SiderHub.md:25`
- 3. Funcionalidades Detalhadas — `PRD_SiderHub.md:78`
  - 3.1 Hub Principal — `PRD_SiderHub.md:80`
  - 3.2 Hidra — `PRD_SiderHub.md:518`
  - 3.3 Cybervault — `PRD_SiderHub.md:1230`
- 4. Painel de Administração — `PRD_SiderHub.md:1333`
- 5. Autenticação & Permissões — `PRD_SiderHub.md:1375`
- 6. Requisitos Técnicos — `PRD_SiderHub.md:1504`
- 7. Requisitos Não-Funcionais — `PRD_SiderHub.md:1847`
- 8. User Stories — `PRD_SiderHub.md:1880`
- 9. Casos de Uso — `PRD_SiderHub.md:1990`
- 10. MVP vs Futuro — `PRD_SiderHub.md:2062`
- 11. Fora de Escopo — `PRD_SiderHub.md:2159`
- 12. Perguntas Pendentes — `PRD_SiderHub.md:2175`
- 13. Decisões — `PRD_SiderHub.md:2203`
- 14. Cronograma — `PRD_SiderHub.md:2218`
- 15. Riscos & Mitigações — `PRD_SiderHub.md:2234`
