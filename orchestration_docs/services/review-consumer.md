# Service: review-consumer

## Localização
`.agents/bin/review-consumer.sh`

## Propósito
Encaminhar rascunhos gerados pela IA para o owner revisar e publicar.

## Entradas
- `coordination/review-queue.jsonl`

## Saídas
- `coordination/resume-queue.jsonl` (mensagem ao owner)
- `coordination/general.jsonl` (`review-requested`)
- `coordination/dead-letters/review-queue.dl.jsonl`
- `state/review-consumer.state`

## Lógica
1. Lê drafts, identifica `owner` e `question_id`.
2. Envia mensagem de resumo ao owner (via resume-queue) com o draft.

