Title: Hub - Banners
Method: GET
URL: /api/hub/banners
Auth: Bearer required
Query:
  status?: 'active' | 'all' (default 'active')
  limit?: number (1..24)
  referenceDate?: ISO datetime string (defaults to now)
Success 200:
  ApiResponse<HeroBanner[]>
Notes:
  - status=active delegates to HubService.getActiveBanners(limit, referenceDate) sorted by order.
  - status=all returns AdminService.listBanners() and applies optional limit client-side.
  - Meta payload contains `status` and `limit` for consumers.
  - Built for Hub widgets fallback when aggregator is unavailable.
