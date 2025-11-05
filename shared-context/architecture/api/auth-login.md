Title: Auth - Login
Method: POST
URL: /api/auth/login
Auth: none (public)
Body:
  email: string
  password: string
Success 200:
  ApiResponse<LoginResponse>
Errors:
  400 VALIDATION_ERROR
  401 AUTH_INVALID_CREDENTIALS
Notes:
  - Validates via loginRequestSchema and calls AuthService.login with request IP/user-agent.
  - Responses include meta.requestId when available.
