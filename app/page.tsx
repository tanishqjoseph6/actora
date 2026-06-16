"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const joinWaitlist = async () => {
    const { error } = await supabase
      .from("waitlist")
      .insert([{ email }]);

    if (error) {
      setMessage("Email already registered.");
    } else {
      setMessage("🎉 Successfully joined the waitlist!");
      setEmail("");
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
      <div className="max-w-2xl text-center">
        <p className="mb-4 text-blue-400 font-semibold">
          AI Inbox Assistant
        </p>

        <h1 className="text-6xl font-bold mb-6">
          Actora
        </h1>

        <p className="text-xl text-gray-300 mb-8">
          Turn your inbox into an AI employee that reads,
          prioritizes and takes action automatically.
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
            onClick={joinWaitlist}
            className="bg-blue-500 px-6 py-3 rounded-xl font-semibold"
          >
            Join Waitlist
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
      </div>
    </main>
  );
}