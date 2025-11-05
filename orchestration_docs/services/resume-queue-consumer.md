# Service: resume-queue-consumer

## Localização
`.agents/bin/resume-queue-consumer.sh`

## Propósito
Consumir `resume-queue.jsonl` e encaminhar mensagens aos subagentes correspondentes através de `resume-subagent.sh`.

## Entradas
- `coordination/resume-queue.jsonl`

## Saídas
- Logs em `.agents/logs/resume-queue-consumer-actions.log`
- `state/resume-queue.state`

## Lógica
1. Leitura incremental; por item `{agent, message}` executa `resume-subagent.sh <agent> <message>`.
2. Mantém posição por número de linha.

## Relacionamentos
- Integra com: [resume-subagent](../utilities/resume-subagent.md)

