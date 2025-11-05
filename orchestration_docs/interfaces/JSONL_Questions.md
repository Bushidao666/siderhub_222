# Interface: Questions JSONL Entry

## Localização
`.agents/coordination/questions.jsonl`

## Definição (shape esperado por linha)
```json
{
  "id": "q-<epoch>-<pid>",
  "from": "<origin-agent>",
  "to": "<target-agent>",
  "question": "<texto ou payload>",
  "priority": "high|normal|low",
  "timestamp": "<ISO 8601>",
  "status": "waiting|answered"
}
```

## Propósito
Solicitar trabalho/resposta de um agente de destino. É o ponto de entrada do fluxo.

## Campos
- `id` (string, ✅): identificador único gerado por `.agents/bin/ask.sh`.
- `from` (string, ✅): agente originador (ex.: `subagent-main-autopilot`).
- `to` (string, ✅): agente de destino (ex.: `subagent-backend-api` ou `main-orchestrator`).
- `question` (string|obj, ✅): conteúdo do pedido.
- `priority` (string, ❌): prioridade; padrão `high`.
- `timestamp` (string ISO, ✅): data/hora de criação.
- `status` (string, ✅): `waiting` até ser respondida.

## Usado Por
- Serviços: [dispatch-questions](../services/dispatch-questions.md), [questions-index-builder](../services/questions-index-builder.md), [sla-watch](../services/sla-watch.md), [threads-sync](../services/threads-sync.md)
- Utilitários: [ask.sh](../utilities/ask.md)

## Produzido Por
- `.agents/bin/ask.sh`

## Observações
- `status` é atualizado para `answered` por `autopilot-loop`/`questions-index-builder` quando existe uma entrada correspondente em `answers.jsonl`.

