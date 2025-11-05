# Input (common)

Props (TypeScript):
- `label?: string`
- `description?: string`
- `error?: string`
- `leftIcon?: ReactNode` / `rightIcon?: ReactNode`
- `variant?: 'default' | 'filled' | 'ghost'`
- `containerClassName?: string`
- `...InputHTMLAttributes<HTMLInputElement>`

States:
- Focus: neon outline; placeholder subdued
- Error: red border + helper text
- Disabled: reduced opacity; icons muted

Dependencies:
- `src/shared/design/tokens.ts`

Visual cues:
- Uppercase small label, `Rajdhani`
- Dark backgrounds, subtle borders; focus glow
