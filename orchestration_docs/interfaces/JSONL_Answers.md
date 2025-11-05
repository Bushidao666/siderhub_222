# Interface: Answers JSONL Entry

## Localização
`.agents/coordination/answers.jsonl`

## Definição (shape esperado por linha)
```json
{
  "question_id": "q-...",
  "from": "<origin-agent>",
  "answer": "<texto ou payload>",
  "confidence": 0.0,
  "citations": ["path/a", "path/b"],
  "mode": "final|draft",
  "timestamp": "<ISO 8601>"
}
```

## Propósito
Publicar a resposta final de um agente para uma pergunta `q-*`.

## Campos
- `question_id` (string, ✅): ID da pergunta associada.
- `from` (string, ✅): agente que respondeu (ex.: `ai-responder`, `subagent-main-autopilot`).
- `answer` (string|obj, ✅): resposta.
- `confidence` (number, ❌): 0..1 (heurístico, default 0.6).
- `citations` (string[], ❌): caminhos de arquivos citados.
- `mode` (string, ❌): `final` ou `draft`.
- `timestamp` (string ISO, ✅): data/hora de publicação.

## Produzido Por
- [ai-answerer](../services/ai-answerer.md) quando `mode=final`.
- [autopilot-loop](../services/autopilot-loop.md) via `.agents/bin/answer.sh`.

## Consumido Por
- [questions-index-builder](../services/questions-index-builder.md)
- [threads-sync](../services/threads-sync.md)
- [autopilot-loop](../services/autopilot-loop.md) (para sincronizar estados)

