# Utility: clean.sh

## Localização
`.agents/bin/clean.sh`

## Propósito
Encerrar processos relacionados a `.agents/bin`, limpar diretórios temporários/estaduais e zerar filas mantendo arquivos.

## Ações
- `pkill -f '.agents/bin/'` e do Codex exec.
- Remove e recria: `pids`, `tmp`, `sessions`, `progress`, `state`, `logs`.
- Zera: `notifications.jsonl`, `general.jsonl`, `questions.jsonl`, `answers.jsonl`, `resume-queue.jsonl`, `ai-answer-queue.jsonl`, `review-queue.jsonl`, `answer-queue.jsonl`.

