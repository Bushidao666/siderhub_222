import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import type { PaginationParams, PaginatedResponse } from '../../shared/types/common.types';
import type { Resource, ResourceFilterParams } from '../../shared/types/cybervault.types';
import { ApiClient } from '../../shared/utils/apiClient';
import { assertSuccess } from '../../shared/utils/errorHandler';
import { queryKeys } from '../lib/queryClient';
import { selectIsAuthenticated, useAuthStore } from '../store/auth';

type UseResourceLibraryParams = {
  filters?: ResourceFilterParams;
  pagination?: PaginationParams;
  debounceMs?: number;
};

const cyberApiClient = new ApiClient({
  getAccessToken: () => useAuthStore.getState().accessToken,
  onUnauthenticated: () => {
    void useAuthStore.getState().logout();
  },
});

function serializeSignature(filters?: ResourceFilterParams, pagination?: PaginationParams) {
  const parts: string[] = [];

  if (filters) {
    const { query, categoryIds, tagIds, types, visibility } = filters;
    if (query) parts.push(`q=${encodeURIComponent(query)}`);
    if (visibility) parts.push(`vis=${visibility}`);
    if (categoryIds?.length) parts.push(`cats=${categoryIds.join(',')}`);
    if (tagIds?.length) parts.push(`tags=${tagIds.join(',')}`);
    if (types?.length) parts.push(`types=${types.join(',')}`);
  }
  if (pagination) {
    const { page, pageSize, sortBy, sortDirection } = pagination;
    if (page !== undefined) parts.push(`p=${page}`);
    if (pageSize !== undefined) parts.push(`ps=${pageSize}`);
    if (sortBy) parts.push(`sb=${encodeURIComponent(sortBy)}`);
    if (sortDirection) parts.push(`sd=${sortDirection}`);
  }
  return parts.join('&');
}

function toQueryString(filters?: ResourceFilterParams, pagination?: PaginationParams) {
  const params = new URLSearchParams();

  if (filters) {
    const { query, categoryIds, tagIds, types, visibility } = filters;
    if (query) params.set('query', query);
    if (visibility) params.set('visibility', visibility);
    categoryIds?.forEach((id) => params.append('categoryIds', id));
    tagIds?.forEach((id) => params.append('tagIds', id));
    types?.forEach((t) => params.append('types', t));
  }
  if (pagination) {
    const { page, pageSize, sortBy, sortDirection } = pagination;
    if (page !== undefined) params.set('page', String(page));
    if (pageSize !== undefined) params.set('pageSize', String(pageSize));
    if (sortBy) params.set('sortBy', sortBy);
    if (sortDirection) params.set('sortDirection', sortDirection);
  }

  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

const fetchResourceLibrary = async (
  filters?: ResourceFilterParams,
  pagination?: PaginationParams
): Promise<PaginatedResponse<Resource>> => {
  const qs = toQueryString(filters, pagination);
  const response = await cyberApiClient.get<PaginatedResponse<Resource>>(`/cybervault/resources${qs}`);
  assertSuccess<PaginatedResponse<Resource>>(response);
  return response.data;
};

export const useResourceLibrary = ({ filters, pagination, debounceMs = 300 }: UseResourceLibraryParams = {}) => {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  const signature = useMemo(() => serializeSignature(filters, pagination), [filters, pagination]);
  const debouncedSignature = useDebouncedValue(signature, debounceMs);

  const query = useQuery({
    queryKey: queryKeys.cybervault.resourcesList(debouncedSignature),
    queryFn: () => fetchResourceLibrary(filters, pagination),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
    retry: 1,
  });

  return query;
};

