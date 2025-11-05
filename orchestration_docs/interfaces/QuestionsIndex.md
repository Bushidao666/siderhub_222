# Interface: Questions Index Snapshot

## Localização
`.agents/state/questions-index.json`

## Definição
```json
{
  "questions": [
    { "id": "q-...", "status": "waiting|answered", "to": "...", "from": "...", "timestamp": "<ISO>" }
  ],
  "generated_at": "<ISO>"
}
```

## Produzido Por
- [questions-index-builder](../services/questions-index-builder.md)

## Consumido Por
- [sla-watch](../services/sla-watch.md)
- Painéis e status

