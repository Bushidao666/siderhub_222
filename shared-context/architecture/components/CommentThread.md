# CommentThread (academy)

Props:
- `comments: CommentThreadComment[]` — lista normalizada com comentários (`LessonComment` + metadados de autor) e replies aninhadas.
- `maxDepth?: number` (default 3) — profundidade máxima renderizada para a thread.
- `allowReply?: boolean` (default `true`) — controla exibição do CTA "Responder".
- `allowModeration?: boolean` — habilita botões de `Aprovar`/`Rejeitar` para itens com `pendingModeration` em QUALQUER profundidade (root ou reply).
- `onReply?: ({ rootCommentId, parentId, body }) => Promise<void> | void` — callback disparado ao enviar uma reply (raiz ou aninhada).
- `onApprove?: ({ commentId, replyId }) => Promise<void> | void` — ação de aprovação para mentores/admin. Para replies, `replyId` é preenchido; para root, `replyId` é `undefined`.
- `onReject?: ({ commentId, replyId }) => Promise<void> | void` — ação de rejeição. Para replies, `replyId` é preenchido; para root, `replyId` é `undefined`.
- `emptyState?: string` — mensagem mostrada quando não existem comentários.
- `dataTestId?: string` — prefixo para `data-testid` (default `lesson-comment-thread`).
- `replying?: boolean` — indica se uma reply está sendo enviada (mostra spinner/desabilita ações).
- `replyError?: string | null` — mensagem de erro ao enviar reply.

Estados & Comportamentos:
- Usa `<CommentForm>` inline ao clicar em "Responder"; fecha automaticamente após `onReply` resolver.
- Renderiza `PendingBadge` para itens com `pendingModeration === true`.
- **IMPORTANTE**: Botões de moderação (Aprovar/Rejeitar) agora aparecem tanto em comentários raiz quanto em replies de qualquer profundidade, desde que `allowModeration=true`, `pendingModeration=true`, e callbacks `onApprove`/`onReject` estejam definidos.
- Ordena comentários por `createdAt` decrescente e preserva ordem dos replies conforme a árvore recebida.
- Suporta até 3 níveis (comentário → reply → sub-reply) aplicando padding/borda lateral neon.
- Desabilita ações quando callbacks não são fornecidos ou `replying=true`.

Dependências:
- `CommentForm`, `PendingBadge`, `Button` (common), design tokens (`colors`, `glows`, `typography`).
- Tipos `LessonComment`, `LessonCommentReply` (`@shared/types`).

Test IDs relevantes:
- Raiz: `lesson-comment-thread`
- Estado vazio: `lesson-comment-thread-empty`
- Item raiz: `lesson-comment-item`
- Reply: `lesson-comment-reply`
- Badge pending: `lesson-comment-pending`
- Botões: `lesson-comment-reply-btn-{id}`, `lesson-comment-approve-{id}`, `lesson-comment-reject-{id}`
- Form reply: `lesson-comment-reply-form-{id}`

Visual cues:
- Cartões com glow (`glows.sm`) + bordas neon.
- Replies deslocadas com `border-l` suave e gradiente dark, mantendo line-height confortável.

Moderation & Errors:
- Erro ao carregar comentários: `lesson-comments-error`
- Erro ao enviar reply: `lesson-comments-reply-error`
- Erro de moderação: `lesson-comments-moderation-error`
- Botões de ação (moderation): `lesson-comment-approve-{id}`, `lesson-comment-reject-{id}`
