# Service: questions-index-builder

## Localização
`.agents/bin/questions-index-builder.sh`

## Propósito
Construir índice `state/questions-index.json` com status por `question_id` (`waiting|answered`) cruzando `questions.jsonl` e `answers.jsonl`.

## Entradas
- `coordination/questions.jsonl`
- `coordination/answers.jsonl`

## Saídas
- `state/questions-index.json`

## Lógica
1. Carrega todas perguntas (marca `waiting`).
2. Para cada resposta, marca correspondente como `answered`.
3. Emite snapshot com `generated_at`.

