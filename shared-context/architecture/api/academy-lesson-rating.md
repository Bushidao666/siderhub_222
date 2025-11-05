Title: Academy - Lesson Rating
Endpoints:
  1. GET /api/academy/lessons/:id/rating
     Auth: Bearer required
     Params:
       id: UUID (lesson)
     Success 200:
       ApiResponse<LessonRatingSummary>
     Notes:
       - Returns aggregate average + totalRatings.
       - Includes `userRating` when the requester has rated the lesson.
       - Emits VALIDATION_ERROR for malformed UUID.

  2. POST /api/academy/lessons/:id/rating
     Auth: Bearer required
     Params:
       id: UUID (lesson)
     Body:
       value: number (1..5)
     Success 200:
       ApiResponse<LessonRatingSummary>
     Errors:
       - 400 VALIDATION_ERROR when rating is outside 1..5.
       - AppError codes from AcademyService (ex.: lesson locked ou não acessível).
     Notes:
       - Delegates to AcademyService.rateLesson(userId, lessonId, value) e retorna o snapshot atualizado via `getLessonRatingSummary`.
       - Subsequent posts overwrite previous rating for same user/lesson.

  3. DELETE /api/academy/lessons/:id/rating
     Auth: Bearer required
     Params:
       id: UUID (lesson)
     Success 200:
       ApiResponse<{ ok: true }>
     Notes:
       - Calls AcademyService.removeLessonRating(userId, lessonId).
       - Idempotent: removing inexistente retorna ok.
