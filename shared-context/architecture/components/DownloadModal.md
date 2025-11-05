# DownloadModal (cybervault)

Props:
- `resource: Resource | null`
- `open: boolean`
- `onConfirm: (resourceId: string) => Promise<number | void> | number | void` (resolve para total atualizado)
- `onClose: () => void`

States:
- Oculto quando `resource` nulo ou `open=false`
- Estado de confirmação (`loading` no botão primário)
- Mensagem de sucesso/erro (`download-success` / `download-error`)
- Contador de downloads atualizado (`download-count`)

Dependencies:
- `src/shared/types/cybervault.types#Resource`
- Common: `Button`, `CardTitle`
- Tokens: `colors`, `glows`, `typography`

Visual cues:
- Modal elevado com glow verde, overlay escuro clicável
- Texto auxiliar uppercase informando rastreamento
- Feedbacks coloridos (verde para sucesso, vermelho para erro)
