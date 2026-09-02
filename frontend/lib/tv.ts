import { createTV } from "tailwind-variants"
import { colorTokens, fontSizeTokens } from "./design-tokens"

/**
 * Instância de `tv` compartilhada por todos os componentes de `components/ui`.
 * `tailwind-variants` mescla classes via tailwind-merge internamente — sem essa
 * extensão ele confunde tokens de cor customizados (`text-on-primary`) com tokens
 * de tamanho de fonte customizados (`text-body-md`), por compartilharem o prefixo
 * `text-`, e descarta um dos dois como "conflitante".
 */
export const tv = createTV({
  twMergeConfig: {
    extend: {
      classGroups: {
        "text-color": [{ text: colorTokens }],
        "bg-color": [{ bg: colorTokens }],
        "border-color": [{ border: colorTokens }],
        "font-size": [{ text: fontSizeTokens }],
      },
    },
  },
})
