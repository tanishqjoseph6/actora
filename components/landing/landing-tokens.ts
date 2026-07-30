/** Shared landing page design tokens — matte black + electric blue (#2563EB) */
export const landing = {
  bg: "#0A0A0A",
  surface: "#111111",
  surfaceElevated: "#141414",
  border: "border-white/[0.06]",
  borderHover: "border-[#2563EB]/35",
  accent: "#2563EB",
  accentLight: "#3B82F6",
  accentGlow: "shadow-[0_0_40px_rgba(37,99,235,0.25)]",
  text: "text-white",
  muted: "text-[#A1A1AA]",
  subtle: "text-[#71717A]",
  glass:
    "border border-white/[0.08] bg-[#111111]/60 backdrop-blur-xl",
  glassHover:
    "hover:border-[#2563EB]/30 hover:bg-[#111111]/80 hover:shadow-[0_8px_32px_rgba(37,99,235,0.12)]",
  section: "py-20 sm:py-28 lg:py-32",
  container: "mx-auto max-w-6xl px-5 sm:px-8",
  rounded: "rounded-[20px]",
  roundedLg: "rounded-[24px]",
} as const;

export const BRAND_TAGLINE = "Where conversations become execution.";
