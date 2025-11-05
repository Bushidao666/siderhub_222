# useResourceLibrary

## Propósito
Busca e pagina recursos do Cybervault aplicando filtros, com debounce para consultas e cache via React Query.

## Retorno
- `data: PaginatedResponse<Resource>`
- Propriedades padrão do `useQuery` (`isLoading`, `error`, `refetch`, `isFetching`, ...)

## Parâmetros
- `filters?: ResourceFilterParams` (query, categoryIds, tagIds, types, visibility)
- `pagination?: PaginationParams` (page, pageSize, sortBy, sortDirection)
- `debounceMs?: number` (default 300ms)

## Endpoints Consumidos
- `GET /cybervault/resources?query=&categoryIds=&tagIds=&types=&visibility=&page=&pageSize=&sortBy=&sortDirection=`

## Dependências
- `ApiClient` autenticado (`useAuthStore`)
- `assertSuccess`
- Tipos `Resource`, `ResourceFilterParams`, `PaginationParams` (`src/shared/types/*`)
- `queryKeys.cybervault.resourcesList(signature)`

## Observações
- A chave do cache utiliza assinatura serializada e debounce interno para evitar requisições excessivas durante a digitação.
- Query habilitada apenas quando o usuário está autenticado.
- Para registrar downloads, combine com `useResourceDownload` (invalida listas após sucesso).
