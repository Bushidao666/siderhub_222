# useAuthStore

## Propósito
Gerencia o contexto de autenticação no frontend, mantendo sessão, tokens e mapa de acesso sincronizados com a API.

## Estado & Ações
- Estado persistido (`localStorage:siderhub-auth`): `user`, `accessToken`, `refreshToken`, `accessMap`, `activeSessions`.
- Flags: `isAuthenticated`, `isLoading`, `hydratedAt`, `lastError`.
- Ações expostas:
  - `login(credentials: LoginRequest)`
  - `register(input: RegisterRequest)`
  - `logout(request?: LogoutRequest)`
  - `refreshTokens()`
  - `hydrateFromStorage()`
  - `setAccessMap(accessMap: MemberAccessMap[])`
  - `setActiveSessions(sessions: SessionSummary[])`

## Endpoints Consumidos
- `POST /auth/login`
- `POST /auth/register`
- `POST /auth/logout`
- `POST /auth/refresh`

Todas as chamadas usam `ApiClient` com `assertSuccess` e `mapApiError` dos utilitários compartilhados.

## Dependências
- `src/shared/utils/apiClient.ts`
- `src/shared/utils/errorHandler.ts`
- Tipos compartilhados em `src/shared/types/auth.types.ts`
- React Query não é necessário diretamente, mas hooks de dados dependem do estado exposto.

## Observações
- Persistência configurada com `zustand/middleware/persist` (`skipHydration` + ação manual `hydrateFromStorage`).
- Handler `onUnauthenticated` aciona `logout()` para limpar o estado local se a API retornar 401.
- Exportadas seletores (`selectIsAuthenticated`, `selectUser`, etc.) para evitar re-renderizações.
