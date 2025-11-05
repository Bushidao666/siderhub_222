Title: Auth - Logout
Method: POST
URL: /api/auth/logout
Auth: Bearer required
Body: { sessionId?: UUID }
Success 200:
  ApiResponse<{ ok: true }>
Errors:
  400 VALIDATION_ERROR (if payload invalid)
  401 AUTH_REQUIRED (missing bearer)
Notes:
  - With sessionId, invalidates that session; otherwise clears all user sessions.
  - Uses authGuard to populate req.user.
