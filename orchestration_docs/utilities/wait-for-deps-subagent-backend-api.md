# Utility: wait-for-deps-subagent-backend-api.sh

## Localização
`.agents/bin/wait-for-deps-subagent-backend-api.sh`

## Propósito
Watcher específico para `subagent-backend-api` aguardar `subagent-database` e `subagent-backend-business-logic`.

## Saídas
- Notificações (`blocker`, `info`, `progress`)
- Enfileira mensagem em `resume-queue.jsonl` quando pronto.

