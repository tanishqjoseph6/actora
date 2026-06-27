export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-8 py-32 text-center">
        <h1 className="text-7xl font-bold mb-6">
          Your AI Employee For Email & Operations
        </h1>

        <p className="text-xl text-zinc-400 max-w-3xl mx-auto mb-10">
          Actora reads emails, drafts replies, schedules meetings,
          follows up with clients and automates repetitive work.
        </p>

        <div className="flex justify-center gap-4">
        <a href="/signup">
  <button className="bg-blue-600 px-8 py-4 rounded-xl font-bold">
    Sign Up
  </button>
</a>

<a href="/login">
  <button className="border border-zinc-700 px-8 py-4 rounded-xl font-bold">
    Login
  </button>
</a>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-8 pb-24">
        <div className="grid md:grid-cols-3 gap-8">

          <div className="bg-zinc-900 p-6 rounded-2xl">
            <h3 className="text-2xl font-bold mb-3">
              📧 Read Emails
            </h3>
            <p className="text-zinc-400">
              AI understands incoming emails automatically.
            </p>
          </div>

          <div className="bg-zinc-900 p-6 rounded-2xl">
            <h3 className="text-2xl font-bold mb-3">
              ⚡ Take Action
            </h3>
            <p className="text-zinc-400">
              Reply, schedule meetings and follow up automatically.
            </p>
          </div>

          <div className="bg-zinc-900 p-6 rounded-2xl">
            <h3 className="text-2xl font-bold mb-3">
              🚀 Save Time
            </h3>
            <p className="text-zinc-400">
              Focus on business while Actora handles busywork.
            </p>
          </div>

        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-6xl mx-auto px-8 pb-32">
        <h2 className="text-5xl font-bold text-center mb-4">
          Simple Pricing
        </h2>

        <p className="text-center text-zinc-400 mb-12">
          Start free. Upgrade when you need more power.
        </p>

        <div className="grid md:grid-cols-4 gap-6">

          {/* Free */}
          <div className="bg-zinc-900 p-8 rounded-2xl">
            <h3 className="text-3xl font-bold">Free</h3>

            <p className="text-5xl font-bold mt-4">$0</p>
            <p className="text-zinc-400 mb-6">Forever</p>

            <ul className="space-y-3 mb-6">
              <li>✅ 50 AI actions/month</li>
              <li>✅ 1 inbox</li>
              <li>✅ Basic email drafts</li>
              <li>✅ Community support</li>
            </ul>

            <a href="/signup">
              <button className="w-full bg-zinc-700 py-3 rounded-xl">
                Start Free
              </button>
            </a>
          </div>

          {/* Starter */}
          <div className="bg-zinc-900 p-8 rounded-2xl">
            <h3 className="text-3xl font-bold">Starter</h3>

            <p className="text-5xl font-bold mt-4">$19</p>
            <p className="text-zinc-400 mb-6">per month</p>

            <ul className="space-y-3 mb-6">
              <li>✅ 1,000 AI actions</li>
              <li>✅ 3 inboxes</li>
              <li>✅ Smart drafts</li>
              <li>✅ Meeting summaries</li>
              <li>✅ Priority support</li>
            </ul>

            <a href="/billing?plan=starter">
              <button className="w-full bg-blue-600 py-3 rounded-xl">
                Upgrade
              </button>
            </a>
          </div>

          {/* Pro */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-8 rounded-2xl">
            <h3 className="text-3xl font-bold">Pro ⭐</h3>

            <p className="text-5xl font-bold mt-4">$49</p>
            <p className="mb-6">per month</p>

            <ul className="space-y-3 mb-6">
              <li>🔥 Unlimited AI actions</li>
              <li>🔥 Unlimited inboxes</li>
              <li>🔥 AI automations</li>
              <li>🔥 AI Morning Brief</li>
              <li>🔥 Team collaboration</li>
              <li>🔥 Priority support</li>
            </ul>

            <a href="/billing?plan=pro">
              <button className="w-full bg-white text-black py-3 rounded-xl font-bold">
                Upgrade
              </button>
            </a>
          </div>

          {/* Enterprise */}
          <div className="bg-zinc-900 p-8 rounded-2xl">
            <h3 className="text-3xl font-bold">Enterprise</h3>

            <p className="text-5xl font-bold mt-4">Custom</p>
            <p className="text-zinc-400 mb-6">tailored pricing</p>

            <ul className="space-y-3 mb-6">
              <li>🚀 Unlimited AI actions</li>
              <li>🚀 Unlimited inboxes</li>
              <li>🚀 Team workspaces</li>
              <li>🚀 API access</li>
              <li>🚀 Custom integrations</li>
              <li>🚀 Dedicated account manager</li>
            </ul>

            <a href="mailto:sales@useactora.com?subject=Actora%20Enterprise%20Inquiry">
              <button className="w-full bg-red-600 py-3 rounded-xl">
                Contact Sales
              </button>
            </a>
          </div>

        </div>
      </section>
    </main>
  );
}