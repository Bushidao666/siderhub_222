# Utility: coordination-cleanup.sh

## Localização
`.agents/bin/coordination-cleanup.sh`

## Propósito
Sanear um arquivo JSONL (ex.: `questions.jsonl`) separando objetos colados `}{` em linhas distintas e filtrando inválidos.

## Uso
```bash
.agents/bin/coordination-cleanup.sh .agents/coordination/questions.jsonl
```

## Saídas
- Arquivo de backup (`*.bak.<epoch>`)
- Válidos regravados no destino; inválidos em `dead-letters/cleanup.dl.jsonl`.

