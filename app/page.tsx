import { PricingSection } from "@/components/billing/PricingSection";

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

      <div className="max-w-7xl mx-auto px-5 sm:px-8 pb-32">
        <PricingSection
          title="Pricing"
          subtitle="Start free. Upgrade when you need more power."
          mode="marketing"
        />
      </div>
    </main>
  );
}
