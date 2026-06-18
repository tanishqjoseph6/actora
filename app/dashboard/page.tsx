export default function Dashboard() {
  return (
    <main className="flex min-h-screen bg-black text-white">
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-800 p-6">
        <h1 className="text-3xl font-bold mb-10">🚀 Actora</h1>

        <nav className="space-y-5 text-lg">
          <div>🏠 Dashboard</div>
          <div>📧 Inbox</div>
          <div>📅 Meetings</div>
          <div>🤖 AI Actions</div>
          <div>💳 Billing</div>
          <div>⚙️ Settings</div>
        </nav>

        <div className="mt-12 bg-gradient-to-r from-purple-600 to-pink-600 p-4 rounded-xl">
          <h3 className="font-bold">PRO PLAN</h3>
          <p className="text-sm">Unlock unlimited AI actions</p>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Actora</h1>

          <button className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-xl">
            Logout
          </button>
        </div>

        {/* Welcome Card */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-2xl mb-8">
          <h2 className="text-3xl font-bold">
            Welcome Back, Founder 👋
          </h2>

          <p className="mt-2 text-lg">
            Today Actora processed 12 emails, drafted 4 replies,
            and saved 6.4 hours of work.
          </p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-zinc-900 p-6 rounded-2xl">
            <h2 className="text-xl font-semibold">📧 Emails</h2>
            <p className="text-4xl mt-3">12</p>
            <p className="text-gray-400">Unread</p>
          </div>

          <div className="bg-zinc-900 p-6 rounded-2xl">
            <h2 className="text-xl font-semibold">⚡ Tasks</h2>
            <p className="text-4xl mt-3">7</p>
            <p className="text-gray-400">Pending</p>
          </div>

          <div className="bg-zinc-900 p-6 rounded-2xl">
            <h2 className="text-xl font-semibold">⏱ Time Saved</h2>
            <p className="text-4xl mt-3">6.4h</p>
            <p className="text-gray-400">This Week</p>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* AI Brief */}
          <div className="bg-zinc-900 p-6 rounded-2xl">
            <h2 className="text-2xl font-bold mb-4">
              AI Morning Brief
            </h2>

            <ul className="space-y-3">
              <li>📧 12 new emails</li>
              <li>📅 2 meetings today</li>
              <li>⚠️ 1 urgent client message</li>
              <li>🤖 4 replies drafted automatically</li>
            </ul>
          </div>

          {/* Suggested Actions */}
          <div className="bg-zinc-900 p-6 rounded-2xl">
            <h2 className="text-2xl font-bold mb-4">
              Suggested Actions
            </h2>

            <ul className="space-y-3">
              <li>✅ Reply to investor email</li>
              <li>✅ Schedule product demo</li>
              <li>✅ Follow up with client</li>
            </ul>
          </div>

          {/* Recent Emails */}
          <div className="bg-zinc-900 p-6 rounded-2xl">
            <h2 className="text-2xl font-bold mb-4">
              Recent Emails
            </h2>

            <ul className="space-y-3">
              <li>📨 Investor asking for product demo</li>
              <li>📨 Client requesting proposal update</li>
              <li>📨 Team weekly progress report</li>
              <li>📨 Partnership inquiry received</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}