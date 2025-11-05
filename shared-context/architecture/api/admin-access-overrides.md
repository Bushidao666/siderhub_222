Title: Admin - Access Overrides
Methods: POST, DELETE
URLs:
  - POST /api/admin/access-overrides → ApiResponse<MemberAccessOverride>
  - DELETE /api/admin/access-overrides → ApiResponse<{ ok: true }>
Auth: Bearer + adminOnly
Bodies:
  POST: { userId: UUID; feature: FeatureAccessKey; enabled: boolean; permissions: string[]; reason?: string }
  DELETE: { userId: UUID; feature: FeatureAccessKey }
Errors:
  400 VALIDATION_ERROR
Notes:
  - setAccessOverride injects grantedBy from req.user.
  - removeAccessOverride clears override and returns { ok: true }.
  - meta.requestId present on responses.
