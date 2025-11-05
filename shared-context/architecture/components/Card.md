# Card (common)

Props (TypeScript):
- `variant?: 'solid' | 'outlined' | 'glass'`
- `glowing?: boolean`
- `...HTMLAttributes<HTMLDivElement>`

States:
- Default/outlined/glass backgrounds
- Glowing elevation when `glowing` true

Dependencies:
- `src/shared/design/tokens.ts` (colors, shadows, glows, typography)

Visual cues:
- Dark surfaces, subtle borders, rounded `xl/2xl`
- Neon glow on elevated cards; headings em `Rajdhani`
- `data-variant` e `data-glow` permitem animações finas (hover, dashboards)
