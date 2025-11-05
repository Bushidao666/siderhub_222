# Interfaces: State Files (serviços)

Serviços mantêm curso/posição de leitura, assinaturas e caches em `.agents/state/*.state|*.json`.

## Padrões
- Contador de linhas: arquivos `*.state` contendo número da última linha processada (ex.: `ai-answerer.state`, `answer-dispatcher.state`, `dispatch-questions.state`, `review-consumer.state`, `resume-queue.state`).
- Assinatura de snapshot: `plan-sync.state` (JSON com `signature`, contagens e mapa de status).
- Carimbo de cooldown: `watchdog_last_<daemon>.ts` (epoch seconds).
- Métricas/telemetria: `autopilot-metrics.json`, `autopilot-state.json`.

## Exemplos
```text
.agents/state/
  ai-answerer.state                 # última linha lida de ai-answer-queue
  answer-dispatcher.state           # última linha lida de answer-queue
  dispatch-questions.state          # última linha lida de questions
  review-consumer.state             # última linha lida de review-queue
  resume-queue.state                # última linha lida de resume-queue
  plan-sync.state                   # assinatura + mapa de status por agente
  watchdog_last_*.ts                # cooldown de restart por daemon
  autopilot-state.json              # último status conhecido por agente
  autopilot-metrics.json            # contadores da última iteração
```

