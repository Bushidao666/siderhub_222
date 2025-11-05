# Utility: notify.sh

## Localização
`.agents/bin/notify.sh`

## Propósito
Publicar eventos no canal `notifications.jsonl` (SLA, blockers, progresso, info).

## Uso
```bash
.agents/bin/notify.sh <from> <type> <message> [details]
.agents/bin/notify.sh subagent-testing blocker "Aguardando subagent-backend-api"
```

## Saídas
- Linha JSON em `coordination/notifications.jsonl`.

