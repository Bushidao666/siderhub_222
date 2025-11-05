# Interface: AI Answer Queue Entry

## Localização
`.agents/coordination/ai-answer-queue.jsonl`

## Definição
```json
{
  "question_id": "q-...",
  "from": "<origin-agent>",
  "question": "<texto>",
  "timestamp": "<ISO>",
  "needs_review": true
}
```

## Produzido Por
- [dispatch-questions](../services/dispatch-questions.md) (heurística segura/sensível)

## Consumido Por
- [ai-answerer](../services/ai-answerer.md)

