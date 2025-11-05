# queryClient / Hydration Helpers

## Propósito
Unificar a configuração do React Query no frontend, expondo instância singleton, factory para SSR e helpers de hidratação/desidratação.

## API
- `createQueryClient()` — retorna um `QueryClient` com `defaultOptions` padronizados (staleTime queries = 60s, gcTime = 5min, retry ajustado).
- `getQueryClient()` / `queryClient` — acessa a instância compartilhada (singleton em ambiente client).
- `dehydrateQueryClient(client)` — wrapper para `dehydrate` (serializar cache no SSR).
- `hydrateQueryClient(client, state)` — aplica `hydrate` de volta ao cliente (no bootstrap).
- `HydrationBoundary` — reexport do helper do React Query para envolver a árvore do app com o estado desidratado.
- `queryKeys` — catálogo central de chaves (`auth`, `hub`, `academy`, `hidra`, `cybervault`).

## Observações
- `App.tsx` passou a consumir `getQueryClient()` e envolver o router com `HydrationBoundary`, aceitando `initialQueryState` opcional.
- Tests podem continuar criando `new QueryClient()` localmente; helpers são destinados ao App shell/SSR.
- Evite instanciar `new QueryClient()` em hooks/componentes — reutilize a instância/export para compartilhar cache e analytics.
