# Schema cybervault

## Visão Geral
- Biblioteca de recursos digitais com categorização, tags e controle de visibilidade/downloads.
- Usa enum `ResourceType` e `Visibility` (reaproveitado do domínio academy).
- Tabelas pensadas para consultas por filtros (categoria, tags, featured) e tracking de downloads.

## Tabelas

### `cybervault.resource_categories`
- **PK**: `id` (`uuid`).
- **Campos**: `name`, `description`, `icon`, `order`, `created_at`.
- **Relacionamentos**: 1:N com `resources`.
- **Uso**: estrutura de navegação e filtros primários.

### `cybervault.resource_tags`
- **PK**: `id` (`uuid`); **Unique**: `name`.
- **Relacionamentos**: N:M com `resources` via `resource_tag_assignments`.
- **Uso**: sistema de tags para busca avançada.

### `cybervault.resources`
- **PK**: `id` (`uuid`); **Unique**: `slug`.
- **Campos**: `title`, `description`, `type`, `category_id`, `thumbnail_url`, `visibility`, `featured`, `download_count`, `view_count`, `created_by_id`, timestamps.
- **Índices**: `category_id`, `visibility`, `created_by_id`, `featured` (suporte a listagens destacadas no Hub).
- **Relacionamentos**: N:1 com `resource_categories` (`Restrict`) e `core.users` (autor); 1:N com `resource_assets`, `resource_download_logs`; N:M com `resource_tags` via join.
- **Uso**: card principal para listagens e busca; contadores alimentam métricas exibidas no hub/admin.

### `cybervault.resource_tag_assignments`
- **PK**: composto `(resource_id, tag_id)`.
- **Relacionamentos**: N:1 com `resources` (cascade) e `resource_tags` (cascade).
- **Uso**: join table simples, permitindo filtros por múltiplas tags.

### `cybervault.resource_assets`
- **PK**: `id` (`uuid`).
- **Campos**: `resource_id`, `file_url`, `file_name`, `mime_type`, `size_bytes`, `created_at`.
- **Relacionamentos**: N:1 com `resources` (cascade).
- **Uso**: metadados de anexos (S3) para recursos que possuem múltiplos arquivos.

### `cybervault.resource_download_logs`
- **PK**: `id` (`uuid`).
- **Campos**: `resource_id`, `user_id`, `downloaded_at`, `ip_address` (tipo `inet`).
- **Relacionamentos**: N:1 com `resources` e `core.users` (ambos cascade).
- **Uso**: auditoria e métricas de engajamento (quem baixou, quando, de onde).

## Notas
- `visibility` reutiliza enum global para manter coerência com Academy/Admin.
- Índices em `category_id`, `visibility`, `created_by_id` facilitam filtros no admin e no hub.
