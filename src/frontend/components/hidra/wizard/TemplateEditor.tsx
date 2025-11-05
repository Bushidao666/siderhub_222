import type { CSSProperties, ChangeEvent } from 'react';

import { colors, glows, surfaces } from '../../../../shared/design/tokens';
import type { MessageTemplate } from '../../../../shared/types';
import { Button, Card, CardContent, CardTitle, Input } from '../../common';
import { MediaUpload, type MediaFile } from './MediaUpload';

type TemplateEditorProps = {
  templates: MessageTemplate[];
  selectedTemplateId?: string | null;
  previewBody: string;
  onSelectTemplate: (template: MessageTemplate) => void;
  onPreviewChange: (value: string) => void;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  selectedMedia?: MediaFile | null;
  onMediaSelect?: (media: MediaFile | null) => void;
  onMediaUpload?: (file: File) => Promise<MediaFile>;
  mediaLibrary?: MediaFile[];
};

const TemplateSkeleton = () => (
  <div
    className="h-full rounded-3xl border border-[var(--skel-border)] bg-[var(--skel-bg)]"
    style={{ '--skel-border': colors.borderPrimary, '--skel-bg': colors.bgSecondary } as CSSProperties}
  />
);

export const TemplateEditor = ({
  templates,
  selectedTemplateId,
  previewBody,
  onSelectTemplate,
  onPreviewChange,
  loading,
  error,
  onRetry,
  selectedMedia,
  onMediaSelect,
  onMediaUpload,
  mediaLibrary,
}: TemplateEditorProps) => {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2" data-testid="hidra-template-loading">
        {[0, 1, 2].map((index) => (
          <TemplateSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex flex-col gap-3 rounded-3xl border border-[var(--error-border)] bg-[var(--error-bg)] p-6 text-sm"
        data-testid="hidra-template-error"
        style={{ '--error-border': colors.accentError, '--error-bg': surfaces.errorTint } as CSSProperties}
      >
        <span style={{ color: colors.accentError }}>{error}</span>
        {onRetry ? (
          <Button variant="ghost" size="sm" onClick={onRetry} data-testid="hidra-template-retry">
            Recarregar templates
          </Button>
        ) : null}
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <Card variant="outlined" data-testid="hidra-template-empty">
        <CardContent className="text-center text-sm" style={{ color: colors.textSecondary }}>
          Nenhum template cadastrado. Configure modelos na Evolution API para liberar esta etapa.
        </CardContent>
      </Card>
    );
  }

  const selectedTemplate = templates.find((template) => template.id === selectedTemplateId) ?? null;

  const handlePreviewChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onPreviewChange(event.target.value);
  };

  return (
    <div className="grid gap-6" data-testid="hidra-template-editor">
      <div className="grid gap-4 md:grid-cols-2">
        {templates.map((template) => {
          const isActive = template.id === selectedTemplateId;
          return (
            <button
              key={template.id}
              type="button"
              onClick={() => onSelectTemplate(template)}
              className="block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--focus-offset)]"
              data-testid={`hidra-template-${template.id}`}
              aria-pressed={isActive}
              style={{
                '--focus-ring': colors.borderAccent,
                '--focus-offset': colors.bgPrimary,
              } as CSSProperties}
            >
              <Card
                variant={isActive ? 'outlined' : 'solid'}
                glowing={isActive}
                className="h-full transition-transform duration-200 hover:-translate-y-0.5"
                style={
                  {
                    '--card-border': isActive ? colors.borderAccent : colors.borderPrimary,
                    '--card-shadow': isActive ? glows.md : glows.sm,
                  } as CSSProperties
                }
              >
                <CardTitle className="text-lg" style={{ color: colors.primary }}>
                  {template.title}
                </CardTitle>
                <CardContent>
                  <p className="line-clamp-3 text-sm" data-testid="hidra-template-body-preview">
                    {template.body}
                  </p>
                  <div className="text-xs uppercase tracking-[0.18em]" style={{ color: colors.textSecondary }}>
                    Variáveis: {template.variables.length > 0 ? template.variables.join(', ') : 'Nenhuma'}
                  </div>
                  {template.mediaUrl ? (
                    <span className="text-xs" style={{ color: colors.textTertiary }}>
                      Anexo: {template.mediaUrl}
                    </span>
                  ) : null}
                </CardContent>
              </Card>
            </button>
          );
        })}
      </div>

      {selectedTemplate ? (
        <Card variant="outlined" data-testid="hidra-template-preview">
          <CardTitle className="text-lg" style={{ color: colors.primary }}>
            Pré-visualização da mensagem
          </CardTitle>
          <CardContent className="gap-3">
            <Input
              label="Título"
              value={selectedTemplate.title}
              disabled
              containerClassName="max-w-xl"
            />
            <label className="flex flex-col gap-2 text-sm" style={{ color: colors.textSecondary }}>
              <span className="text-xs uppercase tracking-[0.2em]" style={{ color: colors.textSecondary }}>
                Mensagem personalizada
              </span>
              <textarea
                className="min-h-[160px] rounded-2xl border border-[var(--textarea-border)] bg-[var(--textarea-bg)] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--textarea-focus)]"
                style={
                  {
                    '--textarea-border': colors.borderPrimary,
                    '--textarea-bg': colors.bgSecondary,
                    '--textarea-focus': colors.borderAccent,
                  } as CSSProperties
                }
                value={previewBody}
                onChange={handlePreviewChange}
                data-testid="hidra-template-preview-body"
              />
              <span className="text-xs" style={{ color: colors.textTertiary }}>
                Utilize as variáveis exatamente como listadas acima. A mensagem final não é enviada nesta etapa; ela serve como guia para revisão.
              </span>
            </label>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};

TemplateEditor.displayName = 'TemplateEditor';
