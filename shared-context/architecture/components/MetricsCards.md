# MetricsCards (hidra)

Props:
- `overview: Omit<CampaignMetrics, 'campaignId'> | null`
- `timeline: CampaignTimelinePoint[]`
- `loading?: boolean`

States:
- Skeletons para métricas
- Sem overview: ainda renderiza timeline

Dependencies:
- `src/shared/types/hidra.types#CampaignMetrics, CampaignTimelinePoint`
- Common: `Card`

Visual cues:
- Cartões com números em neon; labels uppercase
- Timeline com barras empilhadas (verde/erro)
