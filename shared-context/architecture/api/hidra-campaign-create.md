Title: Hidra - Create Campaign
Method: POST
URL: /api/hidra/campaigns
Auth: Bearer required (feature access via service)
Body:
  name: string (3-120)
  description?: string (max 500)
  segmentId: UUID
  templateId: UUID
  maxMessagesPerMinute?: number (1-1000, default 60)
  scheduledAt?: ISO string | null
  externalId?: string
Success 201:
  ApiResponse<CampaignDetail>
Errors:
  400 VALIDATION_ERROR (payload)
  404 HIDRA_CONFIG_NOT_FOUND (no Evolution config for user)
  409 HIDRA_CAMPAIGN_MISSING_EXTERNAL_ID (service)
Notes:
  - Delegates to HidraService.createCampaign; request userId is injected from authGuard.
  - meta.requestId provided in response.
