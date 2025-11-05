# UI Design Index
Source: .agents/shared-context/UI_DESIGN_SYSTEM.md
Generated: 2025-11-03T17:07:41Z

## Core Principles
- Dark neon aesthetic inspirado no fórum Blacksider, com foco em contraste e responsividade (`UI_DESIGN_SYSTEM.md:3`–`UI_DESIGN_SYSTEM.md:13`).
- Orientação mobile-first e cobertura WCAG 2.1 AA como baseline (`UI_DESIGN_SYSTEM.md:11`–`UI_DESIGN_SYSTEM.md:13`).

## Token Summary
- **Cores** — primárias, backgrounds, textos, accents e overlays definidos (`UI_DESIGN_SYSTEM.md:16`–`UI_DESIGN_SYSTEM.md:53`), refletidos em `src/shared/design/tokens.ts`.
- **Gradientes & Glassmorphism** — padrões para hero, cards especiais, glows (`UI_DESIGN_SYSTEM.md:55`–`UI_DESIGN_SYSTEM.md:71`).
- **Sombras & Glow** — presets de profundidade e neon (`UI_DESIGN_SYSTEM.md:73`–`UI_DESIGN_SYSTEM.md:93`).
- **Tipografia** — famílias, escala, pesos, espaçamento e hierarquia uppercase (`UI_DESIGN_SYSTEM.md:97`–`UI_DESIGN_SYSTEM.md:178`).
- **Espaçamento & Grid** — escala base e grid 12 colunas (`UI_DESIGN_SYSTEM.md:860`–`UI_DESIGN_SYSTEM.md:904`).

## Component Library
- **Botões, cards, inputs, navegação, badges, modals, loading states** (`UI_DESIGN_SYSTEM.md:229`–`UI_DESIGN_SYSTEM.md:742`).
- **Animações** — guidelines para hover/focus/entradas neon (`UI_DESIGN_SYSTEM.md:797`–`UI_DESIGN_SYSTEM.md:836`).
- **Temas por domínio** — variações visuais para Hub, Academia, Hidra, Cybervault, Admin (`UI_DESIGN_SYSTEM.md:1095`–`UI_DESIGN_SYSTEM.md:1117`).
- **Componentes Blacksider** — logo, mascote, elementos de branding (`UI_DESIGN_SYSTEM.md:1164`–`UI_DESIGN_SYSTEM.md:1199`).

## Implementation Hotspots
- **Navigation & CTA chips** — tokens para navbar, pill states e CTA primário (`UI_DESIGN_SYSTEM.md:489`–`UI_DESIGN_SYSTEM.md:566`).
- **Cards & métricas** — estilos base + variantes com glow (`UI_DESIGN_SYSTEM.md:326`–`UI_DESIGN_SYSTEM.md:386`, `UI_DESIGN_SYSTEM.md:1108`). Respaldam `MetricsOverview` e cards do Hub.
- **Badges & tags** — tokens para status SaaS e recomendações (`UI_DESIGN_SYSTEM.md:596`–`UI_DESIGN_SYSTEM.md:612`).
- **Modals & overlays** — backdrop/containers para `DownloadModal` e popovers (`UI_DESIGN_SYSTEM.md:653`–`UI_DESIGN_SYSTEM.md:702`).
- **Wizard steps** — barras de progresso e labels neon para o fluxo Hidra (`UI_DESIGN_SYSTEM.md:1109`).
- **Player Academia** — layout player + lista, controles custom neon (`UI_DESIGN_SYSTEM.md:1103`, `UI_DESIGN_SYSTEM.md:1141`).
- **Focus & glow tokens** — `--glow-sm/md/lg` e `--text-glow` usados em componentes com estado ativo (`UI_DESIGN_SYSTEM.md:73`–`UI_DESIGN_SYSTEM.md:93`, `UI_DESIGN_SYSTEM.md:164`).

## Layout & Responsividade
- **Breakpoints** — mobile, tablet, desktop com orientações de stacking (`UI_DESIGN_SYSTEM.md:973`–`UI_DESIGN_SYSTEM.md:1008`).
- **Layout principal** — shell em três colunas; layout da academia com player + lista (`UI_DESIGN_SYSTEM.md:1124`–`UI_DESIGN_SYSTEM.md:1153`).

## Acessibilidade & Implementação
- Focus states neon, screen reader only helpers, ARIA patterns (`UI_DESIGN_SYSTEM.md:1032`–`UI_DESIGN_SYSTEM.md:1081`).
- Integração Tailwind + Shadcn + tokens (`UI_DESIGN_SYSTEM.md:1203`–`UI_DESIGN_SYSTEM.md:1281`).
- Checklist final de implementação e recursos de apoio (`UI_DESIGN_SYSTEM.md:1281`–`UI_DESIGN_SYSTEM.md:1296`).

## Section Map (line anchors)
- Visão Geral — `UI_DESIGN_SYSTEM.md:3`
- Paleta de Cores — `UI_DESIGN_SYSTEM.md:16`
- Tipografia — `UI_DESIGN_SYSTEM.md:97`
- Navigation — `UI_DESIGN_SYSTEM.md:489`
- Componentes — `UI_DESIGN_SYSTEM.md:229`
- Animações — `UI_DESIGN_SYSTEM.md:797`
- Espaçamento & Layout — `UI_DESIGN_SYSTEM.md:860`
- Ícones — `UI_DESIGN_SYSTEM.md:942`
- Responsividade — `UI_DESIGN_SYSTEM.md:973`
- Acessibilidade — `UI_DESIGN_SYSTEM.md:1032`
- Temas por Seção — `UI_DESIGN_SYSTEM.md:1095`
- Layouts — `UI_DESIGN_SYSTEM.md:1124`
- Componentes específicos Blacksider — `UI_DESIGN_SYSTEM.md:1164`
- Implementação Tailwind + Shadcn — `UI_DESIGN_SYSTEM.md:1203`
- Checklist — `UI_DESIGN_SYSTEM.md:1281`
