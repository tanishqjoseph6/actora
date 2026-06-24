"use client";

import { useEffect, useState } from "react";

export default function Dashboard() {
  const [emails, setEmails] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/gmail")
      .then((res) => res.json())
      .then((data) => {
        setEmails(data.messages || []);
      })
      .catch(() => {
        setEmails([]);
      });
  }, []);

  return (
    <main className="min-h-screen bg-[#050816] text-white overflow-hidden">
      {/* Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-cyan-500/10 blur-[220px] rounded-full pointer-events-none" />

      <div className="relative z-10 flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-screen border-r border-cyan-400/20 bg-[#081226]/70 backdrop-blur-xl p-6">
          <h1 className="text-4xl font-bold text-cyan-400 mb-10">
            Actora
          </h1>

          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-400/20">
              📥 Inbox
            </div>

            <div className="p-3 rounded-xl hover:bg-cyan-500/10 cursor-pointer">
              ⚡ Actions
            </div>

            <div className="p-3 rounded-xl hover:bg-cyan-500/10 cursor-pointer">
              📅 Meetings
            </div>

            <div className="p-3 rounded-xl hover:bg-cyan-500/10 cursor-pointer">
              📝 Tasks
            </div>

            <div className="p-3 rounded-xl hover:bg-cyan-500/10 cursor-pointer">
              📊 Analytics
            </div>

            <div className="p-3 rounded-xl hover:bg-cyan-500/10 cursor-pointer">
              ⚙️ Settings
            </div>
          </div>

          <div className="mt-16 pt-6 border-t border-cyan-400/20">
            <p className="text-cyan-400 font-semibold">Tanishq</p>
            <p className="text-gray-400 text-sm">Founder</p>
          </div>
        </aside>

        {/* Main Content */}
        <section className="flex-1 p-10">
          {/* Header */}
          <div className="mb-10">
            <div className="inline-block px-4 py-1 rounded-full border border-cyan-400 text-cyan-400 text-sm mb-4">
              ⚡ AI POWERED WORKSPACE
            </div>

            <h1 className="text-6xl font-bold">
              Inbox{" "}
              <span className="text-cyan-400">
                Dashboard
              </span>
            </h1>

            <p className="text-gray-400 mt-4 text-lg">
              Manage emails, meetings and operations from one place.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
            <StatCard title="Total Emails" value={emails.length} />
            <StatCard title="AI Drafts" value={0} />
            <StatCard title="Meetings" value={0} />
            <StatCard title="Tasks" value={0} />
            <StatCard title="Unread" value={0} />
            <StatCard title="AI Actions" value={0} />
          </div>

          {/* Recent Emails */}
          <div className="bg-[#081226] border border-cyan-400/20 rounded-3xl p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6">
              Recent Emails
            </h2>

            {emails.length === 0 ? (
              <p className="text-gray-400">
                No emails found
              </p>
            ) : (
              <div className="space-y-4">
                {emails.map((email) => (
                  <div
                    key={email.id}
                    className="bg-[#0d1730] border border-cyan-400/10 rounded-2xl p-4"
                  >
                    <p className="text-cyan-300">
                      {email.id}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-[#081226] border border-cyan-400/20 rounded-3xl p-8">
              <h3 className="text-xl font-bold mb-4">
                Today's Summary
              </h3>

              <p className="text-gray-400">
                No activity yet.
              </p>
            </div>

            <div className="bg-[#081226] border border-cyan-400/20 rounded-3xl p-8">
              <h3 className="text-xl font-bold mb-4">
                Upcoming Tasks
              </h3>

              <p className="text-gray-400">
                No pending tasks.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function StatCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="bg-[#081226] border border-cyan-400/20 rounded-3xl p-6">
      <h3 className="text-gray-400">
        {title}
      </h3>

      <p className="text-4xl font-bold text-cyan-400 mt-2">
        {value}
      </p>
    </div>
  );
}