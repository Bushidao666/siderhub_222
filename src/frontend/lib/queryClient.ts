import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
  hydrate,
  type DefaultOptions,
  type DehydratedState,
} from '@tanstack/react-query';

type QueryKeyBuilder = (...args: Array<string | number | undefined>) => ReadonlyArray<string | number>;

const defaultOptions: DefaultOptions = {
  queries: {
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchOnMount: false,
  },
  mutations: {
    retry: 1,
  },
};

let singletonClient: QueryClient | null = null;

export const createQueryClient = () => new QueryClient({ defaultOptions });

export const getQueryClient = (): QueryClient => {
  if (!singletonClient) {
    singletonClient = createQueryClient();
  }
  return singletonClient;
};

export const queryClient = getQueryClient();

export type HydrationState = DehydratedState | undefined;

export const dehydrateQueryClient = (client: QueryClient) => dehydrate(client);

export const hydrateQueryClient = (client: QueryClient, state: HydrationState) => {
  if (!state) return;
  hydrate(client, state);
};

export { HydrationBoundary };

const buildKey = (...parts: Array<string | number | undefined>) =>
  parts.filter((part): part is string | number => part !== undefined);

export const queryKeys = {
  auth: {
    me: (): ReturnType<QueryKeyBuilder> => buildKey('auth', 'me'),
  },
  hub: {
    dashboard: (): ReturnType<QueryKeyBuilder> => buildKey('hub', 'dashboard'),
  },
  academy: {
    progress: (courseId: string): ReturnType<QueryKeyBuilder> => buildKey('academy', 'courses', courseId, 'progress'),
    lessonRating: (lessonId: string): ReturnType<QueryKeyBuilder> => buildKey('academy', 'lessons', lessonId, 'rating'),
    lessonProgress: (lessonId: string): ReturnType<QueryKeyBuilder> => buildKey('academy', 'lessons', lessonId, 'progress'),
    lessonComments: (lessonId: string): ReturnType<QueryKeyBuilder> => buildKey('academy', 'lessons', lessonId, 'comments'),
    courseTree: (courseId: string): ReturnType<QueryKeyBuilder> => buildKey('academy', 'courses', courseId, 'tree'),
  },
  hidra: {
    dashboard: (): ReturnType<QueryKeyBuilder> => buildKey('hidra', 'dashboard'),
    campaignStats: (): ReturnType<QueryKeyBuilder> => buildKey('hidra', 'campaigns', 'stats'),
    segments: (): ReturnType<QueryKeyBuilder> => buildKey('hidra', 'segments'),
    templates: (): ReturnType<QueryKeyBuilder> => buildKey('hidra', 'templates'),
  },
  admin: {
    dashboard: (): ReturnType<QueryKeyBuilder> => buildKey('admin', 'dashboard'),
    members: (
      filters?: { role?: string; page?: number; pageSize?: number; search?: string },
    ): ReturnType<QueryKeyBuilder> =>
      buildKey(
        'admin',
        'members',
        filters?.role ?? 'all',
        filters?.page ?? 1,
        filters?.pageSize ?? 20,
        filters?.search ?? '',
      ),
    banners: (): ReturnType<QueryKeyBuilder> => buildKey('admin', 'banners'),
    commentModeration: (
      filters?: { status?: string; page?: number; pageSize?: number },
    ): ReturnType<QueryKeyBuilder> =>
      buildKey(
        'admin',
        'comments',
        'moderation',
        filters?.status ?? 'pending',
        filters?.page ?? 1,
        filters?.pageSize ?? 20,
      ),
  },
  cybervault: {
    // Use a serialized signature string to keep query keys stable and simple
    resourcesList: (signature: string): ReturnType<QueryKeyBuilder> => buildKey('cybervault', 'resources', signature),
  },
};

export type QueryKeys = typeof queryKeys;
