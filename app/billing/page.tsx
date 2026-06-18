export default function Billing() {
    return (
      <main className="min-h-screen bg-black text-white p-10">
        <h1 className="text-5xl font-bold mb-8">
          💳 Actora Pricing
        </h1>
  
        <div className="grid md:grid-cols-4 gap-6">
  
          <div className="bg-zinc-900 p-8 rounded-2xl">
            <h2 className="text-3xl font-bold">Free</h2>
            <p className="text-5xl mt-4">$0</p>
            <p className="text-gray-400 mb-6">per month</p>
  
            <button className="mt-6 w-full bg-zinc-700 py-3 rounded-xl">
              Current Plan
              <ul className="space-y-2 mb-6 mt-4">
  <li>✅ 50 AI actions/month</li>
  <li>✅ 1 inbox</li>
  <li>✅ Basic email drafts</li>
  <li>✅ Community support</li>
</ul>
            </button>
          </div>
  
          <div className="bg-zinc-900 p-8 rounded-2xl">
            <h2 className="text-3xl font-bold">Starter</h2>
            <p className="text-5xl mt-4">$19</p>
            <p className="text-gray-400 mb-6">per month</p>
            <a href="https://rzp.io/rzp/7efMgDz"target="_blank">
            <button className="mt-6 w-full bg-blue-600 py-3 rounded-xl">
              Upgrade
              <ul className="space-y-2 mb-6 mt-4">
  <li>✅ 1,000 AI actions</li>
  <li>✅ 3 inboxes</li>
  <li>✅ Smart drafts</li>
  <li>✅ Meeting summaries</li>
  <li>✅ Priority support</li>
</ul>
            </button></a>
          </div>
  
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-8 rounded-2xl">
            <h2 className="text-3xl font-bold">Pro</h2>
            <p className="text-5xl mt-4">$49</p>
            <p className="mb-6">per month</p>
            <a href="https://rzp.io/rzp/3HPkOOJH" target="_blank">
            <button className="mt-6 w-full bg-white text-black py-3 rounded-xl">
              Upgrade
              <div className="mb-3 text-sm font-bold">
  ⭐ MOST POPULAR
</div>

<ul className="space-y-2 mb-6 mt-4">
  <li>🔥 Unlimited AI actions</li>
  <li>🔥 Unlimited inboxes</li>
  <li>🔥 AI automations</li>
  <li>🔥 AI Morning Brief</li>
  <li>🔥 Team collaboration</li>
  <li>🔥 Priority support</li>
</ul>
            </button></a>
          </div>
  
          <div className="bg-zinc-900 p-8 rounded-2xl">
  <h2 className="text-3xl font-bold">Enterprise</h2>

  <p className="text-5xl mt-4">$399</p>
  <p className="text-gray-400 mb-6">per month</p>

  {/* FEATURES YAHAN */}
  <ul className="space-y-2 mb-6">
    <li>🚀 Unlimited AI actions</li>
    <li>🚀 Unlimited inboxes</li>
    <li>🚀 Team workspaces</li>
    <li>🚀 API access</li>
    <li>🚀 Custom integrations</li>
    <li>🚀 Dedicated account manager</li>
  </ul>

  <button className="mt-6 w-full bg-red-600 py-3 rounded-xl">
    Start Enterprise
  </button>
</div>
  
        </div>
      </main>
    );
  }