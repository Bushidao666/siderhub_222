import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';

import type { PaginatedResponse } from '../../shared/types/common.types';
import type { Resource, ResourceDownloadReceipt } from '../../shared/types/cybervault.types';
import { ApiClient } from '../../shared/utils/apiClient';
import { assertSuccess, mapApiError } from '../../shared/utils/errorHandler';
import { selectIsAuthenticated, useAuthStore } from '../store/auth';

interface UseResourceDownloadOptions {
  onSuccess?: (receipt: ResourceDownloadReceipt, resourceId: string) => void;
  onError?: (message: string) => void;
}

const cybervaultApiClient = new ApiClient({
  getAccessToken: () => useAuthStore.getState().accessToken,
  onUnauthenticated: () => {
    void useAuthStore.getState().logout();
  },
});

const requestDownload = async (resourceId: string): Promise<ResourceDownloadReceipt> => {
  const response = await cybervaultApiClient.post<ResourceDownloadReceipt>(
    `/cybervault/resources/${resourceId}/download`
  );
  assertSuccess<ResourceDownloadReceipt>(response);
  return response.data;
};

const baseQueryKey = ['cybervault', 'resources'] as const;

const updateCachedResources = (
  queryClient: QueryClient,
  resourceId: string,
  totalDownloads: number,
) => {
  const cachedQueries = queryClient.getQueriesData<PaginatedResponse<Resource>>({ queryKey: baseQueryKey });

  cachedQueries.forEach(([key, data]) => {
    if (!data) {
      return;
    }

    let updated = false;
    const items = data.items.map((item) => {
      if (item.id !== resourceId) {
        return item;
      }
      updated = true;
      return { ...item, downloadCount: totalDownloads };
    });

    if (updated) {
      queryClient.setQueryData(key, { ...data, items });
    }
  });
};

export const useResourceDownload = ({ onSuccess, onError }: UseResourceDownloadOptions = {}) => {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (resourceId: string) => {
      if (!resourceId) {
        return Promise.reject(new Error('resourceId é obrigatório'));
      }
      if (!isAuthenticated) {
        return Promise.reject(new Error('Usuário não autenticado'));
      }
      return requestDownload(resourceId);
    },
    onSuccess: (receipt, resourceId) => {
      onSuccess?.(receipt, resourceId);
      if (resourceId) {
        updateCachedResources(queryClient, resourceId, receipt.totalDownloads);

        queryClient
          .invalidateQueries({
            predicate: (query) =>
              Array.isArray(query.queryKey) &&
              query.queryKey[0] === baseQueryKey[0] &&
              query.queryKey[1] === baseQueryKey[1],
          })
          .catch(() => {
            // noop: invalidation best effort
          });
      }
    },
    onError: (error) => {
      const message = mapApiError(error);
      console.error('Falha ao registrar download do recurso', message);
      onError?.(message);
    },
  });

  return {
    triggerDownload: mutation.mutate,
    triggerDownloadAsync: mutation.mutateAsync,
    isDownloading: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
};
