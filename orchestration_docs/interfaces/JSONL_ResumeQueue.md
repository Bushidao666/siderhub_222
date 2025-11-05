# Interface: Resume Queue JSONL Entry

## Localização
`.agents/coordination/resume-queue.jsonl`

## Definição (shape esperado por linha)
```json
{
  "agent": "subagent-...",
  "message": "<texto a ser enviado ao agente>",
  "timestamp": "<ISO 8601>" // opcional
}
```

## Propósito
Fila de mensagens para retomar agentes (via Codex resume). Consumida por `resume-queue-consumer.sh`.

## Produzido Por
- [answer-dispatcher](../services/answer-dispatcher.md)
- [review-consumer](../services/review-consumer.md)
- [sla-watch](../services/sla-watch.md)
- [blocker-watcher](../services/blocker-watcher.md)
- [autopilot-loop](../services/autopilot-loop.md) (ações `resumes`/`enqueue-resume`)

## Consumido Por
- [resume-queue-consumer](../services/resume-queue-consumer.md)

