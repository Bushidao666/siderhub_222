# useAdminMembers

- Path: `src/frontend/hooks/useAdminMembers.ts:1`
- Query key: `queryKeys.admin.members({ role?, page?, pageSize?, search? })`
- Depends on: `src/shared/utils/apiClient.ts:1`, `src/shared/types/api.types.ts:1`, `src/shared/types/auth.types.ts:1`, `src/shared/types/common.types.ts:1`
- Consumed by: `src/frontend/pages/Admin/Members.tsx:1`, `src/frontend/components/admin/MemberTable.tsx:1`

## Purpose
Fetch and expose a paginated list of admin-visible members with their access map, supporting filters (role/search) and pagination. Adapts API shape (nested `user` + `accessMap`) to UI shape (flattened `User & { accessMap?: MemberAccessMap[] }`).

## API Contract
- Endpoint: `GET /api/admin/members`
- Auth: Bearer; RBAC: `admin|super_admin`
- Query: `page?`, `pageSize?`, `role?`, `search?`
- Response: `ApiResponse<PaginatedResponse<{ user: User; accessMap: MemberAccessMap[] }>>`

See: `.agents/shared-context/architecture/api/admin-members.md:1`.

## Hook Signature
```ts
export type AdminMembersFilters = {
  page?: number;
  pageSize?: number;
  role?: UserRole;
  search?: string;
};

export type AdminMember = User & { accessMap?: MemberAccessMap[] };
export type AdminMembersPage = PaginatedResponse<AdminMember>;

export const useAdminMembers: (
  filters?: AdminMembersFilters,
) => UseQueryResult<AdminMembersPage, ApiError>;
```

## Behavior
- Builds query key with filters to keep caches distinct.
- Uses `placeholderData` with a minimal member to keep UI responsive until API is live.
- Flattens items: `{ user, accessMap } -> { ...user, accessMap }`.
- Enabled only when authenticated (auth store selector).

## Related UI
- `AdminMembers` page adapts to `data.items` and forwards flattened members to `MemberTable` (loading, error states handled).

## Testing Notes
- MSW handler can return `PaginatedResponse<{ user, accessMap }>` and the hook will flatten.
- With no handler, placeholder avoids crashes; MSW `onUnhandledRequest=warn` will log missing route (to be removed once backend is ready).

## Follow-ups
- Wire promote/demote/remove actions once AdminService routes exist.
- Add Vitest coverage mirroring pagination/filter scenarios when backend contracts are finalized.
