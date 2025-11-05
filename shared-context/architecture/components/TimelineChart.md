# TimelineChart (hidra)

Props:
- `data: CampaignTimelinePoint[]`
- `height?: number` (default ~160)

States:
- Sem dados: placeholder informativo

Dependencies:
- `src/shared/types/hidra.types#CampaignTimelinePoint`

Visual cues:
- Barras empilhadas entregues/falhas; track escuro
- Neon verde para entregues; vermelho translúcido para falhas
