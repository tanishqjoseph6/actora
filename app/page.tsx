"use client";

"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [count, setCount] = useState(0);

  useEffect(() => {
    const getCount = async () => {
      const { count } = await supabase
        .from("waitlist")
        .select("*", { count: "exact", head: true });

      setCount(count || 0);
    };

    getCount();
  }, []);

  const joinWaitlist = async () => {
    if (!email) {
      setMessage("Please enter an email.");
      return;
    }

    const { error } = await supabase
      .from("waitlist")
      .insert([{ email }]);

    if (error) {
      setMessage("Email already registered.");
    } else {
      setMessage("🎉 Successfully joined the waitlist!");
      setCount((prev) => prev + 1);
      setEmail("");
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
      <div className="max-w-2xl text-center">
        <p className="mb-4 text-blue-400 font-semibold">
          Join {count}+ founders waiting for early access
        </p>

        <h1 className="text-6xl font-bold mb-4">
          Your AI Chief of Staff for Email
        </h1>

        <p className="text-xl text-gray-300 max-w-2xl mb-8">
         Actora reads, prioritizes, drafts replies,
         schedules meetings and takes action
        from your inbox automatically.
        </p>

        <div className="flex flex-col items-center gap-4">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="px-4 py-3 rounded-xl w-80 text-black"
          />

          <button
            onClick={() => signIn("google")}
            className="bg-blue-500 hover:bg-blue-600 px-6 py-3 rounded-xl font-semibold transition"
          >
            Get Early Access
          </button>

          {message && (
            <p className="text-sm mt-2">
              {message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          <div>
            <h3 className="font-bold">📩 Read Emails</h3>
            <p className="text-gray-400">
              AI understands incoming emails.
            </p>
          </div>

          <div>
            <h3 className="font-bold">⚡ Take Action</h3>
            <p className="text-gray-400">
              Reply, schedule and organize automatically.
            </p>
          </div>

          <div>
            <h3 className="font-bold">🚀 Save Time</h3>
            <p className="text-gray-400">
              Focus on work, not your inbox.
            </p>
          </div>
        </div>

        <div className="mt-16">
          <p className="text-gray-400 text-sm">
            Trusted by founders, freelancers and startup operators.
          </p>

          <div className="flex justify-center gap-6 mt-4 text-gray-500">
            <span>⚡ Faster Inbox</span>
            <span>🤖 AI Powered</span>
            <span>📈 Productivity</span>
          </div>
        </div>
      </div>
    </main>
  );
}