# Service: monitor

## Localização
`.agents/bin/monitor.sh`

## Propósito
Loop de monitoramento textual no terminal: pendências, blockers e resumo de progresso.

## Entradas
- `coordination/questions.jsonl`
- `coordination/notifications.jsonl`
- `.agents/progress/subagent-*.json`

## Saídas
- STDOUT (para visualização humana)

