Title: Hidra - Schedule Campaign
Method: POST
URL: /api/hidra/campaigns/:id/schedule
Auth: Bearer required
Params:
  id: UUID (campaignId)
Body:
  scheduledAt: ISO datetime string
Success 200:
  ApiResponse<CampaignDetail>
Errors:
  400 VALIDATION_ERROR (id/body)
  404 HIDRA_CAMPAIGN_NOT_FOUND | HIDRA_CAMPAIGN_MISSING_EXTERNAL_ID
Notes:
  - InitiatedBy uses req.user.userId; service records campaign run + remote scheduling.
  - Response meta includes requestId.
