# Service: autopilot-loop

## Localização
`.agents/bin/autopilot-loop.sh`

## Propósito
Executar iterações de análise/ação para o agente `subagent-main-autopilot`, consumindo progresso e eventos para decidir respostas, resumes e ações (nudge, spawn, ask, notify), orquestrando o avanço global.

## Entradas
- Sessão: `.agents/sessions/subagent-main-autopilot.json`
- Progresso: `.agents/progress/subagent-*.json` (via [detect-completions](../utilities/detect-completions.md))
- Perguntas pendentes/índice: [questions-auto-intake](../utilities/questions-auto-intake.md), `state/questions-index.json`
- Notificações/General: caudas recentes para contexto
- Dependências: `.agents/shared-context/dependencies.json`

## Saídas
- Respostas: `.agents/bin/answer.sh` → `answers.jsonl`
- Resumes: `.agents/bin/resume-subagent.sh` ou enqueue `resume-queue.jsonl`
- Ações: `nudge-all`, `spawn-subagent`, `notify`, `ask`, `enqueue-resume`
- Estado/Métricas: `state/autopilot-state.json`, `state/autopilot-metrics.json`, logs em `.agents/logs/autopilot.log`

## Lógica de Alto Nível
1. Monta contexto com snapshot de progresso, newly-completed, notificações e general (tail), além de análise Python (stalled/dead sessions, dependências prontas, blockers resolvidos, prontos a iniciar).
2. Envia contexto via `codex ... resume <session_id>` e captura `agent_message` JSON.
3. Executa respostas e resumes; aplica de-duplicação por TTL via `autopilot-actions.state.json`.
4. Atualiza estado e métricas; dorme `AUTOPILOT_INTERVAL` segundos.

## Observações
- Robusto a falhas de parsing e vazio (iterações são puladas com logs claros).

