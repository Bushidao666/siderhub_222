Title: Auth - Me
Method: GET
URL: /api/auth/me
Auth: Bearer required
Success 200:
  ApiResponse<{ user: User; accessMap: MemberAccessMap[]; activeSessions: SessionSummary[] }>
Errors:
  401 AUTH_REQUIRED
  404 AUTH_USER_NOT_FOUND
Notes:
  - Returns sanitized user profile with access map and active sessions via AuthService.me.
