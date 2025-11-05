import { useQuery } from '@tanstack/react-query';

import type { AdminDashboardMetric, AdminDashboardPayload } from '../../shared/types';
import { ApiClient } from '../../shared/utils/apiClient';
import { assertSuccess } from '../../shared/utils/errorHandler';
import { queryKeys } from '../lib/queryClient';
import { selectIsAuthenticated, useAuthStore } from '../store/auth';

const adminApiClient = new ApiClient({
  getAccessToken: () => useAuthStore.getState().accessToken,
  onUnauthenticated: () => {
    void useAuthStore.getState().logout();
  },
});

const placeholderDashboard: AdminDashboardPayload = {
  metrics: [
    { id: 'banners-active', label: 'Banners ativos', value: 0, description: 'Total de destaque no hub' },
    { id: 'members-new', label: 'Novos membros', value: 0, description: 'Últimos 7 dias' },
    { id: 'hidra-campaigns', label: 'Campanhas Hidra', value: 0, description: 'Executadas este mês' },
  ],
  upcomingTasks: [
    'Conectar relatórios reais de HubService.',
    'Adicionar filtros de data para métricas.',
    'Exibir alertas de campanhas Hidra com falhas.',
  ],
  recentActivities: [
    'Logins de administradores serão listados aqui.',
    'Auditoria de convites e roles pendente.',
    'Estatísticas de downloads do Cybervault a caminho.',
  ],
  generatedAt: null,
};

const fetchAdminDashboard = async (): Promise<AdminDashboardPayload> => {
  const response = await adminApiClient.get<AdminDashboardPayload>('/admin/dashboard');
  assertSuccess<AdminDashboardPayload>(response);
  return response.data;
};

export const useAdminDashboard = () => {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  return useQuery({
    queryKey: queryKeys.admin.dashboard(),
    queryFn: fetchAdminDashboard,
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
    retry: 1,
    placeholderData: placeholderDashboard,
  });
};

export type UseAdminDashboardResult = ReturnType<typeof useAdminDashboard>;
