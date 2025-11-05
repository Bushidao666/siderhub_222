import type { CSSProperties } from 'react';
import { useEffect, useState } from 'react';
import { colors, glows, typography } from '../../../shared/design/tokens';
import type { Resource } from '../../../shared/types/cybervault.types';
import { ResourceType } from '../../../shared/types/common.types';
import { Badge, Button, Card, CardContent, CardSubtitle, CardTitle } from '../common';

type ResourceCardProps = {
  resource: Resource;
  onOpen?: (id: string) => void;
  onDownload?: (id: string) => void | Promise<void>;
};

export const RESOURCE_CARD_TEST_IDS = {
  root: 'component-resource-card',
  open: 'component-resource-card-open',
  download: 'component-resource-card-download',
} as const;

const typeLabel: Record<ResourceType, string> = {
  template: 'Template',
  playbook: 'Playbook',
  script: 'Script',
  asset: 'Asset',
  spreadsheet: 'Planilha',
  presentation: 'Apresentação',
  other: 'Outro',
};

export const ResourceCard = ({ resource, onOpen, onDownload }: ResourceCardProps) => {
  const preview = resource.thumbnailUrl;
  const topTags = resource.tags.slice(0, 3);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    let t: number | undefined;
    if (showToast) {
      // auto-hide toast after 2.5s
      t = window.setTimeout(() => setShowToast(false), 2500);
    }
    return () => {
      if (t) window.clearTimeout(t);
    };
  }, [showToast]);

  return (
    <Card
      className="flex h-full flex-col overflow-hidden"
      variant="solid"
      glowing
      data-testid={RESOURCE_CARD_TEST_IDS.root}
    >
      <div className="relative h-40 overflow-hidden rounded-2xl">
        {preview ? (
          <img src={preview} alt="Preview do recurso" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center bg-[var(--ph-bg)]" style={{ '--ph-bg': colors.bgTertiary } as CSSProperties}>
            <span className="text-4xl" aria-hidden>
              📦
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(10,10,10,0.95)] via-[rgba(10,10,10,0.6)] to-transparent" aria-hidden />
        <div className="absolute left-4 top-4">
          <Badge variant="outline">{typeLabel[resource.type]}</Badge>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-4 pt-4">
        <CardTitle className="text-xl" style={{ color: colors.primary }}>
          {resource.title}
        </CardTitle>
        <CardSubtitle style={{ color: colors.textSecondary }}>{resource.description}</CardSubtitle>
        <CardContent className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em]" style={{ color: colors.textSecondary, fontFamily: typography.fontHeading }}>
          {topTags.map((tag) => (
            <span key={tag.id} className="rounded-full border border-[var(--tag-border)] px-3 py-1" style={{ '--tag-border': colors.borderSubtle } as CSSProperties}>
              #{tag.name}
            </span>
          ))}
          {resource.tags.length > 3 ? <span>+{resource.tags.length - 3}</span> : null}
        </CardContent>
        <div className="mt-auto flex items-center justify-between text-sm" style={{ color: colors.textSecondary }}>
          <span data-testid={`cybervault-resource-downloads-${resource.slug}`}>
            {resource.viewCount.toLocaleString('pt-BR')} views · {resource.downloadCount.toLocaleString('pt-BR')} downloads
          </span>
          <div className="flex gap-2">
            <Button data-testid={RESOURCE_CARD_TEST_IDS.open} variant="secondary" onClick={() => onOpen?.(resource.id)}>
              Abrir
            </Button>
            <Button
              data-testid={
                resource.type === ResourceType.Playbook
                  ? 'cybervault-download-playbook'
                  : `cybervault-download-${resource.slug}`
              }
              variant="primary"
              onClick={async () => {
                try {
                  const result = onDownload?.(resource.id);
                  if (result && typeof (result as Promise<void>).then === 'function') {
                    await (result as Promise<void>);
                  }
                  setShowToast(true);
                } catch {
                  // swallow to avoid UI breakage on failure; no toast on error
                }
              }}
            >
              Download
            </Button>
            {resource.type === ResourceType.Playbook ? (
              <span data-testid={`cybervault-download-${resource.slug}`} className="sr-only" aria-hidden />
            ) : null}
          </div>
        </div>
        {showToast ? (
          <div
            data-testid="cybervault-download-toast"
            role="status"
            className="mt-2 text-xs"
            style={{ color: colors.accentSuccess }}
          >
            Download pronto.
          </div>
        ) : null}
      </div>
    </Card>
  );
};
