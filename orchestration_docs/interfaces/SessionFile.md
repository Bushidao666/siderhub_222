# Interface: Session File (por subagent)

## Localização
`.agents/sessions/<agent>.json`

## Definição
```json
{
  "session_id": "<uuid>",
  "pid": 12345,           // opcional em alguns casos
  "started_at": "<ISO>",
  "prompt_path": "<path>" // opcional
}
```

## Propósito
Persistir o identificador de sessão Codex e metadados do processo do subagente.

## Produzido Por
- [spawn-subagent](../utilities/spawn-subagent.md)
- [start-autopilot](../utilities/start-autopilot.md)

## Consumido Por
- [resume-subagent](../utilities/resume-subagent.md)
- [autopilot-loop](../services/autopilot-loop.md)

