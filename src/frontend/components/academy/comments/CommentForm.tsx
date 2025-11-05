import type { CSSProperties, FormEvent } from 'react';
import { useEffect, useId, useMemo, useState } from 'react';

import { colors, typography } from '../../../../shared/design/tokens';
import { Button } from '../../common';

export type CommentFormProps = {
  onSubmit: (body: string) => Promise<void> | void;
  submitting?: boolean;
  label?: string;
  placeholder?: string;
  maxLength?: number;
  autoFocus?: boolean;
  onCancel?: () => void;
  cancelLabel?: string;
  submitLabel?: string;
  error?: string | null;
  testId?: string;
  initialValue?: string;
};

export const CommentForm = ({
  onSubmit,
  submitting = false,
  label = 'Adicionar comentário',
  placeholder = 'Compartilhe insights neon ou deixe uma dúvida para a mentoria...',
  maxLength = 800,
  autoFocus = false,
  onCancel,
  cancelLabel = 'Cancelar',
  submitLabel = 'Publicar',
  error,
  testId = 'lesson-comment-form',
  initialValue = '',
}: CommentFormProps) => {
  const isPromise = (value: unknown): value is Promise<unknown> => {
    return typeof value === 'object' && value !== null && 'then' in value && typeof (value as Promise<unknown>).then === 'function';
  };

  const fieldId = useId();
  const [value, setValue] = useState(initialValue);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    setLocalError(error ?? null);
  }, [error]);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const remaining = useMemo(() => {
    if (!maxLength) {
      return null;
    }
    return Math.max(maxLength - value.length, 0);
  }, [maxLength, value.length]);

  const reset = () => {
    setValue('');
    setLocalError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const body = value.trim();
    if (!body) {
      setLocalError('Digite algo antes de enviar.');
      return;
    }
    try {
      const result = onSubmit(body);
      if (isPromise(result)) {
        await result;
      }
      reset();
    } catch (submissionError) {
      setLocalError(submissionError instanceof Error ? submissionError.message : 'Falha ao enviar comentário.');
    }
  };

  const containerStyle = {
    '--comment-border': colors.borderPrimary,
    '--comment-bg': colors.bgSecondary,
  } as CSSProperties;

  const fieldStyle = {
    '--field-border': colors.borderPrimary,
    '--field-bg': colors.bgPrimary,
    '--field-color': colors.textPrimary,
    '--focus-ring': colors.primary,
    fontFamily: typography.fontPrimary,
    lineHeight: 1.5,
  } as CSSProperties;

  return (
    <form
      data-testid={testId}
      onSubmit={handleSubmit}
      className="space-y-3 rounded-3xl border border-[var(--comment-border)] bg-[var(--comment-bg)] p-4"
      style={containerStyle}
    >
      <label
        className="flex flex-col gap-2 text-sm"
        htmlFor={fieldId}
        style={{ fontFamily: typography.fontPrimary, color: colors.textSecondary }}
      >
        <span className="text-xs uppercase tracking-[0.2em]" style={{ fontFamily: typography.fontHeading }}>
          {label}
        </span>
        <textarea
          id={fieldId}
          value={value}
          onChange={(event) => setValue(event.target.value.slice(0, maxLength))}
          placeholder={placeholder}
          rows={4}
          autoFocus={autoFocus}
          maxLength={maxLength}
          className="min-h-[120px] rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-4 py-3 text-sm text-[var(--field-color)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
          style={fieldStyle}
          aria-invalid={localError ? 'true' : undefined}
        />
      </label>
      <div
        className="flex items-center justify-between text-xs"
        style={{ fontFamily: typography.fontHeading, letterSpacing: '0.14em', color: colors.textTertiary }}
      >
        {remaining !== null ? (
          <span data-testid={`${testId}-remaining`}>{remaining} caracteres restantes</span>
        ) : (
          <span aria-hidden />
        )}
        {localError ? (
          <span
            className="text-[var(--error-color)]"
            role="alert"
            style={{ '--error-color': colors.accentError } as CSSProperties}
          >
            {localError}
          </span>
        ) : null}
      </div>
      <div className="flex justify-end gap-3">
        {onCancel ? (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={submitting}>
            {cancelLabel}
          </Button>
        ) : null}
        <Button type="submit" size="sm" loading={submitting} disabled={submitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
};

export default CommentForm;
