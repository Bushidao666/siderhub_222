# useCampaignStats

## Propósito
Disponibiliza métricas consolidadas das campanhas do Hidra (totais, visão geral e timeline agregada) usando uma query própria (`hidra.campaigns.stats`) derivada do dashboard principal.

## Retorno
- `campaigns: CampaignDetail[]`
- `overview: Omit<CampaignMetrics, 'campaignId'> | null`
- `timeline: CampaignTimelinePoint[]`
- `totals: HidraDashboardTotals | null`
- Propriedades padrão de `useQuery` (`isLoading`, `error`, `refetch`, ...)

## Endpoints Consumidos
- `GET /hidra/dashboard` (via `QueryClient.ensureQueryData` compartilhado com `useHidraDashboard`)

## Dependências
- `ApiClient` autenticado (`useAuthStore`)
- `assertSuccess`
- Tipos `CampaignDetail`, `CampaignMetrics`, `CampaignTimelinePoint`, `HidraDashboardTotals`
- `queryKeys.hidra.campaignStats()` — chave dedicada (`['hidra','campaigns','stats', ...]`)
- `queryKeys.hidra.dashboard()` — usada como fonte de hidratação

## Observações
- A query é habilitada apenas quando o usuário está autenticado.
- O hook reutiliza os dados do dashboard via `ensureQueryData`, evitando requisições duplicadas.
- A timeline agrega pontos por timestamp somando `delivered` e `failed` de todas as campanhas.
- A média de entrega (`averageDeliveryMs`) é calculada ponderando pelos envios entregues.
- Invalidations do dashboard devem incluir também `hidra.campaigns.stats` para manter caches sincronizados.
