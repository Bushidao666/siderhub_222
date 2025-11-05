# RatingStars (academy)

Props:
- `averageRating?: number | null`
- `totalRatings?: number`
- `userRating?: 1 | 2 | 3 | 4 | 5 | null`
- `onRate?: (value: 1 | 2 | 3 | 4 | 5) => Promise<void> | void`
- `submitting?: boolean`
- `disabled?: boolean`

States:
- Hover preview destaca estrela ativa
- Pending state bloqueia interação e mostra "Enviando..."
- Exibe texto `Sua nota` quando `userRating` definido

Dependencies:
- Tokens: `colors`, `glows`, `typography`
- Nenhum hook externo (puro)

Visual cues:
- Botões circulares uppercase com glow neon nas estrelas ativas
- Texto auxiliar uppercase (`RatingStars` usa `typography.fontHeading`)
- `data-testid` expostos (`lesson-rating-section`, `rating-star-*`, `rating-average`, `rating-user-selection`)
