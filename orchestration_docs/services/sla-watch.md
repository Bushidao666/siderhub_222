# Service: sla-watch

## Localização
`.agents/bin/sla-watch.sh`

## Propósito
Aplicar lembretes de SLA para perguntas `waiting` há mais de `HIGH_SLA_MIN` minutos e relembrar a cada `SLA_REMINDER_INTERVAL_MIN`.

## Entradas
- `state/questions-index.json`

## Saídas
- `coordination/notifications.jsonl` (`sla-reminder`)
- `coordination/resume-queue.jsonl` (mensagem ao owner)
- `state/sla-watch.state` (cache de últimos lembretes por pergunta)

## Lógica
1. Itera perguntas `waiting`, calcula idade em minutos.
2. Se passou do limite e da janela de reenvio, notifica e envia resume ao owner.

