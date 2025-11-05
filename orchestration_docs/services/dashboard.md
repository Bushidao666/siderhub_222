# Service: dashboard

## Localização
`.agents/bin/dashboard.sh`

## Propósito
Gerar snapshots periódicos chamando `status.sh` e registrar em `.agents/logs/dashboard-snapshots.log`.

## Entradas
- Estado atual do workspace (indireto)

## Saídas
- `.agents/logs/dashboard-snapshots.log`

