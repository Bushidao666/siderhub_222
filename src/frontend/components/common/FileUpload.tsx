import type { CSSProperties, ChangeEvent } from 'react';
import { forwardRef, useCallback, useId } from 'react';
import { colors, surfaces, typography } from '../../../shared/design/tokens';
import { cn } from '../../../shared/utils/cn';
import { Button } from './Button';

export type FileValidationRule = {
  maxSizeBytes?: number;
  allowedTypes?: string[];
  required?: boolean;
};

export type FilePreview = {
  file: File;
  preview: string;
  name: string;
  size: number;
  type: string;
};

type FileUploadProps = {
  label?: string;
  description?: string;
  error?: string;
  accept?: string;
  multiple?: boolean;
  maxSizeBytes?: number;
  allowedTypes?: string[];
  value?: File[];
  onFilesChange?: (files: File[]) => void;
  onPreviewsChange?: (previews: FilePreview[]) => void;
  disabled?: boolean;
  containerClassName?: string;
  showPreview?: boolean;
  maxFiles?: number;
  onFileRemove?: (index: number) => void;
  onClearAll?: () => void;
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const createPreview = async (file: File): Promise<string> => {
  if (file.type.startsWith('image/')) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }
  return '';
};

export const FileUpload = forwardRef<HTMLInputElement, FileUploadProps>(
  (
    {
      label,
      description,
      error,
      accept,
      multiple = false,
      maxSizeBytes = 5 * 1024 * 1024, // 5MB default
      allowedTypes,
      value = [],
      onFilesChange,
      onPreviewsChange,
      disabled = false,
      containerClassName,
      showPreview = true,
      maxFiles = 1,
      onFileRemove,
      onClearAll,
      ...rest
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = generatedId;
    const descriptionId = description ? `${inputId}-description` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;
    const helperMessageId = error ? errorId : descriptionId;

    const validateFile = (file: File): string | null => {
      // Check file size
      if (file.size > maxSizeBytes) {
        return `Arquivo muito grande. Tamanho máximo: ${formatFileSize(maxSizeBytes)}`;
      }

      // Check file type
      if (allowedTypes && allowedTypes.length > 0) {
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
        const isAllowed = allowedTypes.some(type => {
          if (type.startsWith('.')) {
            return fileExtension === type.toLowerCase();
          }
          return file.type.startsWith(type);
        });

        if (!isAllowed) {
          return `Tipo de arquivo não permitido. Tipos aceitos: ${allowedTypes.join(', ')}`;
        }
      }

      // Check accept attribute
      if (accept) {
        const acceptTypes = accept.split(',').map(type => type.trim());
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
        const isAccepted = acceptTypes.some(type => {
          if (type.startsWith('.')) {
            return fileExtension === type.toLowerCase();
          }
          if (type.endsWith('/*')) {
            const mimePrefix = type.replace('*', '');
            return file.type.startsWith(mimePrefix);
          }
          return file.type === type;
        });

        if (!isAccepted) {
          return `Tipo de arquivo não aceito. Formatos aceitos: ${accept}`;
        }
      }

      return null;
    };

    const handleFileChange = useCallback(
      async (event: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);

        if (files.length === 0) {
          return;
        }

        // Check max files limit
        if (!multiple && files.length > 1) {
          return;
        }

        if (multiple && maxFiles && value.length + files.length > maxFiles) {
          return;
        }

        // Validate files
        const validationErrors: string[] = [];
        const validFiles: File[] = [];
        const previews: FilePreview[] = [];

        for (const file of files) {
          const validationError = validateFile(file);
          if (validationError) {
            validationErrors.push(`${file.name}: ${validationError}`);
          } else {
            validFiles.push(file);
            const preview = await createPreview(file);
            previews.push({
              file,
              preview,
              name: file.name,
              size: file.size,
              type: file.type,
            });
          }
        }

        if (validationErrors.length > 0) {
          // You could pass these errors up to the parent component
          console.warn('Validation errors:', validationErrors);
        }

        if (validFiles.length > 0) {
          const newFiles = multiple ? [...value, ...validFiles] : validFiles;
          const newPreviews = multiple ? [...(value.flatMap(f => previews)), ...previews] : previews;

          onFilesChange?.(newFiles);
          onPreviewsChange?.(newPreviews);
        }

        // Reset input
        event.target.value = '';
      },
      [multiple, maxFiles, value, maxSizeBytes, allowedTypes, accept, onFilesChange, onPreviewsChange],
    );

    const handleRemoveFile = (index: number) => {
      const newFiles = value.filter((_, i) => i !== index);
      onFilesChange?.(newFiles);
      onFileRemove?.(index);
    };

    const handleClearAll = () => {
      onFilesChange?.([]);
      onClearAll?.();
    };

    const inputStyle = {
      '--input-bg': colors.bgPrimary,
      '--input-border': colors.borderPrimary,
      '--input-focus': colors.borderAccent,
      '--input-text': colors.textPrimary,
      '--input-placeholder': colors.textTertiary,
    } as CSSProperties;

    return (
      <div
        className={cn('flex w-full flex-col gap-3 text-sm', containerClassName)}
        style={{ fontFamily: typography.fontPrimary }}
        data-invalid={error ? 'true' : undefined}
      >
        {label ? (
          <span className="text-xs uppercase tracking-[0.2em] text-[var(--label-color)]" style={{ '--label-color': colors.textSecondary } as CSSProperties}>
            {label}
          </span>
        ) : null}

        <div className="flex flex-col gap-3">
          {/* Upload Area */}
          <div
            className={cn(
              'group relative rounded-lg border-2 border-dashed p-6 text-center transition-all duration-200',
              'border-[var(--upload-border)] bg-[var(--upload-bg)]',
              'hover:border-[var(--upload-hover)] hover:bg-[var(--upload-hover-bg)]',
              'focus-within:border-[var(--upload-focus)] focus-within:shadow-[0_0_12px_rgba(0,255,0,0.35)]',
              disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
              error ? 'border-[var(--upload-error-border)]' : '',
            )}
            style={{
              '--upload-border': colors.borderPrimary,
              '--upload-bg': colors.bgSecondary,
              '--upload-hover': colors.borderAccent,
              '--upload-hover-bg': colors.bgTertiary,
              '--upload-focus': colors.borderAccent,
              '--upload-error-border': colors.accentError,
            } as CSSProperties}
            onClick={() => {
              if (!disabled) {
                document.getElementById<HTMLInputElement>(inputId)?.click();
              }
            }}
          >
            <input
              ref={ref}
              type="file"
              id={inputId}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              style={inputStyle}
              accept={accept}
              multiple={multiple}
              disabled={disabled}
              onChange={handleFileChange}
              aria-describedby={helperMessageId}
              aria-invalid={Boolean(error)}
              aria-errormessage={error ? errorId : undefined}
              {...rest}
            />

            <div className="pointer-events-none flex flex-col items-center gap-2">
              <div className="text-2xl">📁</div>
              <div className="text-sm font-medium text-[var(--upload-text)]" style={{ '--upload-text': colors.textPrimary } as CSSProperties}>
                {multiple ? 'Arraste arquivos ou clique para selecionar' : 'Arraste arquivo ou clique para selecionar'}
              </div>
              {description && (
                <div className="text-xs text-[var(--upload-description)]" style={{ '--upload-description': colors.textSecondary } as CSSProperties}>
                  {description}
                </div>
              )}
              {maxSizeBytes && (
                <div className="text-xs text-[var(--upload-description)]" style={{ '--upload-description': colors.textTertiary } as CSSProperties}>
                  Tamanho máximo: {formatFileSize(maxSizeBytes)}
                </div>
              )}
            </div>
          </div>

          {/* File Previews */}
          {showPreview && value.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--preview-label)]" style={{ '--preview-label': colors.textSecondary } as CSSProperties}>
                  {value.length} arquivo{value.length > 1 ? 's' : ''} selecionado{value.length > 1 ? 's' : ''}
                </span>
                {value.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearAll}
                    disabled={disabled}
                  >
                    Remover todos
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                {value.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 rounded-lg border border-[var(--file-border)] bg-[var(--file-bg)] p-3"
                    style={{
                      '--file-border': colors.borderPrimary,
                      '--file-bg': colors.bgSecondary,
                    } as CSSProperties}
                  >
                    <div className="flex-shrink-0 text-lg">
                      {file.type.startsWith('image/') ? '🖼️' :
                       file.type.startsWith('video/') ? '🎥' :
                       file.type.startsWith('audio/') ? '🎵' :
                       file.type.includes('pdf') ? '📄' :
                       file.type.includes('spreadsheet') || file.name.endsWith('.csv') ? '📊' :
                       file.type.includes('document') || file.name.endsWith('.doc') ? '📝' :
                       '📎'}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-[var(--file-name)]" style={{ '--file-name': colors.textPrimary } as CSSProperties}>
                        {file.name}
                      </div>
                      <div className="text-xs text-[var(--file-size)]" style={{ '--file-size': colors.textTertiary } as CSSProperties}>
                        {formatFileSize(file.size)}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFile(index)}
                      disabled={disabled}
                      className="flex-shrink-0"
                    >
                      ✕
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {error ? (
          <span
            id={errorId}
            className="text-xs text-[var(--error-color)]"
            style={{ '--error-color': colors.accentError } as CSSProperties}
            role="alert"
          >
            {error}
          </span>
        ) : null}
      </div>
    );
  },
);

FileUpload.displayName = 'FileUpload';