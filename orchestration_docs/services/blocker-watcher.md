# Service: blocker-watcher

## Localização
`.agents/bin/blocker-watcher.sh`

## Propósito
Observar `notifications.jsonl` por mensagens de bloqueio e tomar ações automáticas (instruções de contorno ou roteamento para dependências).

## Entradas
- `coordination/notifications.jsonl` (tipo `blocker`)

## Saídas
- `coordination/general.jsonl` (`blocker-auto`, `blocker-routing`)
- `coordination/resume-queue.jsonl` (mensagens direcionadas)
- `state/blocker-watcher.state`

## Regras Específicas
- Contém “prisma” → autoriza instalação local e migrations (mensagem automática).
- Contém “DATABASE_URL” → instruções de configuração local temporária.
- Contém “aguardando subagent-<x>” → notifica <x> para priorizar/ajudar.

