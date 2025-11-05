# Interface: Progress Snapshot (por subagent)

## Localização
`.agents/progress/subagent-*.json`

## Definição
```json
{
  "agent": "subagent-...",
  "status": "working|completed|blocked|unknown",
  "phase": "initializing|resuming|...",
  "current_task": "<descrição curta>",
  "progress_percentage": 0,
  "tasks_completed": [],
  "tasks_remaining": [],
  "files_created": [],
  "files_modified": [],
  "blocked_by": null,
  "started_at": "<ISO>",
  "last_updated": "<ISO>"
}
```

## Propósito
Snapshot do andamento de cada subagente, lido por múltiplos serviços.

## Produzido/Atualizado Por
- [spawn-subagent](../utilities/spawn-subagent.md)
- Subagentes (via ações próprias)
- [detect-completions](../utilities/detect-completions.md)

## Consumido Por
- [detect-completions](../utilities/detect-completions.md)
- [plan-sync](../services/plan-sync.md)
- [autopilot-loop](../services/autopilot-loop.md)
- [wait-for-deps](../utilities/wait-for-deps.md)

