# Design Alignment — Tokens vs Code

Timestamp: 2025-11-03T08:22:01Z

## Tokens Source of Truth
- Design tokens defined: src/shared/design/tokens.ts:1
- CSS variables mapped in global stylesheet: src/frontend/index.css:19

## Alignment Observations
- Components use tokens via imports and CSS vars (good):
  - Example Hub title using tokens: src/frontend/pages/Hub/Home.tsx:41
  - Common components parameterize vars: src/frontend/components/common/Tabs.tsx:106
- Minor hardcoded colors bypassing tokens:
  - Error/success backgrounds use RGBA literals: src/frontend/components/hidra/EvolutionConfigForm.tsx:120, src/frontend/components/hidra/EvolutionConfigForm.tsx:125, src/frontend/components/hidra/EvolutionConfigForm.tsx:130

## Recommendations
- Add semantic alpha helpers or extend tokens for translucent backgrounds (e.g., `overlayErrorBg`, `overlaySuccessBg`) and replace literals in components.
- Audit other components for RGBA/hex literals; enforce tokens via ESLint rule.

