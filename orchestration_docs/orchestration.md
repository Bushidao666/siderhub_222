
---

# 🧠 Orquestração de Agents (Workspace .agents)

Esta seção documenta o sistema de orquestração baseado em arquivos JSONL e daemons Bash em `.agents/bin`. Ele coordena perguntas/respostas entre subagentes Codex, sincroniza progresso, aplica SLAs e mantém resiliência via watchdog.

## Fluxo Geral

```mermaid
flowchart TD
  Q[questions.jsonl] --> DQ[dispatch-questions]
  DQ --> AQ[answer-queue.jsonl]
  DQ --> AIQ[ai-answer-queue.jsonl]
  AIQ --> AIAI[ai-answerer]
  AIAI -->|draft| REVIEW[review-queue.jsonl]
  AIAI -->|final| ANSWERS[answers.jsonl]
  REVIEW --> RC[review-consumer] --> RESUMEQ[resume-queue.jsonl]
  AQ --> AD[answer-dispatcher] --> RESUMEQ
  RESUMEQ --> RQC[resume-queue-consumer] --> SUBS[Subagents Codex]
  SUBS --> PROG[.agents/progress/*]
  PROG --> DET[detect-completions]
  DET --> ALOOP[autopilot-loop]
  ALOOP --> ACTS[nudge/ask/spawn/notify]
  PROG --> PLAN[plan-sync]
  QIB[questions-index-builder] --> QIDX[questions-index.json]
  QIDX --> SLA[sla-watch] --> RESUMEQ
  NOTIF[notifications.jsonl] --> BW[blocker-watcher] --> RESUMEQ
  WD[watchdog] -->|garante| {Daemons}
```

Componentes principais e documentação:
- Serviços: veja `.agents/shared-context/architecture/orchestration/services/`
- Utilitários: veja `.agents/shared-context/architecture/orchestration/utilities/`
- Interfaces JSONL/estado: veja `.agents/shared-context/architecture/orchestration/interfaces/`

## Canais e Contratos
- Questions: `coordination/questions.jsonl` — pedidos de trabalho entre agentes
- Answers: `coordination/answers.jsonl` — respostas publicadas
- General: `coordination/general.jsonl` — eventos informativos
- Notifications: `coordination/notifications.jsonl` — alertas (SLA, blockers)
- Resume Queue: `coordination/resume-queue.jsonl` — mensagens para retomar agentes

Esquemas detalhados em `architecture/orchestration/interfaces/*`.

## Resiliência e Observabilidade
- Watchdog reinicia daemons com cooldown e registra `daemon-restart` em `notifications.jsonl`.
- Plan-sync mantém snapshot em `state/plan.json` e injeta sumário em `shared-context/execution-plan.md`.
- Threads-sync consolida timeline por pergunta em `coordination/threads/*.jsonl`.

## Operação
- Bootstrap: `make agents-bootstrap` ou `make agents-daemons-bg` + `make agents-spawn`
- Limpeza: `.agents/bin/clean.sh`
- Status: `.agents/bin/status.sh`

Mais detalhes por serviço/utility nos módulos dedicados.