# MemberTable (admin)

## Overview
Tabela responsiva para gestão de membros do SiderHub. Exibe usuários com roles, access maps, último login e ações de moderação (promover/rebaixar/remover).

**File**: `src/frontend/components/admin/MemberTable.tsx`

## Props
- `members: Array<User & { accessMap?: MemberAccessMap[] }>` — lista de usuários enriquecida com access overrides.
- `loading?: boolean` — exibe skeleton loader durante carregamento.
- `emptyMessage?: string` — mensagem customizada para estado vazio.
- `onPromote?: (id: string) => void` — callback ao promover membro (ex.: member→mentor, mentor→admin).
- `onDemote?: (id: string) => void` — callback ao rebaixar membro (ex.: admin→mentor, mentor→member).
- `onRemove?: (id: string) => void` — callback ao remover membro.
- `page?: number` — página atual da paginação.
- `totalPages?: number` — total de páginas.
- `onPreviousPage?: () => void` — navegar página anterior.
- `onNextPage?: () => void` — navegar próxima página.

## Estados
- **Loading**: Skeleton com 4 rows pulsantes (`data-testid="admin-members-loading"`).
- **Empty**: Card com mensagem customizada (`data-testid="admin-members-empty"`).
- **Populated**: Tabela com dados + paginação.

## Colunas da Tabela
1. **Usuário** — `profile.displayName` ou `email` como fallback.
2. **Email** — endereço do membro.
3. **Role** — badge colorido com role atual (Member/Mentor/Admin/Super Admin).
4. **Acesso** — badges mostrando overrides de features (Hidra, Cybervault, Academia, etc). Exibe "Sem overrides" se `accessMap` vazio.
5. **Último login** — timestamp formatado em `pt-BR` ou "Nunca acessou".
6. **Ações** — botões contextuais por role:
   - **Member**: botão "Promover a mentor"
   - **Mentor**: "Promover a admin" + "Rebaixar a member"
   - **Admin**: "Rebaixar a mentor"
   - **Todos**: botão "Remover"

## Paginação
- Footer com "Página X de Y" e botões Anterior/Próxima.
- Botões desabilitados quando fora dos limites (`page <= 1` ou `page >= totalPages`).
- data-testids: `admin-members-prev`, `admin-members-next`.

## Test IDs
- Container (loading): `admin-members-loading`
- Container (empty): `admin-members-empty`
- Row de membro: `admin-member-row`
- Role badge: `admin-member-role-{role}`
- Access map container: `admin-member-access-map`
- Paginação: `admin-members-prev`, `admin-members-next`

## Visual Design
- Headers em uppercase tracking `0.16em`, fonte `fontHeading`, cor `textSecondary`.
- Borders sutis entre rows (`borderPrimary`).
- Role badges: admins/super_admins recebem variant `outline` (destaque neon).
- Access map badges: features habilitadas têm border `borderAccent` e bg verde translúcido; desabilitadas ficam em `bgTertiary`.
- Botões de ação com variants `primary` (promover), `ghost` (rebaixar/remover).

## Dependencies
- Types: `User`, `MemberAccessMap` (`@shared/types/auth.types`), `UserRole`, `FeatureAccessKey` (`@shared/types/common.types`).
- Common components: `Badge`, `Button`, `Card`, `CardContent`, `CardTitle`.
- Design tokens: `colors`, `typography`.

## Future Enhancements
- Adicionar coluna "Status" (ativo/inativo/suspenso).
- Filtros inline por role/feature.
- Ações em lote (promover/rebaixar múltiplos).
- Histórico de alterações de role/acesso.
