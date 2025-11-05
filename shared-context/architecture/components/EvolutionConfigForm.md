# EvolutionConfigForm (hidra)

Props:
- `initialConfig?: Partial<EvolutionApiConfig> | null`
- `onSubmit?: (values: { baseUrl: string; apiKey: string }) => Promise<void> | void`
- `submitting?: boolean`
- `error?: string | null`
- `successMessage?: string | null`

States:
- Validação (schema Zod) com mensagem inline
- Painel de status conectado/desconectado/erro
- Feedback visual para erro/sucesso usando `surfaces.errorTint` e `surfaces.successTint`

Dependencies:
- `src/shared/types/hidra.types#EvolutionApiConfig`
- `src/frontend/store/auth#useAuthStore` (lookup displayName)
- Common: `Card`, `Input`, `Button`
- Design tokens: `colors`, `surfaces`, `typography`

Visual cues:
- Outline neon no título, botões uppercase com glow
- Alertas suaves em fundos alpha ao invés de RGBA literal
- Rodapé exibe usuário autenticado em uppercase heading font
