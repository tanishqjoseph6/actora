/** Shared dashboard surface tokens — black + blue only */
export const dashboard = {
  bg: "bg-[#05070B]",
  surface: "bg-[#0B1220]",
  card: "bg-[#111827]",
  border: "border-[#1E293B]",
  cardBase:
    "rounded-xl border border-[#1E293B] bg-[#111827] shadow-sm",
  cardHover:
    "hover:border-[#2563EB]/40 transition-colors duration-200",
  cardInteractive:
    "rounded-xl border border-[#1E293B] bg-[#111827] shadow-sm interactive-lift interactive-press hover:border-[#2563EB]/40",
  cardLg:
    "rounded-2xl border border-[#1E293B] bg-[#111827] shadow-sm interactive-lift",
  panel: "rounded-xl border border-[#1E293B] bg-[#111827] p-4 sm:p-6",
  panelLg:
    "rounded-2xl border border-[#1E293B] bg-[#111827] p-5 sm:p-6 lg:p-8 shadow-sm",
  pageTitle: "text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white",
  pagePadding: "p-4 sm:p-6 md:p-8 lg:p-10",
  pageMaxWidth: "max-w-[1600px] mx-auto w-full",
  input:
    "w-full rounded-xl bg-[#0B1220] border border-[#1E293B] text-sm text-white placeholder:text-[#64748B] focus:outline-none focus:border-[#2563EB]/50 focus:ring-1 focus:ring-[#2563EB]/20 transition-all duration-200",
  btnPrimary:
    "inline-flex items-center justify-center bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold rounded-xl transition-all duration-200 interactive-press hover:shadow-lg hover:shadow-[#2563EB]/20",
  btnSecondary:
    "inline-flex items-center justify-center border border-[#1E293B] bg-[#111827] hover:border-[#2563EB]/50 text-white font-medium rounded-xl transition-all duration-200 interactive-press",
  muted: "text-[#94A3B8]",
  subtle: "text-[#64748B]",
  accent: "text-[#3B82F6]",
  textLink: "text-[#3B82F6] hover:text-[#93C5FD] transition-colors",
} as const;
