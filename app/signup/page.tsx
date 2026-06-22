"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
export default function Signup() {
    const [email, setEmail] = useState("");
const [password, setPassword] = useState("");

async function handleSignup() {
  const { error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    alert(error.message);
  } else {
    alert("Account created!");
  }
}
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="bg-zinc-900 p-8 rounded-2xl w-96">
          <h1 className="text-3xl font-bold mb-6">Create Account</h1>
  
          <input
  type="email"
  placeholder="Email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  className="w-full p-3 mb-4 rounded bg-zinc-800"
/>
  
<input
  type="password"
  placeholder="Password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  className="w-full p-3 mb-4 rounded bg-zinc-800"
/>
  
<button
  onClick={handleSignup}
  className="w-full bg-blue-600 py-3 rounded-xl"
>
            Sign Up
          </button>
        </div>
      </main>
    );
  }