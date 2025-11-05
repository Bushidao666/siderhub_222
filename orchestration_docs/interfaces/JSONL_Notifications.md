# Interface: Notifications JSONL Entry

## Localização
`.agents/coordination/notifications.jsonl`

## Definição (shape esperado por linha)
```json
{
  "from": "<emissor>",
  "type": "blocker|status|sla-reminder|daemon-restart|info|progress",
  "message": "<texto>",
  "details": "<texto opcional>",
  "timestamp": "<ISO 8601>",
  "question_id": "q-..." // opcional
}
```

## Propósito
Canal de eventos e alertas do sistema (SLA, bloqueios, reinícios de daemons, etc.).

## Produzido Por
- [watchdog](../services/watchdog.md) (`daemon-restart`)
- [sla-watch](../services/sla-watch.md) (`sla-reminder`)
- [blocker-watcher](../services/blocker-watcher.md) (`blocker-auto`, `blocker-routing`)
- [autopilot-loop](../services/autopilot-loop.md) (`autopilot` via General; status diversos)
- [notify.sh](../utilities/notify.md)

## Consumido Por
- [blocker-watcher](../services/blocker-watcher.md)
- [threads-sync](../services/threads-sync.md)
- Painéis/monitoramento (`status.sh`, `monitor.sh`)

