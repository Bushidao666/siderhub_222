Title: Cybervault - Record Download
Method: POST
URL: /api/cybervault/resources/:id/download
Auth: Bearer required
Params:
  id: UUID (resourceId)
Body: none
Success 200:
  ApiResponse<{ ok: true; totalDownloads: number }>
Errors:
  400 VALIDATION_ERROR
  404 CYBERVAULT_RESOURCE_NOT_FOUND (service)
Notes:
  - Uses request IP (trust proxy enabled) to log via CybervaultService.recordDownload.
  - Response includes updated download count for UI refresh.
  - Meta carries requestId for observability.
