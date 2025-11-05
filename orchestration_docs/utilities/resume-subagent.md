# Utility: resume-subagent.sh

## Localização
`.agents/bin/resume-subagent.sh`

## Propósito
Enviar um prompt de retomada para um subagente Codex existente, enriquecendo com trechos do estado/progresso.

## Uso
```bash
.agents/bin/resume-subagent.sh <agent-id> "Mensagem"
# ou via STDIN
echo "Mensagem" | .agents/bin/resume-subagent.sh <agent-id>
```

## Entradas
- `.agents/sessions/<agent>.json` (session_id)
- `.agents/state/<agent>.json` (opcional; será atualizado)
- `.agents/progress/<agent>.json` (resumo no contexto)

## Saídas
- Logs em `.agents/logs/<agent>.log`
- Atualização de `.agents/state/<agent>.json` (campos `last_resume_*`)

