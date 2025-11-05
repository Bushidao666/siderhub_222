# Service: ai-answerer

## Localização
`.agents/bin/ai-answerer.sh`

## Propósito
Responder automaticamente perguntas enfileiradas em `ai-answer-queue.jsonl` usando Codex, com contexto de projeto, publicando rascunho para revisão ou resposta final diretamente.

## Entradas
- `coordination/ai-answer-queue.jsonl`
- Contexto: `.agents/bin/context-builder.sh` (plan, architecture, decisions, logs, progress)

## Saídas
- Drafts → `coordination/review-queue.jsonl`
- Finais → `coordination/answers.jsonl`
- `coordination/general.jsonl` (eventos `ai-draft-for-review`/`ai-answered`)
- `coordination/dead-letters/ai-answer-queue.dl.jsonl`
- `state/ai-answerer.state`

## Lógica
1. Obtém owner da pergunta (campo `to` em `questions.jsonl`).
2. Gera prompt com regras de segurança (ex.: sensíveis ⇒ `mode=draft`).
3. Executa Codex (`--experimental-json`), extrai último JSON válido.
4. Publica `draft` no `review-queue` ou resposta final em `answers`.

## Observações
- Fallback: se não conseguir extrair JSON válido, gera resposta de baixa confiança e envia draft se `needs_review=true`.

