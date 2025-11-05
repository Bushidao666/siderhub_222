Title: Academy - Course Tree
Method: GET
URL: /api/academy/courses/:id/tree
Auth: Bearer required
Params:
  id: UUID
Success 200:
  ApiResponse<CourseTree>
Errors:
  400 VALIDATION_ERROR
  404 NOT_FOUND (course missing)
Notes:
  - Calls AcademyService.getCourseTree with userId context for drip-release handling.
