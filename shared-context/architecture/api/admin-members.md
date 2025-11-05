Title: Admin — Members Listing

## GET /api/admin/members
- Auth: Bearer required
- RBAC: Admin, SuperAdmin
- Query:
  - `page?` number >= 1 (default 1)
  - `pageSize?` number 1..100 (default 20)
  - `role?` 'member' | 'mentor' | 'admin' | 'super_admin'
  - `search?` string (2..160)
- Sucesso 200: `ApiResponse<PaginatedResponse<AdminMemberItem>>`
- Meta: `requestId`, `pendingInvitations` (`Invitation[]` com status pendente)
- Erros: `400 VALIDATION_ERROR`
- Notas:
  - Cada item contém `user` + `accessMap` agregado.
  - `pendingInvitations` reflete convites em aberto via `AdminService.listInvitations({ status: 'pending' })` para facilitar UI.
  - Filtros adicionais (status) podem ser adicionados conforme necessidade.
