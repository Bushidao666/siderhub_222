import type { CSSProperties } from 'react';
import { useState, useCallback } from 'react';
import { colors, surfaces, typography } from '../../../../shared/design/tokens';
import type { FilePreview } from '../../../common/FileUpload';
import { Button, Card, CardContent, CardTitle, FileUpload } from '../../../common';

export type MediaFile = {
  id: string;
  url: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
};

type MediaUploadProps = {
  onMediaSelect?: (media: MediaFile | null) => void;
  currentMediaUrl?: string | null;
  accept?: string;
  maxSizeBytes?: number;
  loading?: boolean;
  disabled?: boolean;
  allowUpload?: boolean;
  mediaLibrary?: MediaFile[];
  onMediaUpload?: (file: File) => Promise<MediaFile>;
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getMediaIcon = (type: string): string => {
  if (type.startsWith('image/')) return '🖼️';
  if (type.startsWith('video/')) return '🎥';
  if (type.startsWith('audio/')) return '🎵';
  if (type.includes('pdf')) return '📄';
  if (type.includes('document') || type.includes('doc')) return '📝';
  return '📎';
};

const createMediaPreview = (file: File, url: string): MediaFile => ({
  id: URL.createObjectURL(file),
  url,
  name: file.name,
  type: file.type,
  size: file.size,
  uploadedAt: new Date().toISOString(),
});

export const MediaUpload = ({
  onMediaSelect,
  currentMediaUrl,
  accept = 'image/*,video/*,audio/*,.pdf,.doc,.docx',
  maxSizeBytes = 50 * 1024 * 1024, // 50MB default
  loading = false,
  disabled = false,
  allowUpload = true,
  mediaLibrary = [],
  onMediaUpload,
}: MediaUploadProps) => {
  const [uploadMode, setUploadMode] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreviews, setUploadPreviews] = useState<FilePreview[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = useCallback(async (files: File[]) => {
    if (files.length === 0) return;

    const file = files[0];
    setUploadFile(file);
    setError(null);

    if (onMediaUpload) {
      setUploadProgress(0);

      try {
        const uploadedMedia = await onMediaUpload(file);
        setUploadProgress(100);
        onMediaSelect?.(uploadedMedia);
        setUploadMode(false);
        setUploadFile(null);
        setUploadPreviews([]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao fazer upload da mídia.');
        setUploadProgress(0);
      }
    } else {
      // Fallback to local preview
      const url = URL.createObjectURL(file);
      const media = createMediaPreview(file, url);
      onMediaSelect?.(media);
      setUploadMode(false);
      setUploadFile(null);
      setUploadPreviews([]);
    }
  }, [onMediaUpload, onMediaSelect]);

  const handlePreviewsChange = useCallback((previews: FilePreview[]) => {
    setUploadPreviews(previews);
  }, []);

  const handleMediaSelect = useCallback((media: MediaFile) => {
    onMediaSelect?.(media);
  }, [onMediaSelect]);

  const handleClearSelection = useCallback(() => {
    onMediaSelect?.(null);
  }, [onMediaSelect]);

  const handleCancelUpload = useCallback(() => {
    setUploadMode(false);
    setUploadFile(null);
    setUploadPreviews([]);
    setUploadProgress(0);
    setError(null);
  }, []);

  const renderMediaPreview = (media: MediaFile | string, showClear = true) => {
    const url = typeof media === 'string' ? media : media.url;
    const name = typeof media === 'string' ? 'Mídia selecionada' : media.name;
    const type = typeof media === 'string' ? 'unknown' : media.type;
    const size = typeof media === 'string' ? 0 : media.size;

    if (typeof media === 'object' && media.type.startsWith('image/')) {
      return (
        <div className="space-y-3">
          <div className="relative inline-block">
            <img
              src={url}
              alt={name}
              className="max-h-48 w-full rounded-lg object-cover"
            />
            {showClear && !disabled && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleClearSelection}
                className="absolute right-2 top-2"
                disabled={loading}
              >
                Remover
              </Button>
            )}
          </div>
          <div className="text-xs" style={{ color: colors.textTertiary }}>
            {name} • {formatFileSize(size)}
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-3 rounded-lg border border-[var(--media-border)] bg-[var(--media-bg)] p-3">
        <div className="flex-shrink-0 text-2xl">
          {getMediaIcon(type)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-[var(--media-name)]" style={{ '--media-name': colors.textPrimary } as CSSProperties}>
            {name}
          </div>
          <div className="text-xs text-[var(--media-size)]" style={{ '--media-size': colors.textTertiary } as CSSProperties}>
            {formatFileSize(size)}
          </div>
        </div>
        {showClear && !disabled && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearSelection}
            disabled={loading}
          >
            ✕
          </Button>
        )}
      </div>
    );
  };

  if (currentMediaUrl && !uploadMode) {
    return (
      <Card variant="outlined" data-testid="media-current">
        <CardTitle>Mídia Atual</CardTitle>
        <CardContent>
          {renderMediaPreview(currentMediaUrl)}
          <div className="mt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setUploadMode(true)}
              disabled={disabled || loading}
            >
              Alterar mídia
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (uploadMode) {
    return (
      <div className="space-y-4" data-testid="media-upload-mode">
        <Card variant="outlined">
          <CardTitle>
            {allowUpload ? 'Upload de Mídia' : 'Selecionar Mídia'}
          </CardTitle>
          <CardContent className="space-y-4">
            {allowUpload && (
              <FileUpload
                label="Selecione o arquivo de mídia"
                description={`Formatos aceitos: ${accept}. Tamanho máximo: ${formatFileSize(maxSizeBytes)}`}
                accept={accept}
                multiple={false}
                maxSizeBytes={maxSizeBytes}
                value={uploadFile ? [uploadFile] : []}
                onFilesChange={handleFileChange}
                onPreviewsChange={handlePreviewsChange}
                disabled={disabled || loading}
                error={error}
                showPreview={true}
              />
            )}

            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span style={{ color: colors.textSecondary }}>Upload em andamento...</span>
                  <span style={{ color: colors.textSecondary }}>{uploadProgress}%</span>
                </div>
                <div
                  className="h-2 w-full rounded-full bg-[var(--progress-bg)]"
                  style={{ '--progress-bg': surfaces.bgTertiary } as CSSProperties}
                >
                  <div
                    className="h-2 rounded-full bg-[var(--progress-fill)] transition-all duration-300"
                    style={{
                      '--progress-fill': colors.accentSuccess,
                      width: `${uploadProgress}%`,
                    } as CSSProperties}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Media Library */}
        {mediaLibrary.length > 0 && (
          <Card variant="outlined">
            <CardTitle>Biblioteca de Mídia</CardTitle>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {mediaLibrary.map((media) => (
                  <button
                    key={media.id}
                    type="button"
                    onClick={() => handleMediaSelect(media)}
                    disabled={disabled || loading}
                    className="block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                    style={{
                      '--focus-ring': colors.borderAccent,
                    } as CSSProperties}
                  >
                    <div className="rounded-lg border border-[var(--library-border)] bg-[var(--library-bg)] p-2 transition-colors hover:border-[var(--library-hover)]">
                      {media.type.startsWith('image/') ? (
                        <img
                          src={media.url}
                          alt={media.name}
                          className="h-24 w-full rounded object-cover"
                        />
                      ) : (
                        <div className="flex h-24 w-full items-center justify-center rounded bg-[var(--placeholder-bg)]">
                          <div className="text-2xl">{getMediaIcon(media.type)}</div>
                        </div>
                      )}
                      <div className="mt-2 truncate text-xs" style={{ color: colors.textPrimary }}>
                        {media.name}
                      </div>
                      <div className="text-xs" style={{ color: colors.textTertiary }}>
                        {formatFileSize(media.size)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handleCancelUpload}
            disabled={loading}
          >
            Cancelar
          </Button>
          {!allowUpload && (
            <Button
              variant="primary"
              disabled={true}
            >
              Selecione uma mídia acima
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card variant="outlined" data-testid="media-upload">
      <CardTitle>Mídia da Campanha</CardTitle>
      <CardContent>
        <div className="text-center">
          <div className="mb-4 text-3xl">📎</div>
          <p className="text-sm text-[var(--description-color)]" style={{ '--description-color': colors.textSecondary } as CSSProperties}>
            Adicione imagens, vídeos, áudios ou documentos para enriquecer suas campanhas.
          </p>
        </div>

        <div className="mt-4 flex justify-center">
          <Button
            variant="primary"
            onClick={() => setUploadMode(true)}
            disabled={disabled || loading}
          >
            Adicionar Mídia
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

MediaUpload.displayName = 'MediaUpload';