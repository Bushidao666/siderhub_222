# BannerForm (admin)

Props:
- `initial?: Partial<HeroBanner> | null`
- `onSubmit?: (values: BannerFormValues) => Promise<void> | void`
- `submitting?: boolean`
- `error?: string | null`
- `successMessage?: string | null`

States:
- Validação (zod) com mensagens
- Status badge dinâmico (active/inactive/scheduled)

Dependencies:
- `src/shared/types/admin.types#HeroBanner, BannerCta`
- Common: `Input`, `Button`, `Card`, `Badge`
- Tokens: `src/shared/design/tokens.ts`

Visual cues:
- Form em card outlined; campos com foco neon
- Ações primárias com glow; labels uppercase
