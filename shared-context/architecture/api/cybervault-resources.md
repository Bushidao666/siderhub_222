Title: Cybervault - List Resources
Method: GET
URL: /api/cybervault/resources
Auth: Bearer required
Query Params:
  query?: string (min 1)
  categoryIds?: UUID list (comma-separated or array, max 10)
  tagIds?: UUID list (max 10)
  types?: ResourceType[] (max 10)
  visibility?: Visibility
  page?: number >=1
  pageSize?: number (1..100)
  sortBy?: string
  sortDirection?: 'asc' | 'desc'
Success 200:
  ApiResponse<PaginatedResponse<Resource>>
Errors:
  400 VALIDATION_ERROR
Notes:
  - Delegates to CybervaultService.listResources; empty arrays stripped.
