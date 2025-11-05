# FilterBar (cybervault)

Props:
- `query: string` · `onQueryChange: (v: string) => void`
- `categories: ResourceCategory[]` · `tags: ResourceTag[]`
- `selectedCategoryId?: string | null`
- `selectedType?: ResourceType | 'all'`
- `selectedVisibility?: Visibility | 'all'`
- `onChangeCategory?: (id: string | null) => void`
- `onChangeType?: (t: ResourceType | 'all') => void`
- `onChangeVisibility?: (v: Visibility | 'all') => void`
- `onClear?: () => void`

States:
- Seletor com opções; query controlada
- Filtros compostos; limpar seleção

Dependencies:
- `src/shared/types/cybervault.types#ResourceCategory, ResourceTag`
- `src/shared/types/common.types#ResourceType, Visibility`
- Common: `Input`, `Button`, `Card`

Visual cues:
- Controles em card outlined; selects escuros com texto claro
- Uppercase labels; bordas sutis
