# SaaSCarousel (hub)

Props:
- `items: SaaSCarouselItem[]`

Types:
- `SaaSCarouselItem extends MemberAccessMap` com campos:
  - `feature: FeatureAccessKey`
  - `title: string`
  - `description: string`
  - `icon: ReactNode`
  - `status: 'active' | 'locked' | 'new' | 'maintenance'`
  - `ctaLabel?: string` · `ctaHref?: string` · `onCtaClick?: () => void`

States:
- Vazio retorna `null`
- Badges de status (success/warning/error/outline)
- CTA desabilita se `locked`; aria-label descreve ação e estado
- Track usa `role="list"` + cards como `listitem` para leitores de tela

Dependencies:
- `src/shared/types/auth.types#MemberAccessMap`
- `src/shared/types/common.types#FeatureAccessKey`
- Common: `Card`, `Badge`, `Button`
- Tokens: `src/shared/design/tokens.ts`

Visual cues:
- Título uppercase `Rajdhani` com neon
- Cards com bordas sutis e CTAs com glow
