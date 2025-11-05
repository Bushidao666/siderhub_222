Title: Academy - Lesson Progress Snapshot
Method: GET
URL: /api/academy/lessons/:id/progress
Auth: Bearer required
Params:
  id: UUID (lesson)
Success 200:
  ApiResponse<LessonProgressSnapshot>
Notes:
  - Calls `AcademyService.getLessonProgressSnapshot` to combine aggregate ticks with course progress context.
  - Returns zeroed snapshot when no ticks exist yet; completion is inferred from stored percentages or completedLessonIds.
  - Meta includes `intervalSeconds=10` so clients reuse the recommended emission cadence.
  - Returns VALIDATION_ERROR when the path param is not a UUID; permission errors propagate as AppError (403 / 404).
