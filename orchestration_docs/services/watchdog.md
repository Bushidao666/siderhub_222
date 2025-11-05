# Service: watchdog

## Localização
`.agents/bin/watchdog.sh`

## Propósito
Garantir que os daemons essenciais estejam em execução, reiniciando-os com cooldown e registrando reinícios.

## Monitora/Inicia
- `monitor`, `dispatch-questions`, `resume-queue-consumer`, `blocker-watcher`, `dashboard`,
  `answer-dispatcher`, `questions-index` (loop), `sla-watch`, `ai-answerer`, `review-consumer`,
  `plan-sync` (loop), `threads-sync` (loop)

## Entradas
- `state/watchdog_last_<daemon>.ts` (cooldown por daemon)

## Saídas
- `coordination/notifications.jsonl` (`daemon-restart`)

