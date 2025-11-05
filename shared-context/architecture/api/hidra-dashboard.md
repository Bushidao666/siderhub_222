Title: Hidra - Dashboard Summary
Method: GET
URL: /api/hidra/dashboard
Auth: Bearer required
Query:
  recentLimit?: number (1..100)
Success 200:
  ApiResponse<HidraDashboardSummary>
Errors:
  400 VALIDATION_ERROR
Notes:
  - Invoca `HidraService.getDashboardSummary` para agrupar totais, métricas recentes e a config Evolution do usuário.
  - `recentLimit` controla quantas campanhas recentes são retornadas (default = tamanho da lista).
  - `messageSummary.lastUpdatedAt` sempre presente (usa timestamp atual quando ausente no snapshot).
  - meta.requestId incluída automaticamente pelos helpers de resposta.
