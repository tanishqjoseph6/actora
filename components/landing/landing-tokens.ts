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
  neonBorder:
    "border border-[#2563EB]/25 shadow-[0_0_0_1px_rgba(37,99,235,0.08),0_20px_70px_rgba(0,0,0,0.32)]",
  neonBorderHover:
    "hover:border-[#3B82F6]/45 hover:shadow-[0_0_0_1px_rgba(59,130,246,0.18),0_24px_80px_rgba(37,99,235,0.14)]",
  grid:
    "bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:56px_56px]",
  section: "py-16 sm:py-24 md:py-28 lg:py-32",
  container: "mx-auto max-w-6xl px-4 sm:px-6 md:px-8",
  containerTight: "mx-auto max-w-6xl px-4 sm:px-6",
  rounded: "rounded-[20px]",
  roundedLg: "rounded-[24px]",
} as const;

export const BRAND_TAGLINE = "Where conversations become execution.";
