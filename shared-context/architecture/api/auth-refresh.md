Title: Auth - Refresh
Method: POST
URL: /api/auth/refresh
Auth: none (uses refresh token)
Body: { refreshToken: string }
Success 200:
  ApiResponse<RefreshTokenResponse>
Errors:
  400 VALIDATION_ERROR
  401 AUTH_REFRESH_TOKEN_REQUIRED | AUTH_SESSION_NOT_FOUND | AUTH_SESSION_EXPIRED | AUTH_REFRESH_TOKEN_MISMATCH
Notes:
  - Zod validation via refreshTokenRequestSchema; AuthService.refreshTokens emits new token pair.
