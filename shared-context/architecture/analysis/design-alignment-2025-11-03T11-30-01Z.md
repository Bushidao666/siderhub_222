# Design Alignment — Dark Neon System

Timestamp: 2025-11-03T11:30:01Z

- ✅ Layouts neon consolidados: `src/frontend/layouts/HubLayout.tsx:12` e `src/frontend/layouts/AdminLayout.tsx:18` aplicam tokens de cores/glow e navegação upper-case conforme UI_DESIGN_SYSTEM.
- ⚠️ Aula sem experiência social — `src/frontend/pages/Academy/LessonDetail.tsx:105` renderiza apenas player/feedback; componentes de thread, indicadores de moderação e CTA de comunidade previstos no design continuam ausentes.
- ⚠️ Wizard Hidra não materializa o fluxo “stepper neon”: `src/frontend/pages/Hidra/Wizard.tsx:12` mostra card estático sem progress bar, animações ou formulários reais.
- ⚠️ Painel Admin/Membros carece de ações com estados visuais (promote/demote/remove são TODOs em `src/frontend/pages/Admin/Members.tsx:24`), portanto não há feedback neon para as operações críticas de RBAC.
