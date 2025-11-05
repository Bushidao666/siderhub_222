Title: Hidra - Test Evolution Config
Method: POST
URL: /api/hidra/config/test
Auth: Bearer required
Body: none
Success 200:
  ApiResponse<{ ok: boolean }>
Errors:
  401 AUTH_REQUIRED
  404 HIDRA_CONFIG_NOT_FOUND (from service)
Notes:
  - Calls HidraService.testConnection using authenticated userId.
  - Service updates health check timestamp/status; response meta contains requestId.
