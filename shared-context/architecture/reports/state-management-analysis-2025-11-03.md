# State Management Analysis - SiderHub

**Gerado em:** 2025-11-03  
**Agente:** AGENTE 7 - STATE MANAGEMENT  
**Versão:** 1.0.0

---

## Executive Summary

O SiderHub implementa uma arquitetura de state management **híbrida e bem estruturada**, combinando:

- **Zustand** para estado de autenticação global com persistência
- **React Query (TanStack Query)** para server state e cache
- **React Hooks locais** (useState, useReducer) para UI state
- **Custom Hooks** como camada de abstração e reutilização

**Status Geral:** 🟢 Implementação sólida com padrões consistentes

**Pontos Fortes:**
- Separação clara entre server state e client state
- Otimistic updates bem implementados
- Cache inteligente com invalidação automática
- Hooks customizados com boa granularidade

**Áreas de Atenção:**
- Ausência de React Context (zero uso detectado)
- Potencial para adicionar React.memo em componentes pesados
- Configuração de cache poderia ser mais agressiva em alguns casos

---

## 1. Arquitetura de Estado

### 1.1 Visão Geral da Stack

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│  Components (useState, useCallback, useMemo)                 │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    CUSTOM HOOKS LAYER                        │
│  17 hooks especializados (useHubData, useLessonComments...) │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌──────────────────────┬──────────────────────────────────────┐
│  GLOBAL STATE        │      SERVER STATE & CACHE            │
│  (Zustand)           │      (React Query)                   │
│  - Auth Store        │  - Queries (83 arquivos)             │
│  - User Session      │  - Mutations (33 invalidações)       │
│  - Access Map        │  - Optimistic Updates                │
└──────────────────────┴──────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATA SOURCES                              │
│  API Client → Backend Services → Database                   │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Filosofia de Gestão de Estado

**Server State (React Query):**
- Dados que vêm do servidor
- Cache, sincronização, refetch automático
- Invalidação baseada em mutations

**Client State (Zustand):**
- Estado global da aplicação
- Persistência em localStorage
- Gerenciamento de sessão

**UI State (useState local):**
- Estado efêmero de componentes
- Não compartilhado entre componentes
- Limpo quando componente desmonta

---

## 2. Zustand - Global State

### 2.1 Configuração do Auth Store

**Arquivo:** `/src/frontend/store/auth.ts`

```typescript
// Estado gerenciado
interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  accessMap: MemberAccessMap[];
  activeSessions: SessionSummary[];
  isAuthenticated: boolean;
  isLoading: boolean;
  hydratedAt: string | null;
  lastError: string | null;
}

// Ações disponíveis
interface AuthActions {
  login: (credentials: LoginRequest) => Promise<void>;
  register: (input: RegisterRequest) => Promise<void>;
  logout: (request?: LogoutRequest) => Promise<void>;
  refreshTokens: () => Promise<void>;
  hydrateFromStorage: () => Promise<void>;
  setAccessMap: (accessMap: MemberAccessMap[]) => void;
  setActiveSessions: (sessions: SessionSummary[]) => void;
}
```

### 2.2 Recursos Implementados

✅ **Persistência em localStorage**
- Key: `siderhub-auth`
- Versionado (v1)
- Hydration manual com `skipHydration: true`

✅ **Serialização Parcial**
```typescript
partialize: (state) => ({
  user: state.user,
  accessToken: state.accessToken,
  refreshToken: state.refreshToken,
  accessMap: state.accessMap,
  activeSessions: state.activeSessions,
  hydratedAt: state.hydratedAt,
})
```

✅ **Error Handling**
- Campo `lastError` para UI feedback
- Callbacks `onUnauthenticated` para logout automático

✅ **Token Refresh**
- Endpoint dedicado `/auth/refresh`
- Atualização automática de tokens

### 2.3 Padrão de Uso

**Seletores Nomeados:**
```typescript
export const selectIsAuthenticated = (state: AuthStore) => state.isAuthenticated;
export const selectUser = (state: AuthStore) => state.user;
export const selectAccessMap = (state: AuthStore) => state.accessMap;
```

**Uso em Componentes:**
```typescript
const isAuthenticated = useAuthStore(selectIsAuthenticated);
const user = useAuthStore(selectUser);
```

**Vantagens:**
- Evita re-renders desnecessários
- Type-safe
- Facilita testing

---

## 3. React Query - Server State Management

### 3.1 Configuração Global

**Arquivo:** `/src/frontend/lib/queryClient.ts`

```typescript
const defaultOptions: DefaultOptions = {
  queries: {
    staleTime: 60 * 1000,           // 1 minuto
    gcTime: 5 * 60 * 1000,          // 5 minutos (garbage collection)
    retry: 2,
    refetchOnWindowFocus: false,     // ❗ Desabilitado
    refetchOnReconnect: true,
    refetchOnMount: false,           // ❗ Desabilitado
  },
  mutations: {
    retry: 1,
  },
};
```

**⚠️ Observações:**
- `refetchOnWindowFocus: false` pode causar dados desatualizados quando usuário volta à aba
- `refetchOnMount: false` economiza requisições mas pode mostrar dados stale
- Configuração conservadora, privilegia redução de chamadas à API

### 3.2 Query Keys Centralizados

Estrutura completa em `queryKeys`:

```typescript
export const queryKeys = {
  auth: {
    me: () => ['auth', 'me'],
  },
  hub: {
    dashboard: () => ['hub', 'dashboard'],
  },
  academy: {
    progress: (courseId) => ['academy', 'courses', courseId, 'progress'],
    lessonRating: (lessonId) => ['academy', 'lessons', lessonId, 'rating'],
    lessonProgress: (lessonId) => ['academy', 'lessons', lessonId, 'progress'],
    lessonComments: (lessonId) => ['academy', 'lessons', lessonId, 'comments'],
    courseTree: (courseId) => ['academy', 'courses', courseId, 'tree'],
  },
  hidra: {
    dashboard: () => ['hidra', 'dashboard'],
    campaignStats: () => ['hidra', 'campaigns', 'stats'],
    segments: () => ['hidra', 'segments'],
    templates: () => ['hidra', 'templates'],
  },
  admin: {
    dashboard: () => ['admin', 'dashboard'],
    members: (filters) => ['admin', 'members', ...filters],
    banners: () => ['admin', 'banners'],
    commentModeration: (filters) => ['admin', 'comments', 'moderation', ...filters],
  },
  cybervault: {
    resourcesList: (signature) => ['cybervault', 'resources', signature],
  },
};
```

**Análise:**
✅ Chaves fortemente tipadas
✅ Hierarquia clara (domínio → recurso → identificador)
✅ Facilita invalidação em cascata
✅ Suporte a filtros em queries paginadas

### 3.3 Hydration & SSR Support

```typescript
export const dehydrateQueryClient = (client: QueryClient) => dehydrate(client);

export const hydrateQueryClient = (client: QueryClient, state: HydrationState) => {
  if (!state) return;
  hydrate(client, state);
};
```

**Status:** Preparado para SSR mas não ativo (SPA puro no momento)

---

## 4. Custom Hooks - Abstração de Lógica

### 4.1 Inventário de Hooks

Total: **17 hooks customizados**

| Hook | Domínio | Responsabilidade |
|------|---------|------------------|
| `useAuthForm` | Auth | Forms de login/registro com validação |
| `useHubData` | Hub | Dashboard do hub central |
| `useCourseProgress` | Academy | Progresso de curso individual |
| `useCoursesProgressMap` | Academy | Progresso de múltiplos cursos |
| `useCourseTree` | Academy | Estrutura de módulos/aulas |
| `useLessonComments` | Academy | Comentários e replies threadadas |
| `useLessonRating` | Academy | Rating de aulas |
| `useLessonVideoTracking` | Academy | Tracking de posição de vídeo |
| `useHidraDashboard` | Hidra | Dashboard Hidra |
| `useCampaignStats` | Hidra | Estatísticas de campanhas |
| `useHidraSegments` | Hidra | Segmentos de contatos |
| `useHidraTemplates` | Hidra | Templates de mensagens |
| `useAdminDashboard` | Admin | Dashboard administrativo |
| `useAdminMembers` | Admin | Listagem de membros |
| `useCommentModeration` | Admin | Fila de moderação |
| `useResourceLibrary` | Cybervault | Biblioteca de recursos |
| `useResourceDownload` | Cybervault | Download tracking |

### 4.2 Padrões de Implementação

#### Pattern 1: Query Básica

```typescript
export const useHidraDashboard = () => {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  return useQuery({
    queryKey: queryKeys.hidra.dashboard(),
    queryFn: fetchHidraDashboard,
    enabled: isAuthenticated,
    staleTime: 30 * 1000,
  });
};
```

#### Pattern 2: Query + Mutation com Optimistic Updates

**Exemplo:** `useLessonComments` (356 linhas)

```typescript
const commentMutation = useMutation<LessonComment, Error, CommentInput, MutationContext>({
  mutationFn: async ({ body }) => {
    // POST request
  },
  onMutate: async ({ body }) => {
    await queryClient.cancelQueries({ queryKey });
    const previousComments = queryClient.getQueryData<LessonComment[]>(queryKey) ?? [];
    const optimisticComment = createOptimisticComment(lessonId, body, user?.id);
    queryClient.setQueryData(queryKey, [optimisticComment, ...previousComments]);
    return { previousComments, optimisticId: optimisticComment.id };
  },
  onError: (error, _variables, context) => {
    if (context?.previousComments) {
      queryClient.setQueryData(queryKey, context.previousComments);
    }
  },
  onSuccess: (comment, _variables, context) => {
    queryClient.setQueryData<LessonComment[]>(queryKey, (cached = []) => {
      return cached.map((item) => (item.id === context.optimisticId ? comment : item));
    });
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey });
  },
});
```

**Recursos:**
✅ Optimistic update instantâneo
✅ Rollback em caso de erro
✅ Replace de item otimista com resposta do servidor
✅ Invalidação final para garantir sincronização

#### Pattern 3: Complex State Management

**Exemplo:** `useLessonVideoTracking` (224 linhas)

Gerencia:
- Tracking de posição de vídeo
- Intervalo de emissão de ticks
- Visibilidade da página
- Threshold de conclusão
- Callbacks de eventos

```typescript
const useLessonVideoTracking = ({
  lessonId,
  courseId,
  durationMs,
  getPositionMs,
  isPlaying,
  tickIntervalMs = 10_000,
  completionThreshold = 0.9,
  enabled,
  onCompleted,
  onError,
}) => {
  // Estado local
  const [isVisible, setIsVisible] = useState(true);
  const lastTickAtRef = useRef<number>(0);
  const wasCompletedRef = useRef<boolean>(false);

  // Query para snapshot atual
  const progressQuery = useQuery({ ... });

  // Mutation para enviar ticks
  const mutation = useMutation({ ... });

  // Callback para emitir tick
  const emitTick = useCallback(...);

  // Effect para tracking automático
  useEffect(() => {
    if (!canTrack || !isPlaying || !isVisible) return;
    const intervalId = setInterval(() => emitTick(), tickIntervalMs);
    return () => clearInterval(intervalId);
  }, [canTrack, isPlaying, isVisible, tickIntervalMs]);

  return { progress, isTracking, sendTick, markCompleted, ... };
};
```

**Análise:**
✅ Refs para evitar re-renders em tracking
✅ Cleanup de intervals
✅ Respeita visibilidade da página
✅ API clara para componente

#### Pattern 4: Multi-Query Parallel

**Exemplo:** `useCoursesProgressMap`

```typescript
const queries = useQueries({
  queries: courseIds.map((courseId) => ({
    queryKey: queryKeys.academy.progress(courseId),
    queryFn: () => fetchCourseProgress(courseId),
    enabled: Boolean(isAuthenticated && courseId),
    staleTime: 2 * 60 * 1000,
  })),
});

const progressMap = courseIds.reduce((acc, courseId, index) => {
  if (queries[index]?.data) {
    acc[courseId] = queries[index].data;
  }
  return acc;
}, {});
```

**Vantagem:** Busca paralela com agregação automática

#### Pattern 5: Debounced Search

**Exemplo:** `useResourceLibrary`

```typescript
const useDebouncedValue = <T>(value: T, delayMs: number) => {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
};

export const useResourceLibrary = ({ filters, pagination, debounceMs = 300 }) => {
  const signature = useMemo(() => serializeSignature(filters, pagination), [filters, pagination]);
  const debouncedSignature = useDebouncedValue(signature, debounceMs);

  return useQuery({
    queryKey: queryKeys.cybervault.resourcesList(debouncedSignature),
    queryFn: () => fetchResourceLibrary(filters, pagination),
    // ...
  });
};
```

**Análise:**
✅ Evita requests excessivos durante digitação
✅ Signature serializada para stable query key
✅ Debounce customizável

### 4.3 ApiClient Pattern

Todos os hooks usam `ApiClient` instanciado com configuração de auth:

```typescript
const academyApiClient = new ApiClient({
  getAccessToken: () => useAuthStore.getState().accessToken,
  onUnauthenticated: () => {
    void useAuthStore.getState().logout();
  },
});
```

**Vantagens:**
✅ Token injetado automaticamente
✅ Logout automático em 401
✅ Type-safe com generics

---

## 5. Estado Local (UI State)

### 5.1 Padrões de useState

**Uso detectado:** 27 arquivos com useState

#### Pattern 1: Form State

```typescript
// Hidra Wizard - 273 linhas
const [currentStep, setCurrentStep] = useState<number>(0);
const [selectedSegment, setSelectedSegment] = useState<ContactSegment | null>(null);
const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
const [messagePreview, setMessagePreview] = useState('');
const [form, setForm] = useState<ScheduleFormState>(initialScheduleForm);
const [submissionError, setSubmissionError] = useState<string | null>(null);
const [successMessage, setSuccessMessage] = useState<string | null>(null);
```

**Análise:**
✅ Estado local granular
⚠️ 7 estados em um componente - poderia usar useReducer

#### Pattern 2: Modal State

```typescript
// Cybervault Library
const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
const [modalOpen, setModalOpen] = useState(false);
const [lastToastMessage, setLastToastMessage] = useState<string | null>(null);
```

#### Pattern 3: Player State

```typescript
// Lesson Detail
const [isPlaying, setIsPlaying] = useState(false);
const [trackingError, setTrackingError] = useState<string | null>(null);
const [commentSubmitError, setCommentSubmitError] = useState<string | null>(null);
const [replySubmitError, setReplySubmitError] = useState<string | null>(null);
const [moderationError, setModerationError] = useState<string | null>(null);
```

### 5.2 Uso de useRef

**Casos identificados:**

1. **Player References:**
```typescript
const playerRef = useRef<VideoJsPlayer | null>(null);
const cleanupRef = useRef<(() => void) | null>(null);
```

2. **Tracking sem Re-render:**
```typescript
const lastTickAtRef = useRef<number>(0);
const lastKnownPositionRef = useRef<number>(0);
const wasCompletedRef = useRef<boolean>(false);
```

✅ Uso correto para valores que não afetam render

### 5.3 Otimizações com useMemo/useCallback

**Ocorrências:** 81 usos detectados em 27 arquivos

**Padrão Comum:**
```typescript
const comments = useMemo(() => commentsQuery.data ?? [], [commentsQuery.data]);

const handleSubmit = useCallback(async (values) => {
  // lógica
}, [deps]);
```

**Análise:**
✅ Usado para computações pesadas
✅ Callbacks em props de componentes filhos
⚠️ Zero uso de `React.memo` detectado - oportunidade de otimização

---

## 6. Cache Strategy & Performance

### 6.1 Configurações de Stale Time

| Hook/Query | Stale Time | Justificativa |
|------------|-----------|---------------|
| `queryClient` default | 60s | Padrão conservador |
| `useCourseProgress` | 2min | Progresso muda com ações explícitas |
| `useLessonComments` | 30s | Dados sociais, atualização moderada |
| `useLessonVideoTracking` | 30s | Sincronização frequente |
| `useHidraDashboard` | 30s | Dashboard com métricas |
| `useAdminMembers` | 60s | Lista raramente muda |
| `useResourceLibrary` | 60s | Catálogo estável |

### 6.2 Invalidation Strategy

**Padrão identificado:** 33 ocorrências de `invalidateQueries`

**Exemplo de Cascade:**
```typescript
// Ao completar uma aula
onSuccess: (snapshot) => {
  queryClient.setQueryData(queryKeys.academy.lessonProgress(lessonId), snapshot);
  
  if (snapshot.completed && courseId) {
    // Invalida progresso do curso
    queryClient.invalidateQueries({ 
      queryKey: queryKeys.academy.progress(courseId) 
    });
  }
}
```

**Exemplo Multi-Invalidação:**
```typescript
// Ao criar campanha no wizard
onSuccess: (campaign) => {
  void Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.hidra.dashboard() }),
    queryClient.invalidateQueries({ queryKey: queryKeys.hidra.campaignStats() }),
  ]);
}
```

✅ Invalidações bem direcionadas
✅ Mantém UI sincronizada com servidor

### 6.3 Optimistic Updates

**Implementados em:**

1. **useLessonComments:**
   - Adiciona comentário otimista
   - Rollback em erro
   - Replace com resposta do servidor

2. **useLessonRating:**
   - Atualiza rating local
   - Recalcula médias
   - Sincroniza com backend

3. **useCommentModeration:**
   - Remove item da fila otimisticamente
   - Restaura em caso de erro

**Pattern Consistente:**
```typescript
onMutate: async (variables) => {
  await queryClient.cancelQueries({ queryKey });
  const previous = queryClient.getQueryData(queryKey);
  queryClient.setQueryData(queryKey, optimisticData);
  return { previous };
},
onError: (err, variables, context) => {
  queryClient.setQueryData(queryKey, context.previous);
},
```

---

## 7. Sincronização Cliente-Servidor

### 7.1 Estratégias de Sincronização

**Polling:** Não implementado (feature não necessária)

**WebSocket:** Não implementado (planejado para notificações futuras)

**Refetch Manual:**
```typescript
const { refetch } = useQuery(...);

<Button onClick={() => refetch()}>
  Atualizar
</Button>
```

**Refetch em Eventos:**
```typescript
// Ao voltar para tab
refetchOnWindowFocus: false  // Desabilitado globalmente

// Ao reconectar
refetchOnReconnect: true     // Habilitado globalmente
```

### 7.2 Error Handling

**Centralizado em `errorHandler.ts`:**
```typescript
export const mapApiError = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  // ... tratamento de casos especiais
  return 'Erro desconhecido';
};
```

**Uso nos Hooks:**
```typescript
onError: (error) => {
  const message = mapApiError(error);
  setLastError(message);
  console.error('Contexto específico', message);
}
```

**Exibição na UI:**
```typescript
{error ? (
  <div className="error-container">
    {mapApiError(error)}
    <Button onClick={refetch}>Tentar novamente</Button>
  </div>
) : null}
```

✅ Mensagens user-friendly
✅ Logs para debugging
✅ Retry fácil para usuário

---

## 8. Gaps & Problemas Identificados

### 8.1 Ausência de React Context

**Observação:** Zero ocorrências de `createContext` ou `useContext`

**Impacto:**
- Props drilling em alguns componentes
- Sem provider para temas/i18n/feature flags

**Recomendação:**
```typescript
// Criar contexto para design tokens
const ThemeContext = React.createContext(tokens);

// Evitar prop drilling de tokens em todos os componentes
```

### 8.2 Falta de React.memo

**Observação:** Zero componentes memoizados

**Impacto Potencial:**
- Re-renders desnecessários em listas grandes
- Performance em mobile

**Candidatos para Memoização:**
- `ResourceCard` (renderizado em grids de 20+)
- `CommentThread` items (recursivos)
- `CampaignTableRow`
- `MemberTableRow`

**Exemplo:**
```typescript
export const ResourceCard = React.memo(({ resource, onOpen, onDownload }) => {
  // ...
}, (prevProps, nextProps) => {
  return prevProps.resource.id === nextProps.resource.id &&
         prevProps.resource.downloadCount === nextProps.resource.downloadCount;
});
```

### 8.3 State Duplicado

**Exemplo:** `LessonDetail.tsx`

```typescript
const [commentSubmitError, setCommentSubmitError] = useState<string | null>(null);
const [replySubmitError, setReplySubmitError] = useState<string | null>(null);
const [moderationError, setModerationError] = useState<string | null>(null);
```

**Solução com useReducer:**
```typescript
type ErrorState = {
  comment: string | null;
  reply: string | null;
  moderation: string | null;
};

const [errors, dispatchError] = useReducer(errorReducer, {
  comment: null,
  reply: null,
  moderation: null,
});
```

### 8.4 Configuração de Cache Conservadora

**Problema:**
- `refetchOnWindowFocus: false` pode deixar dados stale
- `refetchOnMount: false` economiza requests mas pode confundir usuário

**Recomendação:**
```typescript
// Queries que devem sempre refetch ao focar
const { data } = useQuery({
  queryKey: queryKeys.hidra.dashboard(),
  queryFn: fetchDashboard,
  refetchOnWindowFocus: true,  // Override para dashboards
});
```

### 8.5 TODOs no Code

**Encontrados:**
- `/pages/Admin/Members.tsx:184` - Promoção de membros
- `/pages/Admin/Members.tsx:187` - Rebaixamento de membros
- `/pages/Admin/Members.tsx:190` - Remoção de membros

**Status:** Placeholders para features futuras

---

## 9. Recomendações de Otimização

### 9.1 Performance

#### High Priority

1. **Implementar React.memo em componentes de lista:**
```typescript
// ResourceCard.tsx
export const ResourceCard = React.memo(ResourceCardComponent);

// CommentThread.tsx - item individual
const CommentItem = React.memo(({ comment, onReply, allowModeration }) => {
  // ...
});
```

2. **Usar virtualization para listas longas:**
```bash
npm install react-window
```

```typescript
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={resources.length}
  itemSize={120}
>
  {({ index, style }) => (
    <div style={style}>
      <ResourceCard resource={resources[index]} />
    </div>
  )}
</FixedSizeList>
```

3. **Code splitting em rotas:**
```typescript
const HidraWizard = lazy(() => import('./pages/Hidra/Wizard'));
const AdminDashboard = lazy(() => import('./pages/Admin/Dashboard'));

<Suspense fallback={<LoadingSpinner />}>
  <Route path="/hidra/wizard" element={<HidraWizard />} />
</Suspense>
```

#### Medium Priority

4. **Substituir múltiplos useState por useReducer:**

**Antes:**
```typescript
const [currentStep, setCurrentStep] = useState(0);
const [selectedSegment, setSelectedSegment] = useState(null);
const [selectedTemplate, setSelectedTemplate] = useState(null);
const [form, setForm] = useState(initialForm);
const [error, setError] = useState(null);
const [success, setSuccess] = useState(null);
```

**Depois:**
```typescript
const [state, dispatch] = useReducer(wizardReducer, initialState);

// Actions
dispatch({ type: 'SET_STEP', payload: 1 });
dispatch({ type: 'SELECT_SEGMENT', payload: segment });
dispatch({ type: 'SUBMIT_SUCCESS', payload: campaign });
```

5. **Implementar Error Boundaries:**
```typescript
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    logErrorToService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

### 9.2 Developer Experience

6. **Adicionar DevTools:**
```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

<QueryClientProvider client={queryClient}>
  <App />
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

7. **Typed Query Keys com Type Guards:**
```typescript
type QueryKey = 
  | ['auth', 'me']
  | ['academy', 'courses', string, 'progress']
  | ['hidra', 'dashboard'];

const isAcademyKey = (key: QueryKey): key is ['academy', ...] => {
  return key[0] === 'academy';
};
```

8. **Logging centralizado:**
```typescript
const logger = {
  querySuccess: (key: QueryKey, data: unknown) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Query Success]', key, data);
    }
  },
  mutationError: (error: unknown, context: string) => {
    console.error('[Mutation Error]', context, error);
    // Send to Sentry/DataDog
  },
};
```

### 9.3 Cache Optimization

9. **Configurar staleTime por domínio:**
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: (query) => {
        const [domain] = query.queryKey;
        
        // Dashboard = refresh frequente
        if (domain === 'hidra' || domain === 'admin') {
          return 30 * 1000;
        }
        
        // Catálogos = cache agressivo
        if (domain === 'cybervault') {
          return 5 * 60 * 1000;
        }
        
        return 60 * 1000;
      },
    },
  },
});
```

10. **Implementar prefetch estratégico:**
```typescript
// Ao entrar na lista de cursos
const { data: courses } = useQuery({
  queryKey: queryKeys.academy.courses(),
  queryFn: fetchCourses,
  onSuccess: (courses) => {
    // Prefetch primeiros 3 cursos
    courses.slice(0, 3).forEach(course => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.academy.progress(course.id),
        queryFn: () => fetchCourseProgress(course.id),
      });
    });
  },
});
```

11. **Persistent Query Client para PWA:**
```typescript
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

const persister = createSyncStoragePersister({
  storage: window.localStorage,
});

persistQueryClient({
  queryClient,
  persister,
  maxAge: 1000 * 60 * 60 * 24, // 24 horas
});
```

---

## 10. State Flow Examples

### 10.1 Fluxo de Comentário com Optimistic Update

```
┌──────────────────────────────────────────────────────────────────┐
│ 1. USER ACTION                                                    │
│    User clica "Publicar" no formulário de comentário            │
└──────────────────────────────────────────────────────────────────┘
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│ 2. OPTIMISTIC UPDATE (onMutate)                                  │
│    - Cancel queries em andamento                                 │
│    - Salva estado anterior em context                            │
│    - Cria comentário otimista com ID temporário                  │
│    - Insere no início da lista local                             │
│    - UI atualiza IMEDIATAMENTE (sem spinner)                     │
└──────────────────────────────────────────────────────────────────┘
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│ 3. SERVER REQUEST (mutationFn)                                   │
│    POST /academy/lessons/:id/comments                            │
│    - Envia body do comentário                                    │
│    - Backend cria registro no Prisma                             │
│    - Retorna comentário com ID real                              │
└──────────────────────────────────────────────────────────────────┘
                    ▼                    ▼
        ┌───────────────────┐   ┌─────────────────────┐
        │ 4a. SUCCESS       │   │ 4b. ERROR           │
        │ (onSuccess)       │   │ (onError)           │
        └───────────────────┘   └─────────────────────┘
                    ▼                    ▼
    ┌─────────────────────────┐   ┌──────────────────────────┐
    │ - Replace comentário    │   │ - Rollback lista para    │
    │   otimista pelo real    │   │   estado anterior        │
    │ - ID temporário → real  │   │ - Mostra erro na UI      │
    │ - Mantém posição        │   │ - Log error console      │
    └─────────────────────────┘   └──────────────────────────┘
                    ▼                    ▼
┌──────────────────────────────────────────────────────────────────┐
│ 5. SETTLED (onSettled)                                           │
│    - Invalidate query de comentários                             │
│    - Refetch em background para garantir sincronização           │
│    - Qualquer discrepância é corrigida                           │
└──────────────────────────────────────────────────────────────────┘
```

### 10.2 Fluxo de Login com Zustand

```
┌──────────────────────────────────────────────────────────────────┐
│ 1. COMPONENT MOUNT                                                │
│    useEffect(() => { hydrate() }, [])                            │
└──────────────────────────────────────────────────────────────────┘
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│ 2. HYDRATION                                                      │
│    - Lê localStorage['siderhub-auth']                            │
│    - Parse JSON com tipo AuthState                               │
│    - Seta store com dados persistidos                            │
│    - isAuthenticated = true se user + token válidos              │
└──────────────────────────────────────────────────────────────────┘
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│ 3. USER SUBMITS LOGIN                                            │
│    const login = useAuthStore(state => state.login)              │
│    await login({ email, password })                              │
└──────────────────────────────────────────────────────────────────┘
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│ 4. API CALL                                                       │
│    POST /auth/login                                              │
│    - Backend valida credenciais                                  │
│    - Cria JWT tokens                                             │
│    - Retorna user + accessToken + refreshToken + accessMap       │
└──────────────────────────────────────────────────────────────────┘
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│ 5. UPDATE ZUSTAND STORE                                          │
│    set({                                                         │
│      user,                                                       │
│      accessToken,                                                │
│      refreshToken,                                               │
│      accessMap,                                                  │
│      isAuthenticated: true,                                      │
│      hydratedAt: new Date().toISOString()                        │
│    })                                                            │
└──────────────────────────────────────────────────────────────────┘
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│ 6. PERSISTENCE MIDDLEWARE                                         │
│    localStorage.setItem('siderhub-auth', JSON.stringify({        │
│      state: { user, accessToken, refreshToken, ... }             │
│    }))                                                           │
└──────────────────────────────────────────────────────────────────┘
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│ 7. UI RE-RENDER                                                   │
│    - isAuthenticated selector retorna true                       │
│    - ProtectedRoute permite acesso                               │
│    - Redirect para "/"                                           │
│    - Queries habilitadas começam a buscar dados                  │
└──────────────────────────────────────────────────────────────────┘
```

### 10.3 Fluxo de Video Tracking

```
┌──────────────────────────────────────────────────────────────────┐
│ COMPONENT MOUNT: LessonDetail                                     │
└──────────────────────────────────────────────────────────────────┘
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│ useLessonVideoTracking({                                         │
│   lessonId,                                                      │
│   courseId,                                                      │
│   durationMs: 600_000, // 10min                                  │
│   getPositionMs: () => player.currentTime() * 1000,              │
│   isPlaying: true,                                               │
│   tickIntervalMs: 10_000 // 10s                                  │
│ })                                                               │
└──────────────────────────────────────────────────────────────────┘
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│ INITIAL QUERY: Fetch last progress snapshot                      │
│   GET /academy/lessons/:id/progress                              │
│   → { lastPositionMs: 120_000, completed: false }                │
└──────────────────────────────────────────────────────────────────┘
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│ RESUME VIDEO                                                      │
│   player.currentTime(snapshot.lastPositionMs / 1000) // 120s     │
└──────────────────────────────────────────────────────────────────┘
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│ INTERVAL LOOP (every 10s while playing)                          │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ Tick 1: 130s → POST progress-tick                        │   │
│   │ Tick 2: 140s → POST progress-tick                        │   │
│   │ Tick 3: 150s → POST progress-tick                        │   │
│   │ ...                                                      │   │
│   │ Tick 48: 600s (100%) → POST progress-tick + completed   │   │
│   └─────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│ MUTATION: recordLessonProgressTick                               │
│   POST /academy/lessons/:id/progress-tick                        │
│   {                                                              │
│     positionMs: 150_000,                                         │
│     durationMs: 600_000,                                         │
│     completed: false,                                            │
│     emittedAt: "2025-11-03T..."                                  │
│   }                                                              │
└──────────────────────────────────────────────────────────────────┘
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│ ON SUCCESS                                                        │
│   - Update local query data                                      │
│   - If completed → invalidate course progress                    │
│   - Trigger onCompleted callback                                 │
└──────────────────────────────────────────────────────────────────┘
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│ USER LEAVES TAB                                                   │
│   - Visibility API detecta blur                                  │
│   - Interval é pausado                                           │
│   - Último tick não é perdido (lastTickRef persiste)             │
└──────────────────────────────────────────────────────────────────┘
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│ USER RETURNS                                                      │
│   - Visibility API detecta focus                                 │
│   - Force emit tick imediatamente                                │
│   - Resume interval loop                                         │
└──────────────────────────────────────────────────────────────────┘
```

---

## 11. Testing Coverage

### 11.1 Hooks Testing

**Arquivos de teste encontrados:**
- `tests/frontend/hooks/useAuthStore.test.ts`
- `tests/frontend/hooks/useCourseProgress.test.tsx`
- `tests/frontend/hooks/useLessonVideoTracking.test.tsx`
- `tests/frontend/hooks/useLessonRating.test.tsx`
- `tests/frontend/hooks/useCourseTree.test.tsx`
- `tests/frontend/hooks/useCampaignStats.test.tsx`
- `tests/frontend/hooks/useResourceDownload.test.tsx`
- `tests/frontend/hooks/useLessonComments.test.tsx`
- `tests/frontend/hooks/useCommentModeration.test.tsx`
- `tests/frontend/hooks/useHubData.test.tsx`

**Cobertura:** Hooks principais testados ✅

### 11.2 Padrão de Teste Comum

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

it('fetches data successfully', async () => {
  const { result } = renderHook(() => useHubData(), {
    wrapper: createWrapper(),
  });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data).toBeDefined();
});
```

**Gaps:**
- Testes de optimistic updates
- Testes de error recovery
- Testes de cache invalidation

---

## 12. Comparação com Alternativas

### 12.1 Current Stack vs. Alternatives

| Feature | Zustand + React Query | Redux Toolkit + RTK Query | MobX + React Query | Recoil + React Query |
|---------|----------------------|--------------------------|-------------------|---------------------|
| **Bundle Size** | 🟢 ~3KB + 15KB | 🟡 ~45KB + 15KB | 🟡 ~30KB + 15KB | 🟡 ~20KB + 15KB |
| **Learning Curve** | 🟢 Baixa | 🟡 Média | 🟡 Média | 🟡 Média |
| **TypeScript** | 🟢 Nativo | 🟢 Nativo | 🟡 Decorators | 🟢 Nativo |
| **DevTools** | 🟢 Sim | 🟢 Sim | 🟢 Sim | 🟡 Limitado |
| **Persistence** | 🟢 Middleware | 🟢 Middleware | 🟢 Plugin | 🟡 Manual |
| **Server State** | 🟢 React Query | 🟢 RTK Query | 🟢 React Query | 🟢 React Query |
| **Boilerplate** | 🟢 Mínimo | 🔴 Alto | 🟡 Médio | 🟡 Médio |

**Veredito:** Stack atual é ideal para o projeto ✅

### 12.2 Quando Considerar Migração

Considerar Redux se:
- Necessitar de time-travel debugging complexo
- Tiver lógica de negócio muito complexa com múltiplas sources
- Precisar de strict unidirectional data flow

Considerar MobX se:
- Preferir programação reativa/observável
- Tiver muitos computed values derivados

**Status:** Não recomendado migração no momento

---

## 13. Conclusão

### 13.1 Pontos Fortes Identificados

1. ✅ **Arquitetura bem definida** - Separação clara entre server e client state
2. ✅ **Hooks customizados** - Abstração eficaz, fácil de testar
3. ✅ **Optimistic updates** - UX fluida em comentários e ratings
4. ✅ **Query keys centralizados** - Manutenção simplificada
5. ✅ **Error handling consistente** - User-friendly messages
6. ✅ **Type safety** - TypeScript em 100% do código
7. ✅ **Tracking complexo** - Video tracking robusto e eficiente
8. ✅ **Persistência** - Auth state sobrevive reloads

### 13.2 Áreas de Melhoria

1. ⚠️ **Performance** - Adicionar React.memo e virtualization
2. ⚠️ **Cache strategy** - Revisar staleTime para dashboards
3. ⚠️ **Context API** - Implementar para design tokens e i18n
4. ⚠️ **useReducer** - Refatorar componentes com >5 estados
5. ⚠️ **DevTools** - Ativar React Query DevTools em dev
6. ⚠️ **Prefetch** - Adicionar prefetch estratégico
7. ⚠️ **Code splitting** - Lazy load de rotas pesadas

### 13.3 Roadmap de Otimização

#### Sprint 1 (Quick Wins)
- [ ] Ativar React Query DevTools
- [ ] Adicionar React.memo em ResourceCard, CommentItem
- [ ] Implementar ThemeContext para tokens
- [ ] Ajustar staleTime de dashboards para 30s

#### Sprint 2 (Medium Effort)
- [ ] Refatorar HidraWizard com useReducer
- [ ] Implementar virtualization em ResourceLibrary
- [ ] Adicionar code splitting nas rotas Admin e Hidra
- [ ] Criar Error Boundaries em layouts

#### Sprint 3 (Long Term)
- [ ] Implementar persistent query client
- [ ] Adicionar prefetch estratégico
- [ ] Otimizar bundle com tree-shaking
- [ ] Adicionar performance monitoring (Lighthouse CI)

### 13.4 Score Final

**State Management Quality Score:** 8.5/10

**Breakdown:**
- Architecture: 9/10
- Implementation: 9/10
- Performance: 7/10
- Developer Experience: 9/10
- Testing: 8/10
- Documentation: 7/10

**Conclusão:** Sistema de gerenciamento de estado maduro e production-ready, com oportunidades claras de otimização em performance e DX.

---

## Apêndices

### A. Glossário

- **Stale Time:** Tempo que uma query permanece "fresca" antes de precisar refetch
- **GC Time:** Tempo antes do cache ser garbage collected
- **Optimistic Update:** Atualizar UI antes da confirmação do servidor
- **Invalidation:** Marcar cache como desatualizado, forçando refetch
- **Hydration:** Restaurar estado do servidor no cliente (SSR) ou localStorage

### B. Referências

- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
- [React Query (TanStack Query) v5](https://tanstack.com/query/latest)
- [React Performance Optimization](https://react.dev/learn/render-and-commit)
- [When to useMemo and useCallback](https://kentcdodds.com/blog/usememo-and-usecallback)

### C. Ferramentas de Análise

- **Bundle Analyzer:** webpack-bundle-analyzer
- **Performance:** Chrome DevTools → Performance tab
- **Memory Leaks:** Chrome DevTools → Memory tab
- **React Profiler:** React DevTools → Profiler
- **Network:** Chrome DevTools → Network tab

---

**Fim do Relatório**
