# Utility: spawn-subagent.sh

## Localização
`.agents/bin/spawn-subagent.sh`

## Propósito
Inicializar um subagente Codex com prompt dedicado, garantindo arquivos de `progress` e `state`, e capturar `session_id`.

## Uso
```bash
.agents/bin/spawn-subagent.sh subagent-backend-api
```

## Entradas
- `.agents/prompts/<agent>.md` (prompt requerido)

## Saídas
- `.agents/logs/<agent>.log`
- `.agents/pids/<agent>.pid`
- `.agents/sessions/<agent>.json`
- `.agents/progress/<agent>.json` (inicializado/ajustado)
- `.agents/state/<agent>.json` (inicializado/ajustado)

## Observações
- Tenta `codex` CLI; se ausente, roda um simulador de progresso.

