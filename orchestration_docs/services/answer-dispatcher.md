# Service: answer-dispatcher

## Localização
`.agents/bin/answer-dispatcher.sh`

## Propósito
Converter itens do `answer-queue.jsonl` em mensagens de `resume` para o agente owner, anexando um contexto resumido gerado por `context-builder.sh`.

## Entradas
- `coordination/answer-queue.jsonl`

## Saídas
- `coordination/resume-queue.jsonl` (payload: `{agent, message}`)
- `coordination/general.jsonl` (`routing`)
- `coordination/dead-letters/answer-queue.dl.jsonl`
- `state/answer-dispatcher.state`

## Lógica
1. Lê incrementalmente o `answer-queue`.
2. Monta contexto com `.agents/bin/context-builder.sh <owner> <qid> <from> <question>`.
3. Publica em `resume-queue` e registra em `general`.

## Relacionamentos
- Consome: [dispatch-questions](./dispatch-questions.md)
- Produz: [JSONL_ResumeQueue](../interfaces/JSONL_ResumeQueue.md)

