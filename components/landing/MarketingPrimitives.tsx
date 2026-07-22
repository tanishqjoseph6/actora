import Link from "next/link";

export function MarketingPageHero({
  badge,
  title,
  subtitle,
}: {
  badge: string;
  title: string;
  subtitle: string;
}) {
  return (
    <header className="border-b border-white/[0.06] pb-12 pt-28 sm:pb-16 sm:pt-36">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <p className="text-sm font-medium tracking-wide text-[#3B82F6]">{badge}</p>
        <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl lg:leading-[1.1]">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#A1A1AA] sm:text-lg">
          {subtitle}
        </p>
      </div>
    </header>
  );
}

export function MarketingCtaBand({
  title = "Ready to turn conversations into execution?",
  subtitle = "Start free for 14 days. No credit card required.",
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <section className="border-t border-white/[0.06] py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-5 text-center sm:px-8">
        <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          {title}
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm text-[#A1A1AA] sm:text-base">
          {subtitle}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/signup"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-[#3B82F6] px-6 text-sm font-medium text-white transition-all hover:bg-[#2563EB] active:scale-[0.98]"
          >
            Get Started
          </Link>
          <Link
            href="/contact"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-white/[0.1] bg-white/[0.02] px-6 text-sm font-medium text-white transition-all hover:border-white/[0.18] hover:bg-white/[0.04]"
          >
            Talk to sales
          </Link>
        </div>
      </div>
    </section>
  );
}

export function LegalProse({ children }: { children: React.ReactNode }) {
  return (
    <article className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
      <div className="space-y-8 text-sm leading-relaxed text-[#A1A1AA] sm:text-[15px] [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-white [&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-white [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_a]:text-[#93C5FD] [&_a]:underline-offset-2 hover:[&_a]:underline">
        {children}
      </div>
    </article>
  );
}
