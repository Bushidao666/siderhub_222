# AcademyService

## Purpose
- Encapsula regras da Academia (listagem de cursos, drip-release, progresso e comentários moderados).
- Normaliza contratos consumidos pela camada API e pelos testes.

## Dependencies
- `CourseRepository` (`list`, `findTreeById`) para buscar metadados e árvore completa de cursos.
- `LessonRepository` (`findById`) com contexto de curso + flags de comentários.
- `CourseProgressRepository` (`getByUserAndCourse`, `upsert`) para persistir progresso.
- `LessonProgressEventRepository` (`create`, `pruneOld`) para registrar ticks brutos.
- `LessonProgressAggregateRepository` (`get`, `upsert`) para última posição/% por usuário.
- `LessonRatingRepository` (`upsert`, `getSummaryByLesson`) para armazenar nota única por usuário e agregar média.
- `LessonCommentRepository` (`create`, `listByLesson`, `listPending`, `updateModeration`, `findById`) para registrar comentários, recuperar threads e processar moderação (approve/reject).
- `LessonCommentReplyRepository` (`create`, `listByComments`, `findById`, `updateModeration`) para gerenciar replies aninhados (até 3 níveis) mantendo estado de moderação sincronizado com o comentário pai.
- `CourseRecommendationRepository` (`listForUser`, `listGlobal`) para recomendações fallback.
- `AppError` padrão e logger (`createLogger('AcademyService')`).
- Shared types: `CourseMeta`, `CourseTree`, `CourseProgress`, `CourseRecommendation`, `LessonComment`.

## Methods
- `getCourses(params)` → pagina cursos com filtros (`status`, `visibility`, `tag`, `search`), retorna `PaginatedResponse<CourseMeta>`.
- `getCourseTree(courseId, context?)` → entrega árvore sem aulas não liberadas; aplica ordenação e drip release (`releaseAt`, `isPreview`).
- `updateProgress({ userId, courseId, lessonId })` → valida pertinência da aula, respeita drip release, recalcula `%` arredondado e persiste via `CourseProgressRepository`.
- `getCourseProgress(courseId, userId)` → retorna progresso agregado do usuário; cria stub `percentage=0` quando não houver registro para suportar `GET /progress`.
- `submitLessonRating({ lessonId, userId, value })` → valida aula liberada, restringe `value` a `1..5`, persiste via `LessonRatingRepository.upsert` e retorna `LessonRatingSummary`. Erros: `ACADEMY_LESSON_NOT_FOUND` (404), `ACADEMY_LESSON_LOCKED` (403), `ACADEMY_RATING_VALUE_INVALID` (400).
- `getLessonRatingSummary(lessonId, context?)` → consolida média (`average`, `totalRatings`) e inclui `userRating` se `context.userId` informado. Erros: `ACADEMY_LESSON_NOT_FOUND` (404).
- `recordLessonProgressTick({ lessonId, courseId, userId, positionMs, durationMs, completed?, emittedAt? })` → aceita ticks a cada ≥10s, normaliza posição dentro da duração, aplica drip (usa `assertLessonAvailable`), grava em `LessonProgressEventRepository` e consolida snapshot em `LessonProgressAggregateRepository`. Retorna `LessonProgressSnapshot`. Erros: `ACADEMY_LESSON_NOT_FOUND` (404), `ACADEMY_LESSON_LOCKED` (403), `ACADEMY_PROGRESS_INVALID_POSITION` (400).
- `getLessonProgressSnapshot({ lessonId, userId })` → busca agregados (`LessonProgressSnapshot`), retornando `completed = percentage >= 95` e `lastPositionMs`. Erros: `ACADEMY_LESSON_NOT_FOUND` (404).
- `addLessonComment({ lessonId, userId, body })` → garante aula liberada e comentários habilitados, cria registro com `pendingModeration`/`moderationStatus` consistentes.
- `addLessonCommentReply({ commentId, userId, body, parentReplyId? })` → valida acesso ao comentário e profundidade (< 3 níveis), cria reply propagando `pendingModeration` quando o comentário pai ainda não foi aprovado.
- `listLessonComments({ lessonId, userId, page?, pageSize?, after? })` → retorna comentários ordenados com replies aninhadas em até 3 níveis.
- `listPendingComments({ page?, pageSize?, status? })` → lista comentários com `moderationStatus` pendente ou rejeitado para telas de moderação.
- `listPendingModerationItems({ status?, page?, pageSize? })` → consolida comentários e replies (pendentes ou rejeitados), enriquece com metadados de curso/aula/usuário e ordena por `createdAt` asc para alimentar a fila administrativa (`CommentModerationItem[]`).
- `approveComment({ commentId, moderatorId })` → atualiza `moderationStatus` para `approved`, limpa `pendingModeration` e sincroniza replies pendentes.
- `rejectComment({ commentId, moderatorId })` → marca comentário/replies como `rejected`, registrando `moderatedById`/`moderatedAt`.
- `approveReply({ commentId, replyId, moderatorId })` → aprova uma reply específica e propaga aprovação para descendentes que ainda estejam pendentes.
- `rejectReply({ commentId, replyId, moderatorId })` → rejeita reply alvo e sincroniza subárvore (mantendo rejeitados anteriores).
- `listRecommendations(userId, limit?)` → tenta recomendações personalizadas e cai para `listGlobal`.

## Internal Helpers
- `toPaginatedResponse` para normalizar `list` → `PaginatedResponse`.
- `collectAccessibleLessonOrder` computa ordenação das aulas liberadas (drip) para cálculo preciso de progresso.
- `isLessonAvailable` / `assertLessonAvailable` aplicam regras de release (`releaseAt`, `isPreview`).
- `findLessonOrThrow` centraliza lookup com tratamento 404.
- `now/nowIso` injetáveis (facilitam testes).
- `normalizeProgressTick` garante `positionMs` entre `0` e `durationMs`, arredonda para múltiplos de 1000ms e define `percentage`.
- `pruneOldProgressEvents` remove ticks antigos (>7 dias) mantendo no máximo 60 registros por `lessonId+userId`.

## Notes
- Drip release: aulas com `releaseAt` futuro são ignoradas exceto se `isPreview = true`.
- Comentários: respeitam flags por aula (`isCommentingEnabled`, `isCommentingModerated`), oferecem moderação (`pending/approved/rejected`) e sincronizam replies até três níveis; a fila de moderação expõe `CommentModerationItem` consolidando comentários e replies.
- Recomendações: limite padrão `6`, mas método aceita override.
- Ratings: armazenam no máximo 1 nota por usuário, média calculada com duas casas decimais; invalidam cache de recomendações.
- Progress ticks: frontend envia payload mínimo a cada 10s enquanto reproduz vídeo; marcar `completed = true` força `% = 100`.
- Todos retornos usam tipos compartilhados; nenhuma duplicação de DTO.
