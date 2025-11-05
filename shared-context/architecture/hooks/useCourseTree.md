# useCourseTree

## Propósito
Recuperar a árvore de módulos/aulas acessíveis de um curso (já filtrada pelas regras de disponibilidade) com carregamento lazy e prefetch opcional.

## Parâmetros
- `courseId: string | null` — identificador do curso.
- `enabled?: boolean` — quando `true` dispara o fetch imediatamente (default `false`).
- `staleTimeMs?: number` — ajusta janela de reuso do cache (default `5min`).

## Retorno
- `courseTree: CourseTree | null`
- `modules: CourseModule[]`
- Flags: `isLoading`, `isFetching`, `hasContent`, `error`
- Ações: `load()`, `prefetch()`, `refetch()`

## Endpoints Consumidos
- `GET /academy/courses/:courseId/tree`

## Dependências
- `ApiClient` autenticado via `useAuthStore`
- Query key `queryKeys.academy.courseTree(courseId)`
- `assertSuccess`, `mapApiError`

## Observações
- O backend já remove aulas bloqueadas por drip/role; o hook apenas consome o payload final.
- `prefetch` grava o tree no cache sem alterar o estado atual — útil para antecipar navegação (hover em cards do Hub, por exemplo).
- `load` lança erro caso `courseId` esteja ausente, facilitando uso com boundary.
- Combine com `useCourseProgress`/`useLessonComments` dentro de `CourseDetail` para construir a página completa.
