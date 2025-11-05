# Service: plan-sync

## Localização
`.agents/bin/plan-sync.sh`

## Propósito
Consolidar progresso dos subagentes e refletir um snapshot de plano em `state/plan.json` e dentro de `shared-context/execution-plan.md` entre marcadores.

## Entradas
- `.agents/progress/subagent-*.json`
- `.agents/state/questions-index.json` (para contagens waiting/answered, quando disponível)

## Saídas
- `.agents/state/plan.json`
- Atualização seções `<!-- plan:generated:start --> ... <!-- plan:generated:end -->` em `shared-context/execution-plan.md`
- Eventos em `coordination/general.jsonl` (`status`)
- `state/plan-sync.state` (assinatura e mapa de status anterior)

## Lógica
1. Lê progresso e compõe linhas “`agent: status pct% | task`”.
2. Calcula assinatura e compara com anterior para decidir log.
3. Atualiza JSON e bloco renderizado em `execution-plan.md`.

