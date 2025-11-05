import type { CSSProperties } from 'react';
import { useEffect, useState } from 'react';

import { colors, glows, typography } from '../../../shared/design/tokens';
import type { Resource } from '../../../shared/types/cybervault.types';
import { Button, CardTitle } from '../common';

type DownloadModalProps = {
  resource: Resource | null;
  open: boolean;
  onConfirm: (resourceId: string) => Promise<number | void> | number | void;
  onClose: () => void;
};

export const DownloadModal = ({ resource, open, onConfirm, onClose }: DownloadModalProps) => {
  if (!open || !resource) return null;

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [downloadCount, setDownloadCount] = useState(resource.downloadCount);

  useEffect(() => {
    setError(null);
    setSuccess(false);
    setIsProcessing(false);
    setDownloadCount(resource.downloadCount);
  }, [resource.id, resource.downloadCount, open]);

  const handleConfirm = async () => {
    if (!resource) return;
    setIsProcessing(true);
    setError(null);
    setSuccess(false);
    try {
      const result = onConfirm(resource.id);
      const resolved =
        result && typeof (result as Promise<number | void>).then === 'function'
          ? await (result as Promise<number | void>)
          : (result as number | void | undefined);
      setDownloadCount((prev) => {
        if (typeof resolved === 'number' && !Number.isNaN(resolved)) {
          return resolved;
        }
        return prev + 1;
      });
      setSuccess(true);
    } catch (err) {
      console.warn('download tracking failed', err);
      setError('Não foi possível registrar o download. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal
      aria-label="Confirmação de download"
      className="fixed inset-0 z-[1000] flex items-center justify-center p-6"
    >
      <div className="absolute inset-0 bg-[var(--overlay)]" style={{ '--overlay': colors.overlayStrong } as CSSProperties} onClick={onClose} />
      <div
        className="relative w-full max-w-lg rounded-2xl border border-[var(--modal-border)] bg-[var(--modal-bg)] p-6 shadow-[var(--modal-shadow)]"
        style={{
          '--modal-border': colors.borderAccent,
          '--modal-bg': colors.bgElevated,
          '--modal-shadow': `${glows.lg}`,
        } as CSSProperties}
      >
        <div className="flex items-start justify-between">
          <CardTitle className="text-xl" style={{ color: colors.primary }}>
            Download de recurso
          </CardTitle>
          <button
            aria-label="Fechar modal"
            className="rounded p-2 text-sm hover:bg-[var(--x-bg)]"
            style={{ '--x-bg': colors.bgTertiary, color: colors.textSecondary } as CSSProperties}
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <p className="mt-2 text-sm" style={{ color: colors.textSecondary }}>
          Confirma o download de
          <span className="ml-1 font-semibold" style={{ color: colors.textPrimary }}>
            {resource.title}
          </span>
          ?
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={() => void handleConfirm()}
            disabled={isProcessing}
            loading={isProcessing}
          >
            Confirmar download
          </Button>
        </div>
        <p className="mt-3 text-xs uppercase tracking-[0.16em]" style={{ color: colors.textSecondary, fontFamily: typography.fontHeading }}>
          Este download será registrado no seu histórico.
        </p>
        <div className="mt-3 space-y-2 text-sm" style={{ color: colors.textSecondary }}>
          <p data-testid="download-count">Downloads registrados: {downloadCount.toLocaleString('pt-BR')}</p>
          {success ? (
            <p data-testid="download-success" role="status" aria-live="polite" style={{ color: colors.accentSuccess }}>
              Download confirmado e rastreado.
            </p>
          ) : null}
          {error ? (
            <p data-testid="download-error" role="alert" style={{ color: colors.accentError }}>
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
};
