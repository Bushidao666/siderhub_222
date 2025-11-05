# useLessonVideoTracking

## Propósito
Emitir ticks de progresso de vídeo a cada 10s (ou intervalo configurável) e marcar conclusão de aulas, mantendo snapshot atualizado e invalidando progresso de curso.

## Retorno
- `progress: LessonProgressSnapshot | null`
- `isTracking`, `isLoadingSnapshot`, `isSendingTick`, `lastError`
- Ações: `sendTick(options?)`, `markCompleted()`, `refetchSnapshot()`

## Parâmetros
- `lessonId`, `courseId`, `durationMs` (obrigatórios para tracking)
- `getPositionMs: () => number` (obtém posição atual do player)
- `isPlaying: boolean`
- Opcional: `tickIntervalMs`, `completionThreshold`, `enabled`, `onCompleted`, `onError`

## Endpoints Consumidos
- `GET /academy/lessons/:lessonId/progress`
- `POST /academy/lessons/:lessonId/progress-tick`

## Dependências
- `ApiClient` autenticado via `useAuthStore`
- Query keys em `queryKeys.academy.lessonProgress` e `queryKeys.academy.progress`
- `assertSuccess`, `mapApiError`

## Observações
- Pausa emissões quando `document.visibilityState !== 'visible'`.
- Primeiro tick é emitido imediatamente ao iniciar tracking, após consumir o snapshot vigente.
- `markCompleted` força envio final (completed=true) e invalida progresso do curso correspondente.
- Hook assume backend calculando agregados (posição, %); cliente apenas envia posição atual (ms).
- Snapshot carregado atualiza `lastKnownPositionMs` e dispara `onCompleted` apenas quando transicionar para concluído.
