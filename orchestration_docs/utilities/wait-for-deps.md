# Utility: wait-for-deps.sh

## Localização
`.agents/bin/wait-for-deps.sh`

## Propósito
Aguardar que um conjunto de subagentes marquem `status=completed` em seus progressos, com tentativas e notificações periódicas.

## Parâmetros
- `MAX_ATTEMPTS` (default 60), intervalo fixo 30s.

## Saídas
- Notificações (`blocker`/`progress`) via [notify](./notify.md)
- Exit code 0 quando pronto; 1 quando timeout.

