# Hidra Wizard — Fluxo de Campanhas

## Arquivos
- Página principal: `src/frontend/pages/Hidra/Wizard.tsx`
- Componentes de etapa: `src/frontend/components/hidra/wizard/{SegmentSelector,TemplateEditor,ScheduleReview}.tsx`
- Hooks de dados: `src/frontend/hooks/useHidraSegments.ts`, `src/frontend/hooks/useHidraTemplates.ts`
- Serviço: `src/frontend/services/hidraService.ts`

## Visão Geral
Fluxo multi-etapas que guia o usuário na criação de campanhas do Hidra consumindo dados reais:
1. Seleção do segmento (`ContactSegment`) vindo de `/hidra/segments` via React Query
2. Escolha e customização básica do template (`MessageTemplate`) retornado por `/hidra/templates`
3. Agendamento e revisão final antes de enviar `CreateCampaignPayload` para `hidraService.createCampaign`

O wizard invalida `queryKeys.hidra.dashboard()` e `queryKeys.hidra.campaignStats()` ao concluir uma campanha e exibe feedback visual neon (glow + badges).

## Stepper & Navegação
- `steps`: `segment`, `template`, `schedule`
- Indicador visual: `data-testid="hidra-wizard-stepper"`
- Botões de navegação: `hidra-wizard-back`, `hidra-wizard-next`
- Sucesso: `hidra-wizard-success`
- Conteúdo ativo: `hidra-wizard-content`

`canProceed` garante seleção válida antes de avançar. `Voltar` fica disponível em todas as etapas (desabilitado durante submissão).

## Etapas

### SegmentSelector
- Component: `SegmentSelector`
- Test IDs: `hidra-segment-list`, `hidra-segment-loading`, `hidra-segment-error`, `hidra-segment-empty`, `hidra-segment-{segmentId}`
- Mostra cards clicáveis com nome, descrição, total de contatos e origem (`CSV Upload`, `Manual`, `API`)
- Estados: skeleton (quatro placeholders), erro com botão `hidra-segment-retry`, vazio com mensagem orientativa
- Props principais: `segments`, `selectedSegmentId`, `onSelect`, `loading`, `error`

### TemplateEditor
- Component: `TemplateEditor`
- Test IDs: `hidra-template-editor`, `hidra-template-loading`, `hidra-template-error`, `hidra-template-empty`, `hidra-template-{templateId}`, `hidra-template-preview`, `hidra-template-preview-body`
- Lista templates com título, preview da mensagem e variáveis (`template.variables`).
- Seleção ativa aplica glow/outlined, com `aria-pressed`.
- Permite ajustar texto da mensagem (pré-visualização) antes da revisão final.
- Estados: skeleton, erro com `hidra-template-retry`, vazio orientando configuração na Evolution API.

### ScheduleReview
- Component: `ScheduleReview`
- Test IDs de formulário: `hidra-schedule-review`, `hidra-schedule-name`, `hidra-schedule-description`, `hidra-schedule-max-rate`, `hidra-schedule-datetime`, `hidra-schedule-external-id`
- Resumo: `hidra-review-segment`, `hidra-review-template`, prévia de mensagem (usa `messagePreview`)
- Submissão: botão `hidra-schedule-submit` (usa `createCampaignMutation`) e erro `hidra-schedule-error`
- Validação: exige `form.name`, `selectedSegment` e `selectedTemplate`

## Fluxo de Dados
- Hooks React Query (`useHidraSegments`, `useHidraTemplates`) usam tokens de auth do store (`useAuthStore`) e placeholders vazios.
- `hidraService` agora expõe `fetchSegments` e `fetchTemplates` além de `createCampaign`.
- `mutateAsync(payload)` cria campanha; em sucesso limpa estado, reseta step e invalida caches.
- Payload enviado:
  ```ts
  {
    name,
    description?: string,
    segmentId,
    templateId,
    maxMessagesPerMinute,
    scheduledAt: string | null,
    externalId?: string
  }
  ```

## Data Test IDs (resumo)
- Página: `hidra-wizard`
- Stepper: `hidra-wizard-stepper`
- Conteúdo: `hidra-wizard-content`
- Navegação: `hidra-wizard-back`, `hidra-wizard-next`
- Sucesso: `hidra-wizard-success`
- Etapas: vide seções acima

## Estados & Glow
- Seleção ativa usa `glows.md` + `colors.borderAccent`
- Placeholders usam `colors.bgSecondary`
- Mensagens de feedback:
  - Sucesso → `surfaces.successTint`
  - Erro → `surfaces.errorTint`

## Pendências Futuras
- Ligar preview da mensagem ao backend caso payload aceite customização
- Suporte a anexos/mídia (`template.mediaUrl` já exibido)
- Persistência de rascunhos multi-step

