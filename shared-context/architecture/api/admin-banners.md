Title: Admin - Banners CRUD
Methods:
  GET /api/admin/banners
  POST /api/admin/banners
  PUT /api/admin/banners/:id
  DELETE /api/admin/banners/:id
Auth: Bearer + roleGuard(Admin | SuperAdmin)
Body:
  POST/PUT reuse bannerSchema (title, description, CTAs, imageUrl, status, startsAt, endsAt, order?)
Success:
  GET → ApiResponse<HeroBanner[]>
  POST → ApiResponse<HeroBanner>
  PUT → ApiResponse<HeroBanner>
  DELETE → ApiResponse<{ ok: true }>
Errors:
  400 VALIDATION_ERROR
  403 FORBIDDEN (role)
Notes:
  - createBanner injects createdBy from req.user; updateBanner injects updatedBy.
  - Responses include meta.requestId.
