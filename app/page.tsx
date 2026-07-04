export default function Home() {
  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <section className="max-w-6xl mx-auto px-6 sm:px-8 py-24 sm:py-32 text-center">
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold mb-6 tracking-tight">
          Your AI Employee For Email & Operations
        </h1>

        <p className="text-lg sm:text-xl text-[#94A3B8] max-w-3xl mx-auto mb-10">
          Actora reads emails, drafts replies, schedules meetings,
          follows up with clients and automates repetitive work.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
          <a href="/signup">
            <button className="w-full sm:w-auto bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-8 py-3.5 rounded-xl font-semibold transition-colors">
              Sign Up
            </button>
          </a>
          <a href="/login">
            <button className="w-full sm:w-auto border border-[#1E293B] bg-[#111827] hover:border-[#2563EB]/50 text-white px-8 py-3.5 rounded-xl font-semibold transition-colors">
              Login
            </button>
          </a>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 sm:px-8 pb-24">
        <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
          {[
            { title: "Read Emails", desc: "AI understands incoming emails automatically." },
            { title: "Take Action", desc: "Reply, schedule meetings and follow up automatically." },
            { title: "Save Time", desc: "Focus on business while Actora handles busywork." },
          ].map((feature) => (
            <div
              key={feature.title}
              className="bg-[#111827] border border-[#1E293B] p-6 rounded-xl shadow-sm hover:border-[#2563EB]/40 transition-colors"
            >
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-[#94A3B8] text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 sm:px-8 pb-32">
        <h2 className="text-3xl sm:text-5xl font-bold text-center mb-3">Simple Pricing</h2>
        <p className="text-center text-[#94A3B8] mb-12">Start free. Upgrade when you need more power.</p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <PricingCard
            name="Free"
            price="$0"
            suffix="Forever"
            features={["50 AI actions/month", "1 inbox", "Basic email drafts", "Community support"]}
            cta="Start Free"
            href="/signup"
            variant="outline"
          />
          <PricingCard
            name="Team"
            price="$19"
            suffix="per month"
            features={["1,000 AI actions", "3 inboxes", "Smart drafts", "Meeting summaries", "Priority support"]}
            cta="Upgrade"
            href="/billing?plan=starter"
            variant="primary"
          />
          <PricingCard
            name="Pro"
            price="$49"
            suffix="per month"
            features={["Unlimited AI actions", "Unlimited inboxes", "AI automations", "AI Morning Brief", "Team collaboration"]}
            cta="Upgrade"
            href="/billing?plan=pro"
            variant="featured"
            badge="Recommended"
          />
          <PricingCard
            name="Enterprise"
            price="Custom"
            suffix="tailored pricing"
            features={["Unlimited AI actions", "Custom integrations", "Dedicated support", "SLA guarantees"]}
            cta="Contact Sales"
            href="/billing?plan=enterprise"
            variant="outline"
          />
        </div>
      </section>
    </main>
  );
}

function PricingCard({
  name,
  price,
  suffix,
  features,
  cta,
  href,
  variant,
  badge,
}: {
  name: string;
  price: string;
  suffix: string;
  features: string[];
  cta: string;
  href: string;
  variant: "outline" | "primary" | "featured";
  badge?: string;
}) {
  const isFeatured = variant === "featured";

  return (
    <div
      className={`flex flex-col p-6 sm:p-8 rounded-xl ${
        isFeatured
          ? "bg-[#111827] border-2 border-[#2563EB]/50 shadow-lg shadow-black/40"
          : "bg-[#111827] border border-[#1E293B] shadow-sm"
      }`}
    >
      {badge && (
        <span className="inline-flex self-start px-3 py-1 rounded-full bg-[#2563EB] text-white text-xs font-semibold mb-4">
          {badge}
        </span>
      )}
      <h3 className="text-2xl font-bold">{name}</h3>
      <p className="text-4xl font-bold mt-3">{price}</p>
      <p className="text-[#64748B] text-sm mb-6">{suffix}</p>
      <ul className="space-y-2.5 mb-8 flex-1 text-sm text-[#94A3B8]">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <span className="text-[#2563EB] shrink-0">✓</span>
            {f}
          </li>
        ))}
      </ul>
      <a href={href}>
        <button
          className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors ${
            variant === "primary" || variant === "featured"
              ? "bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
              : "border border-[#1E293B] text-white bg-[#050816] hover:border-[#2563EB]/50"
          }`}
        >
          {cta}
        </button>
      </a>
    </div>
  );
}
