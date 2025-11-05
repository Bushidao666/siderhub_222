# Service: dispatch-questions

## Localização
`.agents/bin/dispatch-questions.sh`

## Propósito
Ler novas perguntas em `questions.jsonl`, emitir ACK em `general.jsonl`, distribuir para a fila do owner (`answer-queue.jsonl`) e — conforme heurísticas — enfileirar também para resposta assistida por IA (`ai-answer-queue.jsonl`).

## Entradas
- `coordination/questions.jsonl` (linhas novas; JSON válido)

## Saídas
- `coordination/general.jsonl` (`ack`, `ai-enqueue`)
- `coordination/answer-queue.jsonl` (owner-first)
- `coordination/ai-answer-queue.jsonl` (quando permitido)
- `coordination/dead-letters/questions.dl.jsonl` (linhas inválidas)
- `state/dispatch-questions.state` (última linha processada)

## Lógica
1. Varre incrementalmente `questions.jsonl` a partir de `state/dispatch-questions.state`.
2. Valida JSON por linha; inválido vai para dead-letters.
3. Para `status=waiting`:
   - Emite ACK no canal `general`.
   - Enfileira no `answer-queue` com `owner` (campo `to` ou `main-orchestrator`).
   - Heurística de IA:
     - “Segura” (onde/qual caminho/file/docs/exemplo/how to/types…) → enfileira em `ai-answer-queue`.
     - “Sensível” (migrate/drop/delete/secrets/token/database_url/prisma/rm -rf/kill/merge/rebase) → enfileira com `needs_review=true`.

## Erros e Robustez
- Linhas não-JSON são isoladas em `dead-letters`.
- Processamento idempotente via marcador de linha.

## Relacionamentos
- Produz: [JSONL_ResumeQueue](../interfaces/JSONL_ResumeQueue.md) via [answer-dispatcher](./answer-dispatcher.md)
- Consome: [JSONL_Questions](../interfaces/JSONL_Questions.md)

