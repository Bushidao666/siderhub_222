# Tabs (common)

Props (TypeScript):
- `tabs: { id: string; label: string; icon?: ReactNode; badge?: ReactNode; disabled?: boolean }[]`
- `value?: string` / `defaultValue?: string`
- `onChange?: (tabId: string) => void`
- `variant?: 'line' | 'contained'`
- `renderContent?: (tab) => ReactNode`
- `...HTMLAttributes<HTMLDivElement>`

States:
- Disabled tabs (aria-disabled, not focusable)
- Active underline (line) or filled (contained)
- Keyboard focus with neon outline

Dependencies:
- `src/shared/design/tokens.ts`

Visual cues:
- Uppercase `Rajdhani`, wide tracking
- Active tab glows; subtle neon underline (line)
