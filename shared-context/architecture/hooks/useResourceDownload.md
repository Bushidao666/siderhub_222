# useResourceDownload

## Propósito
Registrar downloads de recursos no Cybervault via mutation React Query, permitindo feedback de carregamento e tratamento de erros centralizado.

## Retorno
- `triggerDownload(id)` / `triggerDownloadAsync(id)` (retorna `ResourceDownloadReceipt`)
- Flags: `isDownloading`, `error`
- `reset()` para limpar estado da mutation

## Endpoints Consumidos
- `POST /cybervault/resources/:resourceId/download`

## Dependências
- `ApiClient` autenticado via `useAuthStore`
- `assertSuccess`, `mapApiError`
- Invalidação parcial de queries `['cybervault', 'resources']` pós-sucesso

## Observações
- Mutation falha se usuário não autenticado ou se `resourceId` estiver vazio.
- Após sucesso atualiza as listas em cache (`downloadCount` → `totalDownloads`) e invalida seletivamente queries com chave base `['cybervault','resources']`.
- Pode receber callbacks `onSuccess(resourceId)`/`onError`; `onSuccess` recebe o recibo `{ ok: true; totalDownloads; lastDownloadedAt }` e o `resourceId` utilizado na mutation para permitir atualização de estados locais.
- Exemplos (ResourceLibrary/Detail) devem propagar o `lastDownloadedAt` para feedback ao usuário (ex.: formatar timestamp no toast) além de atualizar `totalDownloads` exibidos.
