Title: Hidra - Campaigns Metrics Overview (Hub)
Method: GET
URL: /api/hidra/campaigns/metrics/overview
Auth: Bearer required
Query:
  recentLimit?: number (1..100)
Success 200:
  ApiResponse<HidraMessageSummary>
Fields (HidraMessageSummary):
  - totalMessages: number
  - delivered: number
  - failed: number
  - pending: number
  - averageDeliveryMs: number
  - lastUpdatedAt: string|null
Notes:
  - Lightweight alias for Hub widgets. Wraps HidraService.getDashboardSummary(userId) and returns only `messageSummary`.
  - For the full dashboard payload, use GET /api/hidra/dashboard.
  - meta.requestId is included automatically.
  - Protected by `campaignLimiter` (60 requests por usuário/10 minutos).
Example:
{
  "success": true,
  "data": {
    "totalMessages": 1240,
    "delivered": 1120,
    "failed": 30,
    "pending": 90,
    "averageDeliveryMs": 420,
    "lastUpdatedAt": "2025-11-03T08:00:00Z"
  },
  "timestamp": "2025-11-03T08:30:00Z",
  "meta": { "requestId": "uuid" }
}
