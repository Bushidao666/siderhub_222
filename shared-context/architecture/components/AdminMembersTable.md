# AdminMembersTable

## Descrição
Componente de gestão de membros no painel admin, com filtros, paginação e ações de promote/demote/remove.

## Props (MemberTable)
- `members: Array<User & { accessMap?: MemberAccessMap[] }>` — lista de membros com mapa de acesso opcional
- `loading?: boolean` — estado de carregamento
- `emptyMessage?: string` — mensagem customizada para lista vazia
- `onPromote?: (id: string) => void` — callback de promoção de role
- `onDemote?: (id: string) => void` — callback de rebaixamento de role
- `onRemove?: (id: string) => void` — callback de remoção
- `page?: number` — página atual
- `totalPages?: number` — total de páginas
- `onPreviousPage?: () => void` — navegar para página anterior
- `onNextPage?: () => void` — navegar para próxima página

## Estados renderizados
1. **Loading**: Skeleton com 4 linhas pulsantes
2. **Empty**: Card com mensagem customizada
3. **Table**: Tabela completa com membros, roles, access map e ações

## Colunas da tabela
- Usuário (displayName ou email)
- Email
- Role (badge com variante neon para admin/super_admin)
- Acesso (badges para cada override no accessMap)
- Último login (formatado pt-BR ou "Nunca acessou")
- Ações (botões de promote/demote/remove conforme role)

## Test IDs
- Container: `admin-members`
- Filters: `admin-members-filters`
- Search: `admin-members-search`
- Role filter: `admin-members-role-filter`
- Page size: `admin-members-page-size`
- Summary: `admin-members-summary`
- Refresh: `admin-members-refresh`
- Error: `admin-members-error`
- Loading: `admin-members-loading`
- Empty: `admin-members-empty`
- Row: `admin-member-row`
- Role badge: `admin-member-role-{role}`
- Access map: `admin-member-access-map`
- Prev page: `admin-members-prev`
- Next page: `admin-members-next`

## Dependências
- Hook: `useAdminMembers(filters)` com filtros { page, pageSize, role?, search? }
- Design tokens: `colors`, `typography`, `surfaces`
- Tipos: `User`, `MemberAccessMap`, `UserRole`, `FeatureAccessKey`
- Utils: `mapApiError`, `useDebouncedValue` (custom local)

## Comportamentos
- Debounce de 250ms no campo de busca
- Reset de página ao mudar filtros
- Filtros: role (all | member | mentor | admin | super_admin), search, pageSize (10 | 20 | 50)
- Paginação com botões prev/next desabilitados conforme bounds
- Access map: badges verdes neon para enabled, cinza para disabled
- Ações condicionais por role:
  - Member: Promover a mentor
  - Mentor: Promover a admin | Rebaixar a member
  - Admin: Rebaixar a mentor
  - Todos: Remover
