# Admin Members

## Arquivos
- Página: `src/frontend/pages/Admin/Members.tsx`
- Tabela: `src/frontend/components/admin/MemberTable.tsx`
- Hook de dados: `src/frontend/hooks/useAdminMembers.ts`

## Objetivo
Renderizar a listagem real de membros com filtros de busca/role, paginação, estados de carregamento/erro/vazio e badges indicando `accessMap` (features habilitadas por usuário). Consome `GET /admin/members` via React Query (`useAdminMembers`).

## Fluxo & Estado
- Filtros locais: `roleFilter`, `searchTerm`, `page`, `pageSize`
- Debounce de busca (250ms) antes de disparar nova query
- Query Key: `queryKeys.admin.members({ role, page, pageSize, search })`
- `refetch()` exposto via botão "Atualizar"
- `totalItems`/`totalPages` usados na paginação

## UI & Test IDs
- Container: `admin-members`
- Filtros: `admin-members-filters`
  - Busca: `admin-members-search`
  - Role: `admin-members-role-filter`
  - Page size: `admin-members-page-size`
  - Resumo: `admin-members-summary`
  - Refresh: `admin-members-refresh`
- Feedback de erro: `admin-members-error`
- Tabela (`MemberTable`):
  - Loading skeleton: `admin-members-loading`
  - Empty state: `admin-members-empty`
  - Linhas: `admin-member-row`
  - Paginação: `admin-members-prev`, `admin-members-next`
  - Badges de role: `admin-member-role-{role}`
  - Access map container: `admin-member-access-map`

## MemberTable
- Props estendidos: `emptyMessage`, `page`, `totalPages`, `onPreviousPage`, `onNextPage`
- Estados
  - Loading → card pulsante com 4 barras skeleton
  - Empty → card outlined com mensagem contextual (filtros vs. sem registros)
- Colunas: Nome, Email, Role (badge), Acesso (`Badge` por feature), Último login (texto fallback "Nunca acessou"), Ações (promover/rebaixar/remover — pendientes de integração)
- AccessMap: `FeatureAccessKey` mapeado para labels (`Hidra`, `Cybervault`, `Academia`, `Admin Console`, `Community`), cor neon quando habilitado

## Estilos
- Inputs/Selects usam tokens (`colors.borderPrimary`, `colors.bgSecondary`)
- Erros e sucesso usam `surfaces.errorTint`
- Botões: `Button` neon (primary/ghost) com `size="sm"`

## Dependências
- Design tokens `@design/tokens`
- `useAdminMembers` já realiza flatten `ApiResponse<PaginatedResponse<AdminMemberItem>>`
- `mapApiError` para exibir mensagem humanizada

## Pendências Futuras
- Integrar handlers `onPromote/onDemote/onRemove` com AdminService
- Adicionar filtros adicionais (status, feature) após backend expor contratos
- Adicionar paginação por número (paginador completo)

