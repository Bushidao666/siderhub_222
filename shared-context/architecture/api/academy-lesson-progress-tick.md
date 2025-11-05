Title: Academy - Lesson Progress Tick
Method: POST
URL: /api/academy/lessons/:id/progress-tick
Auth: Bearer required
Params:
  id: UUID (lesson)
Body:
  lessonId: UUID (must match :id)
  courseId: UUID
  positionMs: number (0..21_600_000)
  durationMs?: number (0..21_600_000)
  completed?: boolean
  emittedAt?: ISO datetime string
Success 200:
  ApiResponse<LessonProgressSnapshot>
Notes:
  - Delegates to `AcademyService.recordLessonProgressTick` which verifies drip/permission rules and clamps the reported position.
  - `positionMs` is converted to seconds for persistence; `durationMs` is optional and only used to refine percentage calculations.
  - When `completed` is true the snapshot is forced to 100% and flagged completed; otherwise completion is inferred from percentage>=95 or course progress.
  - Response meta includes `intervalSeconds=10` so the frontend keeps the tick cadence aligned.
  - Emits VALIDATION_ERROR when lessonId/courseId mismatch or payload is malformed.
