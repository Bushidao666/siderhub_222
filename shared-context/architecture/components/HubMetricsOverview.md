# HubMetricsOverview (hub)

Props:
- `metrics: CampaignMetrics | null | undefined`
- `loading?: boolean`

States:
- Skeleton grid quando `loading`
- Card de vazio (`hub-metrics-empty`) quando sem dados
- Grid de 4 métricas com `data-testid` por label (total, entregues, pendentes, falhas)
- Rodapé com timestamp e média de entrega

Dependencies:
- `src/shared/types/hidra.types#CampaignMetrics`
- Common: `Card`, `CardTitle`, `CardContent`
- Tokens: `colors`, `glows`, `typography`

Visual cues:
- Cartões neon com glow em métricas positivas
- Tipografia uppercase (`Rajdhani`) e números formatados pt-BR
- Mensagem contextual sobre sincronização Hidra
