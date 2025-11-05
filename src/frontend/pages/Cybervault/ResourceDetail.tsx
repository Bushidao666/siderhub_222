import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

import { colors, glows, typography } from '../../../shared/design/tokens';
import { Button, Card, CardContent, CardTitle } from '../../components/common';
import { useResourceDownload } from '../../hooks/useResourceDownload';
import { useResourceLibrary } from '../../hooks/useResourceLibrary';

export const CybervaultDetail = () => {
  const { resourceSlug = '' } = useParams<{ resourceSlug: string }>();
  const libraryQuery = useResourceLibrary();
  const resource = useMemo(
    () => libraryQuery.data?.items.find((item) => item.slug === resourceSlug) ?? null,
    [libraryQuery.data?.items, resourceSlug]
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [downloadCount, setDownloadCount] = useState<number>(resource?.downloadCount ?? 0);

  useEffect(() => {
    if (resource) {
      setDownloadCount(resource.downloadCount);
    }
  }, [resource?.id, resource?.downloadCount]);

  const downloadMutation = useResourceDownload({
    onSuccess: (receipt, resourceId) => {
      if (resource && resource.id === resourceId) {
        setDownloadCount(receipt.totalDownloads);
      }
      setStatusMessage('Download registrado com sucesso.');
    },
    onError: (message) => {
      setStatusMessage(message);
    },
  });

  if (!resource) {
    return (
      <section className="space-y-4" data-testid="cybervault-detail-missing">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.18em]" style={{ fontFamily: typography.fontHeading, color: colors.textSecondary }}>
            Recurso não encontrado
          </p>
          <h1 className="text-3xl uppercase" style={{ fontFamily: typography.fontHeading, color: colors.primary }}>
            Asset indisponível
          </h1>
        </header>
        <p className="text-sm" style={{ color: colors.textSecondary }}>
          O recurso que você tentou acessar não está disponível. Volte para a biblioteca e escolha outro arquivo neon.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-6" data-testid="cybervault-detail">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.18em]" style={{ fontFamily: typography.fontHeading, color: colors.textSecondary }}>
          Recurso Cybervault
        </p>
        <h1
          className="text-4xl uppercase"
          style={{ fontFamily: typography.fontHeading, color: colors.primary, textShadow: glows.text }}
        >
          {resource.title}
        </h1>
        <p className="text-sm" style={{ color: colors.textSecondary }}>
          {resource.description}
        </p>
      </header>

      <Card glowing>
        <CardTitle style={{ color: colors.primary }}>Detalhes</CardTitle>
        <CardContent className="space-y-3 text-sm" style={{ color: colors.textSecondary }}>
          <p>Tipo: {resource.type}</p>
          <p data-testid="cybervault-detail-downloads">Downloads: {downloadCount.toLocaleString('pt-BR')}</p>
          <p>Views: {resource.viewCount.toLocaleString('pt-BR')}</p>
          <p>Tags: {resource.tags.map((tag) => `#${tag.name}`).join(' ') || 'Nenhuma tag'}</p>
          <Button
            variant="primary"
            loading={downloadMutation.isDownloading}
            onClick={() => downloadMutation.triggerDownload(resource.id)}
          >
            Download rápido
          </Button>
          {statusMessage ? (
            <p className="text-xs" style={{ color: colors.textSecondary }}>
              {statusMessage}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
};

export default CybervaultDetail;
