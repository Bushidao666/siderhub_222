# Schema academy

## Visão Geral
- Representa o catálogo de cursos (curso → módulos → aulas) e interações (progresso, comentários).
- Enums alinhados a `CourseStatus`, `CourseLevel`, `Visibility`, `LessonType`, `RecommendationBadge`.
- Soft-delete não aplicado; exclusões cascata asseguram limpeza de dependências.

## Tabelas

### `academy.courses`
- **PK**: `id` (`uuid`); **Unique**: `slug`.
- **Campos**: `title`, `subtitle`, `description`, `cover_image`, `level`, `status`, `visibility`, `estimated_duration_minutes`, `total_lessons`, `tags[]`, `release_date`, `is_featured`, `recommendation_score`, `created_by_id`.
- **Índices**: status, visibility, author, `is_featured`, `recommendation_score` (suporte a filtros hub/PRD).
- **Constraints**: `recommendation_score` com CHECK garantindo valores `>= 0` (evita scores negativos em seeds ou updates).
- **Relacionamentos**: 1:N com `course_modules`, `course_progress`, `course_recommendations`; opcional N:1 com `core.users` (autor).
- **Uso**: fonte para `CourseMeta`/`CourseTree`, cards do hub e algoritmos de recomendação.

### `academy.course_modules`
- **PK**: `id` (`uuid`); **Unique**: `(course_id, order)`.
- **Campos**: `title`, `description`, `duration_minutes`, `drip_days_after`, `drip_release_at`, `drip_after_module_id`.
- **Índices**: `(course_id, drip_release_at)`, `drip_after_module_id`.
- **Relacionamentos**: N:1 com `courses`; 1:N com `lessons` (cascade); auto-relacionamento opcional para dependência de drip (`drip_after_module_id`).
- **Uso**: estrutura hierarchical + políticas de liberação (dias, data específica, após módulo anterior).

### `academy.lessons`
- **PK**: `id` (`uuid`); **Unique**: `(module_id, order)`.
- **Campos**: `type`, `content` (`jsonb` encapsula union de LessonContent), `summary`, `duration_minutes`, `is_preview`, `release_at`.
- **Índices**: `release_at` (unlock por data).
- **Relacionamentos**: N:1 com `course_modules`; 1:N com `lesson_comments` (cascade).
- **Uso**: player de aulas; `content` carrega payload adaptado aos tipos `video/article/live/downloadable/quiz`.

### `academy.course_progress`
- **PK**: composto `(user_id, course_id)`.
- **Campos**: `completed_lesson_ids[]`, `percentage`, `last_lesson_id`, `updated_at`.
- **Relacionamentos**: N:1 com `core.users` e `academy.courses` (cascade).
- **Índices**: PK `(course_id, user_id)`, secundário por `user_id` e composto `(course_id, user_id, percentage)` para dashboards ordenados.
- **Uso**: alimentar dashboards (barra de progresso, recomendações).

### `academy.lesson_comments`
- **PK**: `id` (`uuid`).
- **Campos**: `lesson_id`, `user_id`, `body`, `pending_moderation`, `moderation_status`, `moderated_by_id`, `moderated_at`, timestamps.
- **Relacionamentos**: N:1 com `academy.lessons` e `core.users`; ligação opcional com `core.users` via `moderated_by_id`; 1:N com `lesson_comment_replies`.
- **Índices**: `lesson_id`, `user_id`, `(lesson_id, created_at DESC)`, `(moderation_status, created_at DESC)` (fila de moderação e auditoria cronológica).
- **Uso**: thread de comentários por aula. `moderation_status` controla estados `pending/approved/rejected`; `moderated_by_id` + `moderated_at` registram atuação de mentores/admins, enquanto `pending_moderation` segue disponível para compatibilidade com fluxos legados.

### `academy.lesson_comment_replies`
- **PK**: `id` (`uuid`).
- **Campos**: `comment_id`, `parent_reply_id`, `user_id`, `body`, `pending_moderation`, `moderation_status`, `moderated_by_id`, `moderated_at`, `created_at`, `updated_at`.
- **Relacionamentos**: N:1 com `lesson_comments`, auto-relacionamento opcional para threads multi-nível (`parent_reply_id`) com deleção `SET NULL` (preserva subárvores quando o pai é removido) e N:1 com `core.users` tanto para autores quanto para moderadores.
- **Índices**: `comment_id`, `(comment_id, created_at DESC)`, `user_id`, `parent_reply_id`, `(moderation_status, created_at DESC)` para agilizar filtros por estado e reconstrução hierárquica ordenada.
- **Uso**: garante respostas encadeadas com o mesmo fluxo de moderação dos comentários principais, permitindo sinalizar pendentes, rastrear quem aprovou/rejeitou e auditar alterações via `updated_at`.

### `academy.course_recommendations`
- **PK**: `id` (`uuid`).
- **Campos**: `course_id`, `reason`, `badge` (`RecommendationBadge?`).
- **Relacionamentos**: N:1 com `courses` (cascade).
- **Uso**: alimentar seção "Recomendações" do hub com contexto textual e badge.

### `academy.lesson_ratings`
- **PK**: `id` (`uuid`); **Unique**: `(user_id, lesson_id)`.
- **Campos**: `lesson_id`, `user_id`, `value` (`smallint` 1..5), `created_at`.
- **Índices**: por `lesson_id`, `user_id`, `lesson_id + user_id` (consultas de média e lookup do usuário).
- **Relacionamentos**: N:1 com `academy.lessons` e `core.users` (cascade).
- **Constraints**: CHECK garante `value` entre 1 e 5.
- **Uso**: média de estrelas, controle de votação única e pré-carregamento do rating do usuário.

### `academy.lesson_progress_events`
- **PK**: `id` (`uuid`).
- **Campos**: `lesson_id`, `user_id`, `occurred_at`, `position_sec`.
- **Índices**: `lesson_id`, `user_id`, `lesson_id + user_id`, `user_id + lesson_id + occurred_at` (ticks a cada 10s e reconstrução cronológica).
- **Relacionamentos**: N:1 com `academy.lessons` e `core.users` (cascade).
- **Uso**: persistir eventos de progresso incremental para retomada e métricas de engajamento.

### `academy.lesson_progress_aggregate`
- **PK**: composto `(lesson_id, user_id)`.
- **Campos**: `last_position_sec`, `percentage`, `updated_at`.
- **Índices**: `lesson_id`, `user_id`.
- **Relacionamentos**: N:1 com `academy.lessons` e `core.users` (cascade).
- **Uso**: leitura rápida do estado atual do aluno sem reprocessar eventos (resumo para API e recomendações).

## Notas
- `content` em `lessons` segue exatamente os contratos em `academy.types.ts` (services devem validar via Zod antes de persistir).
- `total_lessons` pode ser recalculado via trigger/service; seed inicial mantém valor manual.
- Seeds populam ratings e agregados para cobrir consultas do hub e cenários de replays.
- Seeds agora incluem comentários com estados `pending`, `approved`, `rejected`, replies encadeadas e vínculo de moderação (`moderated_by_id`) para cenários de teste.
