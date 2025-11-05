# Utility: nudge-all.sh

## Localização
`.agents/bin/nudge-all.sh`

## Propósito
Enviar mensagens padronizadas de "nudge" (cobrança de atualização) para todos os subagentes com sessão registrada.

## Entradas
- `.agents/sessions/*.json`

## Ações
- Para cada agente conhecido, envia `resume-subagent.sh <agent> <mensagem>`.

