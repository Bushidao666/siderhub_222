# ProgressBar (common)

Props (TypeScript):
- `value: number`
- `max?: number` (default 100)
- `label?: string`
- `showLabel?: boolean` (default true)
- `tone?: 'primary' | 'success' | 'warning' | 'danger'`
- `...HTMLAttributes<HTMLDivElement>`

States:
- 0–100% with smooth transitions
- Optional label and percentage

Dependencies:
- `src/shared/design/tokens.ts`

Visual cues:
- Neon glow on bar; subtle track
- Uppercase small label, `Rajdhani`
