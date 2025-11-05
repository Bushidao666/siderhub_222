import type { HTMLAttributes } from 'react';

import { Badge } from '../../common';

export type PendingBadgeProps = {
  label?: string;
} & Omit<HTMLAttributes<HTMLSpanElement>, 'children'>;

export const PendingBadge = ({ label = 'Aguardando moderação', ...rest }: PendingBadgeProps) => (
  <Badge variant="warning" data-testid="lesson-comment-pending" {...rest}>
    {label}
  </Badge>
);

export default PendingBadge;
