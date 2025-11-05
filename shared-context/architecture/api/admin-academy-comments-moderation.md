Title: Admin — Academy Comments Moderation

## GET /api/admin/academy/comments/moderation
- Auth: Bearer required
- RBAC: Admin, SuperAdmin, Mentor
- Query:
  - `status?` 'pending' | 'rejected' (default 'pending')
  - `page?` number >= 1 (default 1)
  - `pageSize?` number 1..100 (default 20)
- Sucesso 200: `ApiResponse<CommentModerationItem[]>`
- Meta: `requestId`, `status`, `page`, `pageSize`
- Erros: `400 VALIDATION_ERROR`, `403 FORBIDDEN`
- Notas:
  - Resultado vem de `AcademyService.listPendingModerationItems`, incluindo comentários e replies com metadados (`type`, `depth`).
  - Utilizar quando a fila de moderação for carregada na UI.
  - OrderBy: createdAt ASC para pending, DESC para rejected

## PATCH /api/admin/academy/comments/:commentId/moderation
- Auth: Bearer required
- RBAC: Admin, SuperAdmin, Mentor
- Params:
  - `commentId` — UUID do comentário
- Body:
  - `action`: 'approve' | 'reject' (required)
  - `reason?`: string (optional, max 500)
- Sucesso 200: `ApiResponse<LessonComment>`
- Meta: `requestId`, `commentId`, `action`
- Erros: `400 VALIDATION_ERROR`, `404 ACADEMY_COMMENT_NOT_FOUND`, `403 FORBIDDEN`
- Notas:
  - Aciona `AcademyService.approveComment` ou `rejectComment`
  - Replies descendentes herdam o status conforme regra de negócio
  - Retorna comentário completo com replies atualizadas

## PATCH /api/admin/academy/comments/:commentId/replies/:replyId/moderation
- Auth: Bearer required
- RBAC: Admin, SuperAdmin, Mentor
- Params:
  - `commentId` — UUID do comentário raiz
  - `replyId` — UUID do reply alvo
- Body:
  - `action`: 'approve' | 'reject' (required)
  - `reason?`: string (optional, max 500)
- Sucesso 200: `ApiResponse<LessonCommentReply>`
- Meta: `requestId`, `commentId`, `replyId`, `action`
- Erros: `400 VALIDATION_ERROR`, `404 ACADEMY_COMMENT_REPLY_NOT_FOUND`, `403 FORBIDDEN`
- Notas:
  - Executa `AcademyService.approveReply` ou `rejectReply`
  - Rejeição propaga recursivamente para replies descendentes
  - Retorna reply atualizado com metadados de moderação (pendingModeration=false, moderationStatus, moderatedById, moderatedAt)
