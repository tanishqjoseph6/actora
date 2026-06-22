"use client";

import { signIn } from "next-auth/react";
export default function ConnectGmailPage() {
    return (
      <main className="min-h-screen bg-black text-white p-10">
        <h1 className="text-5xl font-bold mb-6">
          📧 Connect Gmail
        </h1>
  
        <div className="p-6 bg-zinc-900 rounded-xl">
          <p className="text-zinc-300">
            Gmail integration will be connected here.
          </p>
  
          <button
            className="mt-6 px-5 py-3 bg-blue-500 rounded-lg"
             onClick={() => signIn("google")}
          >
              Connect Google Account
         </button>
        </div>
      </main>
    );
  }