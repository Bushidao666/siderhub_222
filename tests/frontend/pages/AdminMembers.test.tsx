import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AdminMembers } from 'src/frontend/pages/Admin/Members';
import { renderWithProviders, resetAuthStore, setAuthenticatedUser } from '../test-utils';
import type { UseAdminMembersResult } from 'src/frontend/hooks/useAdminMembers';
import { UserRole } from '@shared/types/common.types';
import { ApiError } from '@shared/utils/errorHandler';

const mockedUseAdminMembers = vi.fn<[], UseAdminMembersResult>();

vi.mock('src/frontend/hooks/useAdminMembers', () => ({
  useAdminMembers: () => mockedUseAdminMembers(),
}));

describe('AdminMembers page', () => {
  beforeEach(() => {
    resetAuthStore();
    setAuthenticatedUser({ user: { id: 'admin-1', email: 'admin@siderhub.ai', role: UserRole.Admin, profile: {
      displayName: 'Admin QA', avatarUrl: null, bio: null, timezone: 'UTC', badges: [], socialLinks: []
    }, lastLoginAt: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as any });
  });

  it('shows loading skeleton while fetching', () => {
    mockedUseAdminMembers.mockReturnValue({
      data: undefined,
      isLoading: true,
      isFetching: false,
      error: null as any,
    } as unknown as UseAdminMembersResult);

    renderWithProviders(<AdminMembers />);

    expect(screen.getByTestId('admin-members')).toBeInTheDocument();
    // Skeleton rows exist (no strict test ids on skeleton; assert absence of table headers instead)
    expect(screen.queryByRole('columnheader', { name: /usuário/i })).not.toBeInTheDocument();
  });

  it('renders members table with roles and actions', async () => {
    mockedUseAdminMembers.mockReturnValue({
      data: {
        items: [
          {
            id: 'member-1',
            email: 'member1@siderhub.ai',
            role: UserRole.Member,
            profile: { displayName: 'Member One', avatarUrl: null, bio: null, timezone: 'UTC', badges: [], socialLinks: [] },
            lastLoginAt: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'mentor-1',
            email: 'mentor1@siderhub.ai',
            role: UserRole.Mentor,
            profile: { displayName: 'Mentor One', avatarUrl: null, bio: null, timezone: 'UTC', badges: [], socialLinks: [] },
            lastLoginAt: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        page: 1,
        pageSize: 20,
        totalItems: 2,
        totalPages: 1,
      },
      isLoading: false,
      isFetching: false,
      error: null as any,
    } as unknown as UseAdminMembersResult);

    renderWithProviders(<AdminMembers />);

    // Header present
    expect(screen.getByRole('heading', { name: /gestão de membros/i })).toBeInTheDocument();

    // Rows render with display names/emails
    expect(await screen.findByText('Member One')).toBeInTheDocument();
    expect(screen.getByText('member1@siderhub.ai')).toBeInTheDocument();
    expect(screen.getByText('Mentor One')).toBeInTheDocument();

    // Actions according to role
    expect(screen.getByRole('button', { name: /promover a mentor/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /promover a admin/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /rebaixar a member/i })).toBeInTheDocument();
  });

  it('shows error message when the hook fails', async () => {
    mockedUseAdminMembers.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      error: new ApiError({ code: 'FORBIDDEN', message: 'Acesso negado: permissões insuficientes' }),
    } as unknown as UseAdminMembersResult);

    renderWithProviders(<AdminMembers />);

    // mapApiError retorna a message do ApiError diretamente
    expect(await screen.findByText(/acesso negado/i)).toBeInTheDocument();
    expect(screen.getByTestId('admin-members-error')).toBeInTheDocument();
  });
});

