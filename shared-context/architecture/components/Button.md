# Button (common)

Props (TypeScript):
- `variant?: 'primary' | 'secondary' | 'ghost' | 'danger'` — visual style
- `size?: 'sm' | 'md' | 'lg'` — dimensions
- `leftIcon?: ReactNode` / `rightIcon?: ReactNode`
- `loading?: boolean` — shows spinner and disables
- `...ButtonHTMLAttributes<HTMLButtonElement>`

States:
- Disabled/loading — reduced opacity, no glow
- Focus — neon outline (`colors.primary`)

Dependencies:
- `src/shared/design/tokens.ts` (colors, glows, typography)

Visual cues:
- Uppercase `Rajdhani`, tracking wide
- Neon glow on primary, translateY on hover

