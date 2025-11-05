Title: Hidra - Update Evolution Config
Method: PUT
URL: /api/hidra/config
Auth: Bearer required
Body:
  baseUrl: string (https URL)
  apiKey: string (>=8 chars)
  verifyConnection?: boolean (default true)
Success 200:
  ApiResponse<EvolutionApiConfig>
Errors:
  400 VALIDATION_ERROR
Notes:
  - Valida `baseUrl` e `apiKey` com Zod antes de chamar `HidraService.updateConfig`.
  - Service criptografa a API key, salva via `HidraConfigRepository.upsertForUser` e opcionalmente testa conexão.
  - Resposta traz o registro persistido (inclui `status` e `apiKeyEncrypted`); meta.requestId anexada quando disponível.
  - Enviar `verifyConnection=false` apenas armazena a config e marca status `disconnected` até o próximo health check.
