# Utility: context-builder.sh

## Localização
`.agents/bin/context-builder.sh`

## Propósito
Gerar um bloco de contexto consolidado (plan, architecture, decisões, progresso e logs do owner) para embutir em prompts.

## Entradas
- `owner`, `question_id`, `from`, `question`

## Saídas
- Texto estruturado com cabeçalhos e trechos relevantes.

## Usado Por
- [answer-dispatcher](../services/answer-dispatcher.md)
- [ai-answerer](../services/ai-answerer.md)

