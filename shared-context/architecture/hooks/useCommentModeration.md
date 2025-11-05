# useCommentModeration

## Propósito
Gerenciar a fila de moderação de comentários/respostas da Academia no painel admin, permitindo aprovar ou rejeitar itens com feedback otimista.

## Parâmetros
- `status?: 'pending' | 'approved' | 'rejected'` — filtro de status (default `'pending'`).
- `page?: number` — página corrente (default `1`).
- `pageSize?: number` — tamanho da página (default `20`).
- `enabled?: boolean` — desabilita a query se necessário (default `true`).

## Retorno
- `items: CommentModerationItem[]`
- Flags: `hasItems`, `isLoading`, `isFetching`, `isModerating`, `error`
- Ações: `approve({ id, entityId, commentId, type })`, `approveAsync`, `reject({ ... })`, `rejectAsync`, `refetch`

## Endpoints Consumidos
- `GET /admin/academy/comments/moderation?status&{page,pageSize}`
- `PATCH /admin/academy/comments/:commentId/moderation`
- `PATCH /admin/academy/comments/:commentId/replies/:replyId/moderation`

## Dependências
- `ApiClient` autenticado via `useAuthStore`
- `queryKeys.admin.commentModeration({ status, page, pageSize })`
- `assertSuccess`, `mapApiError`

## Observações
- A query só é habilitada para `admin`, `super_admin` e `mentor` autenticados.
- Execução otimista remove o item da fila antes da resposta; em caso de erro o cache é restaurado.
- `approve/reject` atualizam o status no backend (`approved`/`rejected`) e forçam invalidation para garantir consistência.
- Os itens retornados incluem metadados de curso, aula e profundidade para que a UI exiba contexto da moderação.
