# Interface: Review Queue Entry

## Localização
`.agents/coordination/review-queue.jsonl`

## Definição
```json
{
  "question_id": "q-...",
  "owner": "subagent-...",
  "from": "ai-responder",
  "draft_answer": "<texto>",
  "confidence": 0.7,
  "citations": ["..."] ,
  "timestamp": "<ISO>"
}
```

## Produzido Por
- [ai-answerer](../services/ai-answerer.md) quando `mode=draft` ou `needs_review=true`.

## Consumido Por
- [review-consumer](../services/review-consumer.md)

