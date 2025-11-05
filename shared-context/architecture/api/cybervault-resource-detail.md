Title: Cybervault - Resource Detail
Method: GET
URL: /api/cybervault/resources/:slug
Auth: Bearer required
Params:
  slug: string (3..160)
Success 200:
  ApiResponse<Resource>
Errors:
  400 VALIDATION_ERROR
  404 NOT_FOUND (resource missing)
Notes:
  - Calls CybervaultService.getBySlug.
