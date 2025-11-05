import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { RatingStars } from 'src/frontend/components/academy/RatingStars';

describe('RatingStars', () => {
  it('renders average and triggers callback on interaction', async () => {
    const onRate = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(
      <RatingStars
        averageRating={4.2}
        totalRatings={12}
        userRating={4}
        onRate={onRate}
      />,
    );

    expect(screen.getByTestId('rating-average')).toHaveTextContent(/média 4.2/i);
    expect(screen.getByTestId('rating-user-selection')).toHaveTextContent(/sua nota: 4/i);

    await user.click(screen.getByTestId('rating-star-5'));

    expect(onRate).toHaveBeenCalledWith(5);
  });
});
