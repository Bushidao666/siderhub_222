# Utility: ask.sh

## Localização
`.agents/bin/ask.sh`

## Propósito
Criar uma nova pergunta em `coordination/questions.jsonl`.

## Uso
```bash
.agents/bin/ask.sh <from> <to> <question> [priority]
# Exemplo
.agents/bin/ask.sh subagent-frontend-components subagent-backend-api "Preciso do contrato do endpoint X" high
```

## Saídas
- Linha JSON em `questions.jsonl` com `status=waiting`.

