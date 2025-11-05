# AuthService

## Purpose
- Centraliza regras de autenticação, sessões e mapa de acesso para membros do SiderHub.
- Expõe fluxos de login, registro, refresh e consulta do contexto atual do usuário.

## Dependencies
- `UserRepository`, `SessionRepository`, `InvitationRepository`, `MemberAccessRepository`
- `PasswordService` (bcrypt cost 12)
- `TokenService` (JWT access 15m, refresh 7d)
- Shared types `LoginResponse`, `RegisterResponse`, `MemberAccessMap`
- `AppError` para sinalizar falhas tratáveis
- Logger estruturado (`createLogger` → Pino wrapper)

## Methods
- `login(LoginContext)` → valida credenciais, registra sessão e tokens, retorna `LoginResponse`
- `register(RegisterContext)` → valida convite, cria usuário, define mapa de acesso inicial, retorna `RegisterResponse`
- `refreshTokens(RefreshContext)` → valida refresh token e sessão, rotaciona tokens, retorna `RefreshTokenResponse`
- `logout(userId, sessionId?)` → invalida uma sessão específica ou todas do usuário
- `me(userId)` → retorna `MeResponse` com dados e sessões ativas

## Internal Helpers
- `issueSessionAndTokens` gera sessão + tokens e atualiza último login
- `ensureAccessMap` garante mapa padrão baseado em `UserRole`
- `buildDefaultAccessMap` define permissões padrão por feature
- `hashRefreshToken` usa SHA-256 antes de persistir refresh token
- `parseTtlToMs` converte TTL configurável (s/m/h/d)

## Interactions
- Persiste sessões rotacionando refresh tokens
- Atualiza `member_access` quando necessário
- Emite logs (`info`, `warn`, `debug`) para auditoria

## Notes
- Invalida sessão quando refresh token não corresponde ao hash armazenado
- `generateSessionId` usa `crypto.randomUUID` até o repositório suportar IDs gerados via banco
- TTL de refresh é injetado via config para alinhar com variáveis de ambiente
