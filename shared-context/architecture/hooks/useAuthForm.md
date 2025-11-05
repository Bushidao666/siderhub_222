# useAuthForm

## Propósito
Gerencia formulários de login e cadastro com React Hook Form e validação compartilhada (`loginRequestSchema`, `registerRequestSchema`). Integra diretamente com `useAuthStore` para enviar credenciais e lidar com erros de API simplificados.

## Retorno
- `loginForm`: instância `UseFormReturn<LoginRequest>`
- `registerForm`: instância `UseFormReturn<RegisterRequest>`
- `handleLogin(values)`: dispara `useAuthStore.login`
- `handleRegister(values)`: dispara `useAuthStore.register`
- `errors`: objeto agrupando `formState.errors`
- `isSubmitting`: flag combinada para feedback de UI

## Dependências
- `loginRequestSchema`, `registerRequestSchema` de `src/shared/utils/validation.ts`
- `mapApiError` para mensagens de erro humanizadas
- `useAuthStore` para ações `login`/`register`

## Observações
- Centraliza tratamento de erro utilizando `setError('root', { message })`.
- Mantém tipos alinhados com contratos compartilhados (`LoginRequest`, `RegisterRequest`).
- Ideal para ser consumido por componentes de UI que renderizam formulários de autenticação.
