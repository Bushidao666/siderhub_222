Title: Hidra - Campaign Metrics
Method: GET
URL: /api/hidra/campaigns/:id/metrics
Auth: Bearer required
Params:
  id: UUID (campaignId)
Success 200:
  ApiResponse<CampaignMetrics>
Errors:
  400 VALIDATION_ERROR (invalid id)
  404 NOT_FOUND (campaign missing/external id absent)
Notes:
  - Calls HidraService.getCampaignMetrics which syncs remote metrics before returning cached data.
  - Meta includes requestId.
