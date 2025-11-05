# LessonPlayer (academy)

Props:
- `lesson: Lesson`
- `moduleTitle: string`
- `comments?: LessonComment[]`
- `onToggleCompleted?: (lessonId: string) => void`
- `isCompleted?: boolean`
- `isLoading?: boolean`
- `onDownloadAsset?: (asset: LessonDownloadable) => void`
- `onJoinLive?: (url: string) => void`
- `resumeSeconds?: number`
- `onVideoReady?: (player: videojs.Player) => void`
- `onProgressTick?: ({ lessonId, positionSeconds, durationSeconds, percentage }) => void`
- `onReachCompletionThreshold?: (payload) => void` (dispatched ao atingir 90%)
- `ratingAverage?: number | null`
- `ratingCount?: number`
- `userRating?: LessonRatingValue | null`
- `onSubmitRating?: (value: LessonRatingValue) => Promise<void> | void`
- `ratingSubmitting?: boolean`
- `ratingError?: string | null`
- `commentsLoading?: boolean`
- `commentsError?: string | null`
- `onRetryComments?: () => void`
- `onSubmitComment?: (body: string) => Promise<void> | void`
- `commentSubmitting?: boolean`
- `commentSubmitError?: string | null`
- `commentFormLabel?: string`
- `commentPlaceholder?: string`
- `canComment?: boolean`
- `canReply?: boolean`
- `maxReplyDepth?: number`
- `onReplyToComment?: ({ rootCommentId, parentId, body }) => Promise<void> | void`
- `allowModeration?: boolean`
- `onApproveComment?: ({ commentId, replyId }) => Promise<void> | void`
- `onRejectComment?: ({ commentId, replyId }) => Promise<void> | void`
- `commentEmptyState?: string`

States & Comportamentos:
- Skeleton enquanto `isLoading`
- Player de vídeo usa Video.js 8 (hotkeys + quality selector)
- Ticks de progresso a cada 10s + callback ao atingir 90%
- Seção de rating com `RatingStars` (média, total, estado de envio/erro)
- Tabs: conteúdo / materiais / comentários (desabilita materiais quando vazio)
- Tab de comentários integra `CommentForm` (top-level) + `CommentThread` (até 3 níveis) com estados de loading, erro e empty.
- Mensagem de erro exibida com CTA "Tentar novamente" quando `commentsError` + `onRetryComments`.
- `CommentForm` usa placeholders neon, contador de caracteres e feedback inline de erro.

Dependências:
- `src/shared/types/academy.types`
- Common: `Card`, `Badge`, `Tabs`, `Button`
- Video stack: `video.js`, `videojs-hotkeys`, `videojs-contrib-quality-levels`, `@silvermine/videojs-quality-selector`
- `RatingStars` para UI de avaliação

Visual cues:
- Container com glow neon (`glows.md`), borda dark e poster padrão
- Controles video.js centralizados + botão de qualidade neon
- Rating alinhado em uppercase com texto secundário

Test IDs (Playwright/RTL):
- Seção comentários: `lesson-comments-section`
- Erro comentários: `lesson-comments-error`
- Erro reply: `lesson-comments-reply-error`
- Erro moderação: `lesson-comments-moderation-error`
- Thread raiz: `lesson-comment-thread`
- Item comentário: `lesson-comment-item`
- Item reply: `lesson-comment-reply`
- Form comentário: `lesson-comment-form`
- Rating container: `lesson-rating-section`
- Média de rating: `rating-average`
- Seleção do usuário: `rating-user-selection`
