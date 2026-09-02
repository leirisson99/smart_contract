/**
 * Nomes dos tokens de cor e tipografia do design system "Patrimônio Digital"
 * (ver `app/globals.css`). Compartilhado entre `lib/utils.ts` (cx) e `lib/tv.ts`
 * (tv) para que o tailwind-merge reconheça esses tokens customizados e não os
 * descarte como conflitantes com utilities nativas do Tailwind.
 */
export const colorTokens = [
  "primary",
  "primary-container",
  "on-primary",
  "on-primary-container",
  "secondary",
  "secondary-container",
  "on-secondary",
  "on-secondary-container",
  "surface",
  "surface-container-lowest",
  "surface-container-low",
  "surface-container",
  "surface-container-high",
  "surface-container-highest",
  "on-surface",
  "on-surface-variant",
  "outline",
  "outline-variant",
  "error",
  "error-container",
  "on-error",
  "on-error-container",
  "warning",
  "warning-container",
  "on-warning-container",
  "background",
  "foreground",
]

export const fontSizeTokens = [
  "display-lg",
  "headline-lg",
  "headline-lg-mobile",
  "title-md",
  "body-lg",
  "body-md",
  "label-sm",
  "mono-label",
]
