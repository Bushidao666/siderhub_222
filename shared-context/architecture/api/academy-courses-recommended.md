Title: Academy - Recommended Courses
Method: GET
URL: /api/academy/courses/recommended
Auth: Bearer required
Query:
  limit?: number (1..24, default 6)
Success 200:
  ApiResponse<CourseRecommendation[]>
Notes:
  - Usa AcademyService.getRecommendedCourses(userId, limit) e retorna apenas Recommendation DTOs.
  - meta.limit indica o limite aplicado.
  - 403 pode ocorrer via AppError quando recomendações dependem de cursos bloqueados.
