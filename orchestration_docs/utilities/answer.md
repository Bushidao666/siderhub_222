# Utility: answer.sh

## Localização
`.agents/bin/answer.sh`

## Propósito
Publicar uma resposta final para um `question_id` em `answers.jsonl`.

## Uso
```bash
.agents/bin/answer.sh <from> <question_id> <answer>
# Exemplo
.agents/bin/answer.sh subagent-backend-api q-1699999999-123 "Contrato do endpoint atualizado em src/routes/..."
```

## Saídas
- Linha JSON em `answers.jsonl`.

