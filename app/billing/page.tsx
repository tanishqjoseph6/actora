export default function Billing() {
  return (
    <main className="min-h-screen bg-[#050816] text-white px-8 py-20">
      <div className="text-center mb-16">
        <div className="inline-block px-4 py-1 mb-4 text-blue-500 border border-blue-500 rounded-full text-sm">
          PRICING
        </div>

        <h1 className="text-6xl font-bold">
          Simple <span className="text-blue-500">Pricing</span>
        </h1>

        <p className="text-gray-400 mt-4 text-lg">
          Scale your inbox automation as your business grows
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-8 max-w-7xl mx-auto">

        {/* FREE */}
        <div className="bg-[#0B1120] border border-zinc-800 p-8 rounded-3xl">
          <h2 className="text-3xl font-bold">Free</h2>

          <p className="text-6xl mt-4 font-bold">$0</p>
          <p className="text-gray-400 mb-6">Forever</p>

          <ul className="space-y-3 mb-8">
            <li>✓ 50 AI actions/month</li>
            <li>✓ 1 inbox</li>
            <li>✓ Basic email drafts</li>
            <li>✓ Community support</li>
          </ul>

          <button className="w-full border border-blue-500 text-blue-400 py-3 rounded-xl hover:bg-blue-500 hover:text-white transition">
            Start Free
          </button>
        </div>

        {/* STARTER */}
        <div className="bg-gradient-to-b from-[#0B1120] to-[#101C38] border border-blue-700/50 p-8 rounded-3xl hover:scale-105 hover:border-cyan-400 tansition-all duration-300">
          <div className="mb-3">
            <span className="bg-blue-500/20 text-blue-400 text-xs font-semibold px-3 py-1 rounded-full border border-blue-500/30">
              ⚡️ BEST FOR STARTUPS
            </span>
          </div>

          <h2 className="text-3xl font-bold text-white">
            Starter
          </h2>
          <p className="text-cyan-300 text-sm mb-1">
            Perfect for growing businesses
          </p>

          <p className="text-6xl mt-4 font-bold text-cyan-400">$19</p>
          <p className="text-gray-400 mb-6">per month</p>

          <ul className="space-y-3 mb-8">
            <li>✓ 1,000 AI actions</li>
            <li>✓ 3 inboxes</li>
            <li>✓ Smart drafts</li>
            <li>✓ Meeting summaries</li>
            <li>✓ Priority support</li>
          </ul>
          <div className="h-6"></div>
          <button
  className="w-full bg-gradient-to-r from-blue-600 to-cyan-400 py-3 rounded-xl font-semibold shadow-lg shadow-blue-500/30 hover:scale-105 transition-all duration-300"
>
<div className="h-6"></div>
  Upgrade
</button>
      </div>

      {/* PRO */}
      <div className="relative bg-[#081226] border-2 border-cyan-400 p-8 rounded-3xl scale-110 shadow-[0_0_60px_rgba(34,211,238,0.45)] hover:scale-110 transition-all duration-300">

      <div className="mb-3">
      <div className="inline-block bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-1 rounded-full text-xs font-semibold text-black">
         🚀 MOST POPULAR
       </div>
      </div>

        <h2 className="text-3xl font-bold">Pro</h2>
        <p className="text-cyan-300 text-sm mb-3">
        For power users & teams
        </p>

        <p className="text-6xl mt-4 font-bold text-cyan-300">$49</p>
        <p className="text-gray-400 mb-6">per month</p>

        <ul className="space-y-3 mb-8">
          <li>✓ Unlimited AI actions</li>
          <li>✓ Unlimited inboxes</li>
          <li>✓ AI automations</li>
          <li>✓ AI Morning Brief</li>
          <li>✓ Team collaboration</li>
          <li>✓ Priority support</li>
        </ul>
        <div className="h-6"></div>
        <button className="w-full bg-gradient-to-r from-cyan-400 to-blue-500 py-3 rounded-xl font-semibold shadow-[0_0_30px_rgba(34,211,238,0.5)] hover:scale-105 transition-all duration-300">
          Upgrade
        </button>
      </div>

      {/* ENTERPRISE */}
      <div className="bg-[#0B1120] border border-blue-900/40 p-8 rounded-3xl">
        <h2 className="text-3xl font-bold">Enterprise</h2>
        <p className="text-blue-400 text-sm mt-1">
          For large teams & organizations
        </p>

        <p className="text-4xl mt-4 font-bold text-cyan-400">
          Let's Talk
        </p>


        <ul className="space-y-3 mb-8">
          <li>✓ Unlimited AI actions</li>
          <li>✓ Unlimited inboxes</li>
          <li>✓ Team workspaces</li>
          <li>✓ API access</li>
          <li>✓ Custom integrations</li>
          <li>✓ Dedicated account manager</li>
        </ul>

        <button className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-xl transition">
          Book Demo
        </button>
      </div>

    </div>
    </main >
  );
}