Title: Admin - Dashboard Overview
Method: GET
URL: /api/admin/dashboard
Auth: Bearer required (roles: admin | super_admin)
Success 200:
  ApiResponse<AdminDashboardPayload>
Fields (AdminDashboardPayload):
  - metrics: AdminDashboardMetric[] ({ id, label, value, description })
  - upcomingTasks: string[]
  - recentActivities: string[]
  - generatedAt: ISO datetime | null
Notes:
  - Protegido por roleGuard; compila métricas a partir de banners ativos, toggles e convites.
  - `metrics` inclui contagens dinâmicas (ex.: banners ativos, convites pendentes).
  - `upcomingTasks` destaca prioridades operacionais com base nos indicadores atuais.
  - `recentActivities` lista atividades recentes (convites enviados/atualizados) em formato legível.
  - Resposta sempre inclui `requestId` nos metadados via middleware padrão.
