# useLessonComments

## Propósito
Carregar a thread completa de comentários de uma aula (incluindo replies até 3 níveis) e expor mutações para criar comentários ou respostas com suporte a moderação pendente.

## Parâmetros
- `lessonId: string | null` — identifica a aula. Quando `null`, a query fica desabilitada.
- `enabled?: boolean` — permite adiar o carregamento da thread (default `true`).

## Retorno
- `comments: LessonComment[]` — normalizados com `pendingModeration`, `moderationStatus`, `moderatedById`, `replies` recursivos.
- Flags: `hasComments`, `isLoading`, `isFetching`, `isSubmitting`, `isReplying`, `error`.
- Ações: `addComment({ body })`, `addCommentAsync`, `addReply({ commentId, body, parentReplyId? })`, `addReplyAsync`, `refetch`.

## Endpoints Consumidos
- `GET /academy/lessons/:lessonId/comments`
- `POST /academy/lessons/:lessonId/comments`
- `POST /academy/lessons/:lessonId/comments/:commentId/replies`

## Dependências
- `ApiClient` autenticado via `useAuthStore`
- `queryKeys.academy.lessonComments(lessonId)`
- `assertSuccess`, `mapApiError`

## Observações
- Normaliza dados vindos do backend garantindo que replies sempre contenham arrays, status de moderação e timestamps.
- Submissão otimista cria placeholders (`pendingModeration: true`, `moderationStatus: 'pending'`) substituídos assim que o backend responde.
- `addReply` aceita `parentReplyId` opcional para inserir respostas em qualquer profundidade (até 3 níveis definidos pelo contrato backend).
- Após cada mutação, a query é invalidada para alinhar com o resultado definitivo do serviço de moderação.
