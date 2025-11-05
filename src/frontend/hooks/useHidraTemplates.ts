import { useQuery } from '@tanstack/react-query';

import type { MessageTemplate } from '../../shared/types';
import { queryKeys } from '../lib/queryClient';
import { hidraService } from '../services/hidraService';
import { selectIsAuthenticated, useAuthStore } from '../store/auth';

const placeholderTemplates: MessageTemplate[] = [];

export const useHidraTemplates = () => {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  return useQuery({
    queryKey: queryKeys.hidra.templates(),
    queryFn: () => hidraService.fetchTemplates(),
    enabled: isAuthenticated,
    placeholderData: placeholderTemplates,
    staleTime: 60 * 1000,
  });
};

export type UseHidraTemplatesResult = ReturnType<typeof useHidraTemplates>;
