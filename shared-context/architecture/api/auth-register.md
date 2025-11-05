Title: Auth - Register
Method: POST
URL: /api/auth/register
Auth: none
Body:
  email: string (valid email)
  password: string (>=8, upper/lower/digit)
  name: string (2-120)
  inviteCode: string (6-32)
Success 201:
  ApiResponse<RegisterResponse>
Errors:
  400 VALIDATION_ERROR | AUTH_INVALID_INVITE
  409 AUTH_EMAIL_IN_USE
Notes:
  - Zod validation via registerRequestSchema; AuthService.register handles invite + session creation.
