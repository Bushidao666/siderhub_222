# Utility: detect-completions.sh

## Localização
`.agents/bin/detect-completions.sh`

## Propósito
Ler `.agents/progress/*` e produzir JSON `{ progress: {<agent>: {status, progress_percentage, ...}} }`.

## Usado Por
- [autopilot-loop](../services/autopilot-loop.md)

