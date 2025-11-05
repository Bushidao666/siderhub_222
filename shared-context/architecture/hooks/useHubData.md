# useHubData

## Propósito
Fornece dados agregados do Hub (banners, cursos em destaque, recomendações e métricas do Hidra) usando React Query, consolidando múltiplos endpoints em uma única chamada.

## Retorno
- `data`: objeto estruturado com
  - `banners: HeroBanner[]`
  - `academy`
    - `featured: CourseMeta[]`
    - `recommendations: HubAcademyRecommendation[]`
  - `hidra`
    - `totals: HidraDashboardTotals | null`
    - `messageSummary: HidraMessageSummary | null`
  - `cybervault`
    - `featuredResources: Resource[]`
  - `generatedAt: string | null`
- `hasContent`: boolean indicando se há pelo menos um módulo populado.
- Demais campos padrão do `useQuery` (`isLoading`, `error`, etc.).

## Endpoints Consumidos
- `GET /hub` (payload `HubOverview`)
- _Fallback_: 
  - `GET /hub/banners?status=active`
  - `GET /academy/courses/featured`
  - `GET /academy/courses/recommended`
  - `GET /hidra/campaigns/metrics/overview`

## Dependências
- `ApiClient` com token do `useAuthStore`
- `assertSuccess` para validar respostas
- Tipos compartilhados em `src/shared/types/{admin,academy,hidra}.types.ts`
- Chaves de cache em `src/frontend/lib/queryClient.ts`

## Observações
- Query habilitada apenas se o usuário estiver autenticado (`selectIsAuthenticated`).
- Tenta primeiro o agregador `/hub` (que retorna `HubOverviewPayload` já estruturado para o App shell); se indisponível volta aos endpoints tradicionais.
- Falha na métrica do Hidra não invalida o restante: retorna `campaignMetrics = null`.
- Recursos destacados e totais do Hidra são preenchidos apenas quando o agregador responde com sucesso (fallback mantém valores padrão vazios ou `null`).
- `academy.recommendations` preserva o objeto `{ course, recommendation }`, permitindo que componentes escolham entre acessar a recomendação original (`recommendation`) ou os metadados completos do curso (`course`).
- `staleTime` ajustado para 60s para reduzir revalidações desnecessárias do dashboard.
