# HubService

## Purpose
- Fornecer uma chamada única para o Hub, agregando banners ativos, cursos em destaque, recomendações personalizadas, métricas consolidadas do Hidra e recursos em destaque do Cybervault.
- Encapsular a tolerância a falhas das dependências de domínio, registrando warnings e retornando dados parciais sempre que possível.

## Dependencies
- `AdminService.listActiveBanners(referenceDate?)` → lista `HeroBanner[]` já ordenados por prioridade.
- `AcademyService.getFeaturedCourses(limit)` e `AcademyService.getRecommendedCourses(userId, limit)` → retornam `CourseMeta[]` e `RecommendedCourse[]`.
- `HidraService.getDashboardSummary(userId, { recentLimit })` → produz `HidraDashboardSummary` com totais e resumo de mensagens.
- `CybervaultService.getFeaturedResources(limit)` → retorna `Resource[]` utilizados na vitrine do Hub.
- `Logger` (default `createLogger('HubService')`) para rastrear dependências indisponíveis.

## Methods
- `getOverview(options: HubOverviewOptions)`
  - Parâmetros: `userId` obrigatório; limites opcionais (`bannerLimit`, `featuredLimit`, `recommendationLimit`, `resourceLimit`) e `referenceDate`.
  - Retorno: `HubOverview` (`src/shared/types/hub.types.ts`) com
    - `banners` (`HeroBanner[]`)
    - `academy.featured` (`CourseMeta[]`)
    - `academy.recommendations` (`HubAcademyRecommendation[]`)
    - `hidra` (`HubHidraSummary | null`) → `null` quando o Hidra estiver indisponível.
    - `cybervault.featuredResources` (`Resource[]`)
    - `generatedAt` (`ISO string`).
  - Erros: lança `AppError` (`HUB_OVERVIEW_UNAVAILABLE`, 503) apenas quando **todas** as dependências falham.
- `getActiveBanners(limit?, referenceDate?)` → wrapper simples sobre `AdminService.listActiveBanners` com clamp padrão (máx. 24 itens, default 5).
- `getFeaturedCourses(limit?)` → expõe `AcademyService.getFeaturedCourses` com os mesmos limites padrão (máx. 24, default 6).

## Notes
- Cálculo de limites aplica clamp (1..24) para evitar sobrecarga nas consultas.
- Falhas individuais geram `logger.warn('HubService dependency failed', { dependency, code?, statusCode?, message })` e caem para coleções vazias ou `null`.
- `hidra` utiliza somente `totals` e `messageSummary` do snapshot; campanhas recentes continuam disponíveis via `HidraService`.
- Pensado para cache curto (60s) na API; invalidação recomendada ao publicar banners/cursos ou ao sincronizar métricas.
