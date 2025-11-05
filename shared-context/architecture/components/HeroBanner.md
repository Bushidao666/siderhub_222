# HeroBanner (hub)

Props:
- `banner: HeroBanner` (shared types)
- `onPrimaryClick?: () => void`
- `onSecondaryClick?: () => void`

States:
- Background overlay when `imageUrl`
- Badge shows status (active/scheduled/inactive)

Dependencies:
- `src/shared/types/admin.types#HeroBanner`
- `src/shared/design/tokens.ts`
- Common components: `Card`, `Badge`, `Button`

Visual cues:
- Title in neon green with text glow
- Dark gradient overlay + neon gradient sweep

Testing:
- Root: `data-testid="component-hero-banner"`
- Primary CTA: `data-testid="component-hero-banner-primary-cta"`
- Secondary CTA: `data-testid="component-hero-banner-secondary-cta"`
