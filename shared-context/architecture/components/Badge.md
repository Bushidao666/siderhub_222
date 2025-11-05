# Badge (common)

Props (TypeScript):
- `variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'outline'`
- `icon?: ReactNode`
- `srLabel?: string` (texto adicional apenas para leitores de tela)
- `...HTMLAttributes<HTMLSpanElement>`

States:
- Default vs outline vs semantic accents
- Compact uppercase pills; supports icons

Dependencies:
- `src/shared/design/tokens.ts`

Visual cues:
- Rounded-full pill, uppercase, tight tracking
- Neon accents para semânticas; `data-variant` expõe estado para CSS overrides
