Title: Hidra - Campaign Operations
Auth: Bearer required
Endpoints:
  POST /api/hidra/campaigns
    Body: { name, description?, segmentId, templateId, maxMessagesPerMinute?, scheduledAt?, externalId? }
    Response: ApiResponse<CampaignDetail>
    Errors: 400 VALIDATION_ERROR, 404 HIDRA_CONFIG_NOT_FOUND

  POST /api/hidra/campaigns/:id/schedule
    Body: { scheduledAt: ISO datetime }
    Response: ApiResponse<CampaignDetail>
    Errors: 400 VALIDATION_ERROR, 404 HIDRA_CAMPAIGN_NOT_FOUND

  GET /api/hidra/campaigns/:id/metrics
    Response: ApiResponse<CampaignMetrics>
    Errors: 400 VALIDATION_ERROR, 404 NOT_FOUND

Notes:
  - All responses include meta.requestId.
  - PUT /api/hidra/config and GET /api/hidra/dashboard remain 501 until service layer is ready.
