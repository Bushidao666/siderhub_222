Title: Academy - List Courses
Method: GET
URL: /api/academy/courses
Auth: Bearer required
Query:
  page?: number >= 1
  pageSize?: number (1..100)
  status?: CourseStatus
  visibility?: Visibility
  tag?: string
  search?: string (2..160)
  sortBy?: string
  sortDirection?: 'asc' | 'desc'
Success 200:
  ApiResponse<PaginatedResponse<CourseMeta>>
Errors:
  400 VALIDATION_ERROR
Notes:
  - Delegates to AcademyService.getCourses with filters.
