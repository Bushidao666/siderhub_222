import { useQuery } from '@tanstack/react-query';

import type { ContactSegment } from '../../shared/types';
import { queryKeys } from '../lib/queryClient';
import { hidraService } from '../services/hidraService';
import { selectIsAuthenticated, useAuthStore } from '../store/auth';

const placeholderSegments: ContactSegment[] = [];

export const useHidraSegments = () => {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  return useQuery({
    queryKey: queryKeys.hidra.segments(),
    queryFn: () => hidraService.fetchSegments(),
    enabled: isAuthenticated,
    placeholderData: placeholderSegments,
    staleTime: 60 * 1000,
  });
};

export type UseHidraSegmentsResult = ReturnType<typeof useHidraSegments>;
