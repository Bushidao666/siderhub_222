# useLessonRating

## Propósito
Gerenciar a avaliação de aulas (fetch + submit) com React Query, entregando resumo agregado (média, total de notas e nota do usuário) com atualização otimista.

## Retorno
- `summary: LessonRatingSummary | null`
- `averageRating: number`
- `totalRatings: number`
- `userRating: LessonRatingValue | null`
- `setRating(value: LessonRatingValue)` / `setRatingAsync`
- Flags: `isLoading`, `isFetching`, `isSubmitting`, `error`, `canRate`

## Endpoints Consumidos
- `GET /academy/lessons/:lessonId/rating`
- `POST /academy/lessons/:lessonId/rating`

## Dependências
- `ApiClient` autenticado via `useAuthStore`
- Query keys em `queryKeys.academy.lessonRating`
- `assertSuccess`, `mapApiError`
- Invalidação do `queryKeys.hub.dashboard` após submit para atualizar destaques/recomendações

## Observações
- Otimização local ajusta média/total enquanto a requisição finaliza; rollback automático em caso de erro.
- POST retorna `LessonRating` (entry individual); o hook invalida o summary para reidratar dados oficiais após sucesso.
- Query só habilita quando `lessonId` presente e usuário autenticado.
