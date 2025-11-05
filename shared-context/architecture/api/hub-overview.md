Title: Hub - Overview Aggregator
Method: GET
URL: /api/hub
Auth: Bearer required
Query:
  bannerLimit?: number (1..24, default 5)
  featuredLimit?: number (1..24, default 6)
  recommendationLimit?: number (1..24, default 6)
  resourceLimit?: number (1..24, default 6)
  referenceDate?: ISO datetime string
  hidraRecentLimit?: number (1..20, default 3)
Success 200:
  ApiResponse<HubOverview>
Fields (HubOverview):
  - banners: HeroBanner[]
  - academy.featured: CourseMeta[]
  - academy.recommendations: HubAcademyRecommendation[] (`{ course, recommendation }`)
  - hidra: HubHidraSummary | null (`{ totals, messageSummary }`)
  - cybervault.featuredResources: Resource[]
  - generatedAt: ISO datetime string
Notes:
  - Wraps HubService.getOverview(userId, limits) preservando a estrutura tipada compartilhada.
  - Recomendação inclui tanto o curso quanto o motivo (CourseRecommendation).
  - `hidra` agrega totais e resumo de mensagens do dashboard (ou null quando indisponível).
  - Meta inclui limites efetivos, referência temporal, requestId e `hidraRecentLimit` aplicado.
  - AuthGuard requerido; roteador herda helmet/rate limiting configurados em server.ts.
