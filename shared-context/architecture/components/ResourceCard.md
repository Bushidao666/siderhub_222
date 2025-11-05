# ResourceCard (cybervault)

Props:
- `resource: Resource`
- `onOpen?: (id: string) => void`
- `onDownload?: (id: string) => void`

States:
- Preview image vs placeholder
- Tags overflow condensed as +N

Dependencies:
- `src/shared/types/cybervault.types#Resource`
- Common: `Card`, `Badge`, `Button`

Visual cues:
- Top-left badge with resource type
- Neon accents in actions

Testing:
- Root: `data-testid="component-resource-card"`
- Botão abrir: `data-testid="component-resource-card-open"`
- Botão download: `data-testid="component-resource-card-download"`
