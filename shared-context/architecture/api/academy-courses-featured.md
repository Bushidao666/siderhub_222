Title: Academy - Featured Courses
Method: GET
URL: /api/academy/courses/featured
Auth: Bearer required
Query:
  limit?: number (1..24, default 6)
Success 200:
  ApiResponse<CourseMeta[]>
Notes:
  - Delegates to AcademyService.getFeaturedCourses(limit).
  - meta.limit espelha o limite efetivo.
