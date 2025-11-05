import { useQuery } from '@tanstack/react-query';

import type { HidraDashboardSummary } from '../../shared/types';
import { ApiClient } from '../../shared/utils/apiClient';
import { assertSuccess } from '../../shared/utils/errorHandler';
import { queryKeys } from '../lib/queryClient';
import { selectIsAuthenticated, useAuthStore } from '../store/auth';

const hidraApiClient = new ApiClient({
  getAccessToken: () => useAuthStore.getState().accessToken,
  onUnauthenticated: () => {
    void useAuthStore.getState().logout();
  },
});

export const fetchHidraDashboard = async (): Promise<HidraDashboardSummary> => {
  const response = await hidraApiClient.get<HidraDashboardSummary>('/hidra/dashboard');
  assertSuccess<HidraDashboardSummary>(response);
  return response.data;
};

export const useHidraDashboard = () => {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  return useQuery({
    queryKey: queryKeys.hidra.dashboard(),
    queryFn: fetchHidraDashboard,
    enabled: isAuthenticated,
    staleTime: 30 * 1000,
  });
};

export type UseHidraDashboardResult = ReturnType<typeof useHidraDashboard>;
