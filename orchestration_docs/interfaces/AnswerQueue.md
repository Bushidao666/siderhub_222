# Interface: Answer Queue Entry

## Localização
`.agents/coordination/answer-queue.jsonl`

## Definição
```json
{
  "owner": "subagent-...",
  "question_id": "q-...",
  "from": "<origin-agent>",
  "question": "<texto>",
  "timestamp": "<ISO>"
}
```

## Produzido Por
- [dispatch-questions](../services/dispatch-questions.md)

## Consumido Por
- [answer-dispatcher](../services/answer-dispatcher.md)

