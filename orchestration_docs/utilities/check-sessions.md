# Utility: check-sessions.sh

## Localização
`.agents/bin/check-sessions.sh`

## Propósito
Detectar se existem sessões ativas (arquivos JSON em `.agents/sessions`) e retornar exit code apropriado.

## Uso
```bash
.agents/bin/check-sessions.sh [--report]
# exit 0: nenhuma sessão; 1: sessões detectadas
```

