import { useQuery } from '@tanstack/react-query';

import type { MemberAccessMap, PaginatedResponse, User } from '../../shared/types';
import { FeatureAccessKey, UserRole } from '../../shared/types';
import { ApiClient } from '../../shared/utils/apiClient';
import { assertSuccess } from '../../shared/utils/errorHandler';
import { queryKeys } from '../lib/queryClient';
import { selectIsAuthenticated, useAuthStore } from '../store/auth';

export type AdminMember = User & { accessMap?: MemberAccessMap[] };

type AdminMemberItemApi = { user: User; accessMap: MemberAccessMap[] };

export type AdminMembersFilters = {
  page?: number;
  pageSize?: number;
  role?: UserRole;
  search?: string;
};

export type AdminMembersPage = PaginatedResponse<AdminMember>;

const adminApiClient = new ApiClient({
  getAccessToken: () => useAuthStore.getState().accessToken,
  onUnauthenticated: () => {
    void useAuthStore.getState().logout();
  },
});

const placeholderMembers: AdminMember[] = [
  {
    id: 'placeholder-1',
    email: 'mentor@blacksider.com',
    role: UserRole.Mentor,
    profile: {
      displayName: 'Mentora Neon',
      avatarUrl: null,
      bio: 'Especialista em lançamentos',
      timezone: 'America/Sao_Paulo',
      badges: ['mentor'],
      socialLinks: [],
    },
    lastLoginAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    accessMap: [
      { feature: FeatureAccessKey.Academy, enabled: true, permissions: ['view'] },
      { feature: FeatureAccessKey.Hidra, enabled: false, permissions: [] },
    ],
  },
];

const toQuery = (filters: AdminMembersFilters): string => {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.pageSize) params.set('pageSize', String(filters.pageSize));
  if (filters.role) params.set('role', filters.role);
  if (filters.search) params.set('search', filters.search);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
};

const flattenPage = (page: PaginatedResponse<AdminMemberItemApi>): AdminMembersPage => ({
  items: page.items.map((it) => ({ ...it.user, accessMap: it.accessMap })),
  page: page.page,
  pageSize: page.pageSize,
  totalItems: page.totalItems,
  totalPages: page.totalPages,
});

const fetchAdminMembers = async (filters: AdminMembersFilters): Promise<AdminMembersPage> => {
  const response = await adminApiClient.get<PaginatedResponse<AdminMemberItemApi>>(
    `/admin/members${toQuery(filters)}`,
  );
  assertSuccess<PaginatedResponse<AdminMemberItemApi>>(response);
  return flattenPage(response.data);
};

export const useAdminMembers = (filters: AdminMembersFilters = {}) => {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  const placeholderPage: AdminMembersPage = {
    items: placeholderMembers,
    page: filters.page ?? 1,
    pageSize: filters.pageSize ?? placeholderMembers.length,
    totalItems: placeholderMembers.length,
    totalPages: 1,
  };

  return useQuery({
    queryKey: queryKeys.admin.members({
      role: filters.role,
      page: filters.page,
      pageSize: filters.pageSize,
      search: filters.search,
    }),
    queryFn: () => fetchAdminMembers(filters),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
    retry: 1,
    placeholderData: placeholderPage,
  });
};

export type UseAdminMembersResult = ReturnType<typeof useAdminMembers>;
