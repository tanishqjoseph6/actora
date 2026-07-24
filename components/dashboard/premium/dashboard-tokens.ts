/** Shared dashboard surface tokens — matches landing (black + electric blue) */
export const dashboard = {
  bg: "bg-[#0A0A0A]",
  surface: "bg-[#111111]",
  card: "bg-[#111111]",
  border: "border-white/[0.06]",
  cardBase:
    "rounded-[18px] border border-white/[0.06] bg-[#111111] shadow-sm",
  cardHover:
    "hover:border-[#3B82F6]/35 transition-all duration-300 hover:-translate-y-0.5",
  cardInteractive:
    "rounded-[18px] border border-white/[0.06] bg-[#111111] shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#3B82F6]/35 interactive-press",
  cardLg:
    "rounded-[20px] border border-white/[0.06] bg-[#111111] shadow-sm",
  panel: "rounded-[18px] border border-white/[0.06] bg-[#111111] p-4 sm:p-6",
  panelLg:
    "rounded-[20px] border border-white/[0.06] bg-[#111111] p-5 sm:p-6 lg:p-8 shadow-sm",
  pageTitle:
    "text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-white",
  pagePadding: "p-4 sm:p-6 md:p-8 lg:p-10",
  pageMaxWidth: "max-w-[1600px] mx-auto w-full",
  input:
    "w-full rounded-xl bg-[#0A0A0A] border border-white/[0.08] text-sm text-white placeholder:text-[#71717A] focus:outline-none focus:border-[#3B82F6]/50 focus:ring-1 focus:ring-[#3B82F6]/20 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#3B82F6]/30",
  btnPrimary:
    "inline-flex items-center justify-center bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium rounded-xl transition-all duration-200 interactive-press active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A]",
  btnSecondary:
    "inline-flex items-center justify-center border border-white/[0.1] bg-white/[0.02] hover:border-white/[0.18] hover:bg-white/[0.04] text-white font-medium rounded-xl transition-all duration-200 interactive-press active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A]",
  muted: "text-[#A1A1AA]",
  subtle: "text-[#71717A]",
  accent: "text-[#3B82F6]",
  textLink: "text-[#3B82F6] hover:text-[#93C5FD] transition-colors",
} as const;
