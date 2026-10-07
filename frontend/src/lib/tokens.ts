/**
 * Formly Design Tokens — Single Source of Truth
 * Reference: DESIGN_SPEC.md (sampled from screenshots ref-08 to ref-14)
 */

export const tokens = {
  colors: {
    // Primary plum-charcoal (buttons, text, badges, active arrows)
    primary: "#2B2530",
    primaryHover: "#3A3340",
    primaryLight: "#484050",

    // Secondary & muted text
    textSecondary: "#6B6570",
    textMuted: "#A8A3AD",
    textSubtle: "#8C8692",

    // Surfaces & background
    surfacePage: "#FFFFFF",
    surfaceCard: "#F5F5F5",
    surfaceCanvas: "#EAEAEC",
    surfaceRow: "#E0E0E2",
    surfaceRowSelected: "#FFFFFF",
    surfaceInnerCard: "#FAFAFA",

    // Accent colors
    accentPublish: "#2F7D69", // Muted green publish CTA
    accentPublishHover: "#286B5A",
    accentAiFill: "#F3EAFB", // Lavender glow
    accentAiBorder: "#8E4FC0",
    accentError: "#E53E3E",
    accentErrorBg: "#FFF5F5",

    // Borders
    border: "#E6E6E8",
    borderStrong: "#D4D2D6",

    // Question Type Pastel Colors (for icons)
    typeColors: {
      text: { bg: "#E1F0FF", text: "#0066CC" }, // light blue
      choice: { bg: "#F0E8FA", text: "#6B3FA0" }, // lavender
      rating: { bg: "#E6F4EA", text: "#137333" }, // soft green
      contact: { bg: "#FCE8E6", text: "#C5221F" }, // soft red / pink
      other: { bg: "#FEF7E0", text: "#B06000" }, // soft yellow
      structure: { bg: "#F1F3F4", text: "#3C4043" }, // soft gray
    },
  },

  radii: {
    btn: "8px",
    card: "18px",
    canvas: "20px",
    modal: "24px",
    row: "4px", // choice rows near-square
    badge: "5px",
    full: "9999px",
  },

    fonts: {
    app: "var(--font-inter), sans-serif",
    respondent: "var(--font-karla), sans-serif",
  },
} as const;

export interface AllowedFont {
  name: string;
  label: string;
  cssValue: string;
}

export const ALLOWED_FONTS: Record<string, AllowedFont> = {
  Karla: {
    name: "Karla",
    label: "Karla (Humanist Rounded - Default)",
    cssValue: "var(--font-karla), sans-serif",
  },
  Inter: {
    name: "Inter",
    label: "Inter (Neo-grotesque UI)",
    cssValue: "var(--font-inter), sans-serif",
  },
  "sans-serif": {
    name: "sans-serif",
    label: "System Sans-Serif",
    cssValue: "system-ui, -apple-system, sans-serif",
  },
};

export const ALLOWED_FONT_LIST: AllowedFont[] = Object.values(ALLOWED_FONTS);

export function resolveThemeFontCss(fontName?: string | null): string {
  if (fontName && ALLOWED_FONTS[fontName]) {
    return ALLOWED_FONTS[fontName].cssValue;
  }
  return ALLOWED_FONTS.Karla.cssValue;
}
