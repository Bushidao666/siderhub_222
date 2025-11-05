# CybervaultService

## Purpose
- Centraliza regras da biblioteca de recursos (Cybervault): listagem filtrada, destaques e tracking de downloads.
- Garante consistência dos contadores (`downloadCount`) e logs de auditoria antes da camada API.

## Dependencies
- `ResourceRepository` → consultas paginadas, busca por slug/ID, destaques e incremento de downloads.
- `ResourceDownloadRepository` → gravação de logs (`resource_download_log`).
- `AppError` para erros tratáveis (404/403).
- Logger (`createLogger('CybervaultService')`).

## Methods
- `listResources(params?)` → aplica Zod (paginação, query, tags, tipos, visibility) e retorna `PaginatedResponse<Resource>`.
- `getBySlug(slug)` → valida slug e retorna `Resource | null`.
- `getFeaturedResources(limit=6)` → busca recursos com flag `featured` (limit configurável 1..24).
- `recordDownload({ resourceId, userId, ipAddress })` → valida UUID/IP, confirma existência, grava log e incrementa `downloadCount`, retornando `ResourceDownloadReceipt { ok, totalDownloads, lastDownloadedAt }`.

## Notes
- Filtros suportados: texto (`query`), categorias, tags, `ResourceType`, `Visibility`, ordenação (`sortBy/sortDirection`).
- IP validado via `z.string().ip()`; recibo usa `lastDownloadedAt` (ISO) gerado pelo relógio injetável para sincronizar UI/testes.
- Logging `info` após gravação de download.
- Service não aplica controle de acesso por role; middleware deve garantir antes de chamar.

## Exposed By
- `src/backend/services/cybervault/CybervaultService.ts`
- Export em `src/backend/services/cybervault/index.ts`

## Consumed By
- subagent-backend-api (`/api/cybervault/*`)
- subagent-frontend-state (hooks de recursos)
- subagent-testing (mocks de repositórios)
