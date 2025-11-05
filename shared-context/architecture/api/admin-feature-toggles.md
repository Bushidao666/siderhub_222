Title: Admin - Feature Toggles
Method: GET, PUT
URLs:
  - GET /api/admin/feature-toggles → ApiResponse<FeatureToggle[]>
  - PUT /api/admin/feature-toggles/:id → ApiResponse<FeatureToggle>
Auth: Bearer + adminOnly
Body (PUT):
  status: 'enabled' | 'disabled' | 'gradual'
  rolloutPercentage?: number (0..100, only for gradual)
Errors:
  400 VALIDATION_ERROR
  403 FORBIDDEN (roleGuard)
Notes:
  - PUT delegates to AdminService.updateFeatureToggle with validation for gradual rollout.
  - GET lists current toggles via AdminService.getFeatureToggles.
  - meta.requestId included on responses.
