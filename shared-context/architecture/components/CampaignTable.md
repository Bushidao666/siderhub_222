# CampaignTable (hidra)

Props:
- `items: CampaignDetail[] | Campaign[]`
- `loading?: boolean`
- `onView?: (id: string) => void`
- `onPause?: (id: string) => void`
- `onResume?: (id: string) => void`
- `onDelete?: (id: string) => void`

States:
- Loading skeleton (linhas)
- Ações condicionais por status (pause/resume/delete)

Dependencies:
- `src/shared/types/hidra.types#Campaign, CampaignDetail`
- `src/shared/types/common.types#CampaignStatus`
- Common: `Card`, `Badge`, `Button`

Visual cues:
- Tabela com headers uppercase `Rajdhani`
- Chips de status; ações com CTAs neon/ghost

Testing:
- Root table: `data-testid="component-campaign-table"`
- Rows: `data-testid="component-campaign-row"`
