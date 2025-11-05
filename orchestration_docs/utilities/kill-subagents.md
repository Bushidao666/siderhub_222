# Utility: kill-subagents.sh

## Localização
`.agents/bin/kill-subagents.sh`

## Propósito
Encerrar todos os processos relacionados a `.agents/bin`, respeitando TERM → KILL e limpando pidfiles órfãos.

## Ações
- Finaliza `watchdog` primeiro para evitar respawn.
- Varre pidfiles e padrões comuns de loops (`plan-sync`, `threads-sync`, etc.).
- Lista remanescentes para auditoria.

