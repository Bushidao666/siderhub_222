import type { CSSProperties } from 'react';
import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { colors, typography } from '../../../shared/design/tokens';
import type { HeroBanner } from '../../../shared/types/admin.types';
import { ApiClient } from '../../../shared/utils/apiClient';
import { assertSuccess, mapApiError } from '../../../shared/utils/errorHandler';
import { AdvancedBannerManager, type ExtendedHeroBanner, type CarouselConfig } from '../../components/admin/AdvancedBannerManager';
import { queryKeys } from '../../lib/queryClient';
import { selectIsAuthenticated, useAuthStore } from '../../store/auth';

const adminApiClient = new ApiClient({
  getAccessToken: () => useAuthStore.getState().accessToken,
  onUnauthenticated: () => {
    void useAuthStore.getState().logout();
  },
});

export const AdminBanners = () => {
  const queryClient = useQueryClient();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const createBannerMutation = useMutation({
    mutationFn: async (values: BannerFormValues) => {
      setSuccessMessage(null);
      setFormError(null);
      const response = await adminApiClient.post<HeroBanner, BannerFormValues>('/admin/banners', values);
      assertSuccess<HeroBanner>(response);
      return response.data;
    },
    onSuccess: () => {
      setSuccessMessage('Banner salvo com sucesso.');
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.hub.dashboard() });
    },
    onError: (error) => {
      setFormError(mapApiError(error));
    },
  });

  return (
    <section className="space-y-6" data-testid="admin-banners">
      <header className="space-y-1">
        <h1
          className="text-2xl uppercase tracking-[0.18em]"
          style={{ fontFamily: typography.fontHeading, color: colors.primary }}
        >
          Gerenciar banners
        </h1>
        <p className="text-sm" style={{ color: colors.textSecondary }}>
          Configure chamadas neon para o Hub. Integração com HubService será conectada na próxima etapa.
        </p>
      </header>

      <div
        className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-6"
        style={{ '--border-color': colors.borderPrimary, '--bg-elevated': colors.bgSecondary } as CSSProperties}
      >
        <BannerForm
          initial={null}
          onSubmit={async (values) => {
            try {
              await createBannerMutation.mutateAsync(values);
            } catch (error) {
              // handled by onError
            }
          }}
          submitting={createBannerMutation.isPending}
          successMessage={successMessage}
          error={formError}
        />
      </div>
    </section>
  );
};

export default AdminBanners;
