import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';

import { colors, glows, typography } from '../../../shared/design/tokens';

type RatingStarsProps = {
  averageRating?: number | null;
  totalRatings?: number;
  userRating?: number | null;
  onRate?: (value: number) => Promise<void> | void;
  submitting?: boolean;
  disabled?: boolean;
};

const STAR_SCALE = [1, 2, 3, 4, 5] as const;

export const RatingStars = ({
  averageRating = null,
  totalRatings = 0,
  userRating = null,
  onRate,
  submitting = false,
  disabled = false,
}: RatingStarsProps) => {
  const [hovered, setHovered] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const [localRating, setLocalRating] = useState<number | null>(userRating ?? null);

  useEffect(() => {
    if (!pending) {
      setLocalRating(userRating ?? null);
    }
  }, [userRating, pending]);

  const activeRating = hovered ?? localRating ?? 0;
  const formattedAverage = useMemo(() => {
    if (averageRating === null || Number.isNaN(averageRating)) {
      return null;
    }
    return averageRating.toFixed(1);
  }, [averageRating]);

  const handleRate = async (value: number) => {
    if (!onRate || disabled || pending) return;
    const previous = localRating;
    setPending(true);
    setLocalRating(value);
    try {
      const result = onRate(value);
      if (result && typeof (result as Promise<void>).then === 'function') {
        await (result as Promise<void>);
      }
    } catch (error) {
      setLocalRating(previous ?? null);
      console.warn('rating submission failed', error);
    } finally {
      setPending(false);
    }
  };

  return (
    <div data-testid="lesson-rating-section" className="flex flex-col gap-2">
      <div className="flex items-center gap-1">
        {STAR_SCALE.map((value) => {
          const filled = value <= activeRating;
          return (
            <button
              key={value}
              type="button"
              data-testid={`rating-star-${value}`}
              className="flex h-9 w-9 items-center justify-center rounded-full border text-xl transition-transform"
              style={
                {
                  borderColor: filled ? colors.primary : colors.borderPrimary,
                  color: filled ? colors.primary : colors.textSecondary,
                  boxShadow: filled ? glows.sm : undefined,
                  fontFamily: typography.fontHeading,
                } as CSSProperties
              }
              aria-label={`Avaliar com ${value} ${value === 1 ? 'estrela' : 'estrelas'}`}
              aria-pressed={value === localRating}
              disabled={disabled || submitting || pending}
              onMouseEnter={() => setHovered(value)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(value)}
              onBlur={() => setHovered(null)}
              onClick={() => void handleRate(value)}
            >
              ★
            </button>
          );
        })}
      </div>
      <div className="text-xs uppercase tracking-[0.14em]" style={{ fontFamily: typography.fontHeading, color: colors.textSecondary }}>
        {formattedAverage ? (
          <span data-testid="rating-average">Média {formattedAverage}</span>
        ) : (
          <span data-testid="rating-average">Sem avaliações</span>
        )}
        <span className="ml-2" style={{ color: colors.textTertiary }}>
          · {totalRatings ?? 0} {totalRatings === 1 ? 'avaliação' : 'avaliações'}
        </span>
        {localRating ? (
          <span className="ml-2" data-testid="rating-user-selection" style={{ color: colors.primary }}>
            Sua nota: {localRating}
          </span>
        ) : null}
        {submitting || pending ? (
          <span className="ml-2" style={{ color: colors.textSecondary }}>
            Enviando...
          </span>
        ) : null}
      </div>
    </div>
  );
};

export default RatingStars;
