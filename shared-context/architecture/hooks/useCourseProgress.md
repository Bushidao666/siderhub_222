# useCourseProgress

## Propósito
Gerencia leitura e atualização do progresso de um curso específico, expondo helpers para estados derivados e mutações via React Query.

## Retorno
- `progress: CourseProgress | null`
- `isCompleted: boolean`
- `isLoading`, `isFetching`, `error`, `refetch`
- `updateProgress(payload)` e `updateProgressAsync(payload)` (mutation `patch`)
- `isUpdating`: estado da mutation

## Endpoints Consumidos
- `GET /academy/courses/:courseId/progress`
- `PATCH /academy/courses/:courseId/progress` (payload `Pick<CourseProgress, 'completedLessonIds' | 'lastLessonId' | 'percentage'>`)

## Dependências
- `ApiClient` autenticado (`useAuthStore`)
- `assertSuccess` / `mapApiError`
- Tipos `CourseProgress` em `src/shared/types/academy.types.ts`
- Chaves `queryKeys.academy.progress`

## Observações
- Query desabilitada quando `courseId` não é definido ou usuário não autenticado.
- Mutation mantém o cache sincronizado via `queryClient.setQueryData`.
- `isCompleted` deriva diretamente de `progress.percentage === 100`.
