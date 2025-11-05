import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import type { ApiResponse } from '@shared/types/api.types';
import type { AdminDashboardPayload } from 'src/frontend/hooks/useAdminDashboard';
import { UserRole } from '@shared/types/common.types';
import { AdminDashboard } from 'src/frontend/pages/Admin/Dashboard';
import { renderWithProviders, resetAuthStore, setAuthenticatedUser } from '../test-utils';
import { server, http, HttpResponse } from '../setup/msw-server';

const successResponse = <T,>(data: T): ApiResponse<T> => ({
  success: true,
  data,
  timestamp: new Date().toISOString(),
});

const DASHBOARD_PAYLOAD: AdminDashboardPayload = {
  metrics: [
    { id: 'banners', label: 'Banners ativos', value: 4, description: 'Destacados no hub' },
    { id: 'members', label: 'Novos membros', value: 12, description: 'Últimos 7 dias' },
    { id: 'hidra', label: 'Campanhas Hidra', value: 6, description: 'Executadas este mês' },
  ],
  upcomingTasks: ['Sincronizar métricas reais com HubService.'],
  recentActivities: ['Convite enviado para maria@sider.dev'],
  generatedAt: '2025-11-03T10:45:00Z',
};

describe('AdminDashboard page', () => {
  beforeEach(() => {
    resetAuthStore();
    setAuthenticatedUser({
      user: {
        id: 'admin-1',
        email: 'admin@sider.dev',
        role: UserRole.Admin,
        profile: {
          displayName: 'Admin',
          avatarUrl: null,
          bio: null,
          timezone: 'UTC',
          badges: [],
          socialLinks: [],
        },
        lastLoginAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
  });

  it('displays dashboard metrics and sections from API', async () => {
    server.use(http.get('/api/admin/dashboard', () => HttpResponse.json(successResponse(DASHBOARD_PAYLOAD))));

    renderWithProviders(<AdminDashboard />);

    expect(await screen.findByTestId('admin-dashboard')).toBeVisible();
    expect(await screen.findByText('Banners ativos')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(await screen.findByText(/Sincronizar métricas reais/)).toBeInTheDocument();
    expect(await screen.findByText(/Convite enviado para maria@sider\.dev/)).toBeInTheDocument();
  });

  it('shows error feedback when request fails', async () => {
    let called = false;
    server.use(
      http.get('/api/admin/dashboard', () => {
        called = true;
        return HttpResponse.json({
          success: false,
          error: { code: 'ADMIN_DASHBOARD_PENDING', message: 'Dashboard ainda não carregado' },
          timestamp: new Date().toISOString(),
        });
      }),
    );

    renderWithProviders(<AdminDashboard />);

    await waitFor(() => expect(called).toBe(true));
    await waitFor(() => expect(screen.getByText(/Dashboard ainda não carregado/)).toBeInTheDocument());
  });
});
