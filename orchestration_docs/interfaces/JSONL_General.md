# Interface: General JSONL Entry

## Localização
`.agents/coordination/general.jsonl`

## Definição (shape esperado por linha)
```json
{
  "from": "<emissor>",
  "type": "ack|routing|ai-enqueue|ai-answered|review-requested|autopilot|status",
  "message": "<texto>",
  "timestamp": "<ISO 8601>"
}
```

## Propósito
Canal de log leve e informativo sobre roteamentos, enfileiramentos, avisos do autopilot e status curtos.

## Produzido Por (exemplos)
- [dispatch-questions](../services/dispatch-questions.md) (`ack`, `ai-enqueue`)
- [ai-answerer](../services/ai-answerer.md) (`ai-answered`)
- [review-consumer](../services/review-consumer.md) (`review-requested`)
- [plan-sync](../services/plan-sync.md) (`status`)
- [autopilot-loop](../services/autopilot-loop.md) (`autopilot`)

