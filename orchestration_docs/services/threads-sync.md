# Service: threads-sync

## Localização
`.agents/bin/threads-sync.sh`

## Propósito
Construir linhas do tempo por pergunta (`coordination/threads/q-*.jsonl`) agregando eventos de Questions, Answers, Notifications e General.

## Entradas
- `coordination/questions.jsonl`
- `coordination/answers.jsonl`
- `coordination/notifications.jsonl`
- `coordination/general.jsonl`

## Saídas
- `coordination/threads/<question_id>.jsonl` (ordenado por `timestamp`)

## Lógica
1. Carrega e normaliza eventos (ignora linhas inválidas).
2. Extrai `question_id` de campos/regex.
3. Ordena por `timestamp` e grava por arquivo.

