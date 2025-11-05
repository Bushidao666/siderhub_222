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

const defaultCarouselConfig: CarouselConfig = {
  enabled: false,
  autoRotate: false,
  rotationInterval: 5,
  showIndicators: true,
  showArrows: true,
  animation: 'slide',
};

export const AdminBanners = () => {
  const queryClient = useQueryClient();

  // Mock data - this would come from API
  const mockBanners: ExtendedHeroBanner[] = [
    // Empty initially to show the create form
  ];

  const bannersQuery = useQuery({
    queryKey: ['admin', 'banners'],
    queryFn: async () => {
      try {
        const response = await adminApiClient.get<HeroBanner[]>('/admin/banners');
        assertSuccess<HeroBanner[]>(response);
        return response.data.map((banner): ExtendedHeroBanner => ({
          ...banner,
          position: 'hero',
          size: 'large',
          autoRotate: false,
          rotationInterval: 5,
        }));
      } catch (error) {
        // If API fails, return mock data for demo
        return mockBanners;
      }
    },
  });

  const carouselConfigQuery = useQuery({
    queryKey: ['admin', 'carousel-config'],
    queryFn: async () => {
      try {
        const response = await adminApiClient.get<CarouselConfig>('/admin/carousel-config');
        assertSuccess<CarouselConfig>(response);
        return response.data;
      } catch (error) {
        // If API fails, return default config
        return defaultCarouselConfig;
      }
    },
  });

  const createBannerMutation = useMutation({
    mutationFn: async (banner: Partial<ExtendedHeroBanner>) => {
      const response = await adminApiClient.post<HeroBanner, Partial<HeroBanner>>('/admin/banners', banner);
      assertSuccess<HeroBanner>(response);
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'banners'] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.hub.dashboard() });
    },
  });

  const updateBannerMutation = useMutation({
    mutationFn: async ({ id, ...banner }: { id: string } & Partial<ExtendedHeroBanner>) => {
      const response = await adminApiClient.put<HeroBanner, Partial<HeroBanner>>(`/admin/banners/${id}`, banner);
      assertSuccess<HeroBanner>(response);
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'banners'] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.hub.dashboard() });
    },
  });

  const deleteBannerMutation = useMutation({
    mutationFn: async (id: string) => {
      await adminApiClient.delete(`/admin/banners/${id}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'banners'] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.hub.dashboard() });
    },
  });

  const reorderBannersMutation = useMutation({
    mutationFn: async (bannerIds: string[]) => {
      const response = await adminApiClient.post<void, { bannerIds: string[] }>('/admin/banners/reorder', { bannerIds });
      assertSuccess<void>(response);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'banners'] });
    },
  });

  const updateCarouselConfigMutation = useMutation({
    mutationFn: async (config: CarouselConfig) => {
      const response = await adminApiClient.put<CarouselConfig, CarouselConfig>('/admin/carousel-config', config);
      assertSuccess<CarouselConfig>(response);
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'carousel-config'] });
    },
  });

  const handleBannerCreate = useCallback(async (banner: Partial<ExtendedHeroBanner>) => {
    await createBannerMutation.mutateAsync(banner);
  }, [createBannerMutation]);

  const handleBannerUpdate = useCallback(async (id: string, banner: Partial<ExtendedHeroBanner>) => {
    await updateBannerMutation.mutateAsync({ id, ...banner });
  }, [updateBannerMutation]);

  const handleBannerDelete = useCallback(async (id: string) => {
    await deleteBannerMutation.mutateAsync(id);
  }, [deleteBannerMutation]);

  const handleBannerReorder = useCallback(async (bannerIds: string[]) => {
    await reorderBannersMutation.mutateAsync(bannerIds);
  }, [reorderBannersMutation]);

  const handleCarouselConfigUpdate = useCallback(async (config: CarouselConfig) => {
    await updateCarouselConfigMutation.mutateAsync(config);
  }, [updateCarouselConfigMutation]);

  const handleRetry = useCallback(() => {
    void bannersQuery.refetch();
    void carouselConfigQuery.refetch();
  }, [bannersQuery, carouselConfigQuery]);

  return (
    <section className="space-y-6" data-testid="admin-banners">
      <header className="space-y-1">
        <h1
          className="text-2xl uppercase tracking-[0.18em]"
          style={{ fontFamily: typography.fontHeading, color: colors.primary }}
        >
          Gestão Avançada de Banners
        </h1>
        <p className="text-sm" style={{ color: colors.textSecondary }}>
          Configure múltiplos banners, carousel e ordenação para o Hub.
        </p>
      </header>

      <AdvancedBannerManager
        banners={bannersQuery.data || []}
        carouselConfig={carouselConfigQuery.data || defaultCarouselConfig}
        loading={bannersQuery.isLoading || carouselConfigQuery.isLoading}
        error={bannersQuery.error ? mapApiError(bannersQuery.error) :
                carouselConfigQuery.error ? mapApiError(carouselConfigQuery.error) : null}
        onBannerCreate={handleBannerCreate}
        onBannerUpdate={handleBannerUpdate}
        onBannerDelete={handleBannerDelete}
        onBannerReorder={handleBannerReorder}
        onCarouselConfigUpdate={handleCarouselConfigUpdate}
        onRetry={handleRetry}
      />
    </section>
  );
};

export default AdminBanners;
