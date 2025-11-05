Title: Academy — Lesson Comments & Replies

## GET /api/academy/lessons/:lessonId/comments
- Auth: Bearer required
- Params:
  - `lessonId` (path) — UUID da aula
  - Query:
    - `page?` number >= 1 (default 1)
    - `pageSize?` number entre 1 e 100 (default 20)
    - `after?` UUID (cursor opcional)
- Sucesso 200: `ApiResponse<LessonComment[]>`
- Meta: `requestId`, `page`, `pageSize`
- Erros: `400 VALIDATION_ERROR`, `403 ACADEMY_LESSON_LOCKED`, `404 ACADEMY_LESSON_NOT_FOUND`
- Notas:
  - Lista comentários do serviço considerando regras de drip e visibilidade; mesmos guards das aulas.
  - Cada `LessonComment` inclui `pendingModeration`, `moderationStatus`, `moderatedById`, `moderatedAt`.
  - `replies` retorna replies aninhadas até 3 níveis, preservando ordem cronológica ascendente e metadados de moderação em cada nó.

## POST /api/academy/lessons/:lessonId/comments
- Auth: Bearer required
- Params:
  - `lessonId` (path) — UUID da aula
- Body:
  - `body`: string (3..2000)
- Sucesso 201: `ApiResponse<LessonComment>`
- Erros:
  - 400 `VALIDATION_ERROR`
  - 403 `ACADEMY_COMMENTS_DISABLED` | `ACADEMY_LESSON_LOCKED`
  - 404 `ACADEMY_LESSON_NOT_FOUND`
- Notas:
  - Serviço define automaticamente `pendingModeration` conforme configuração da aula.

## POST /api/academy/lessons/:lessonId/comments/:commentId/replies
- Auth: Bearer required
- Params:
  - `lessonId` (path) — UUID da aula
  - `commentId` (path) — UUID do comentário raiz
- Body:
  - `body`: string (1..1200)
  - `parentReplyId?`: UUID (permite encadear até 3 níveis)
- Sucesso 201: `ApiResponse<LessonCommentReply>`
- Meta: `requestId`, `lessonId`, `commentId`, `parentReplyId?`
- Erros:
  - 400 `VALIDATION_ERROR` | `ACADEMY_COMMENT_REPLY_DEPTH_EXCEEDED`
  - 403 `ACADEMY_COMMENTS_DISABLED` | `ACADEMY_LESSON_LOCKED` | `ACADEMY_COMMENT_REJECTED`
  - 404 `ACADEMY_COMMENT_NOT_FOUND` | `ACADEMY_COMMENT_REPLY_PARENT_NOT_FOUND`
- Notas:
  - Replies herdadas de comentários/replies rejeitados permanecem pendentes até aprovação.
  - Encadeamento limitado à profundidade 3, sempre retornado já ordenado nas listagens.
