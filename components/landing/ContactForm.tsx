"use client";

import { useState } from "react";
import { FadeUp } from "./motion";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sent">("idle");

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const subject = encodeURIComponent(`Actora inquiry from ${name || "website"}`);
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\nCompany: ${company}\n\n${message}`
    );
    window.location.href = `mailto:sales@useactora.com?subject=${subject}&body=${body}`;
    setStatus("sent");
  }

  return (
    <FadeUp>
      <form
        onSubmit={onSubmit}
        className="rounded-[18px] border border-white/[0.06] bg-[#111111] p-6 sm:p-8"
        noValidate
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-medium text-[#71717A]">Name</span>
            <input
              required
              name="name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-white/[0.08] bg-black/40 px-3 py-2.5 text-sm text-white outline-none placeholder:text-[#52525B] focus:border-[#3B82F6]/50"
              placeholder="Your name"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-[#71717A]">Work email</span>
            <input
              required
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-white/[0.08] bg-black/40 px-3 py-2.5 text-sm text-white outline-none placeholder:text-[#52525B] focus:border-[#3B82F6]/50"
              placeholder="you@company.com"
            />
          </label>
        </div>

        <label className="mt-5 block">
          <span className="text-xs font-medium text-[#71717A]">Company</span>
          <input
            name="company"
            autoComplete="organization"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-white/[0.08] bg-black/40 px-3 py-2.5 text-sm text-white outline-none placeholder:text-[#52525B] focus:border-[#3B82F6]/50"
            placeholder="Company name"
          />
        </label>

        <label className="mt-5 block">
          <span className="text-xs font-medium text-[#71717A]">Message</span>
          <textarea
            required
            name="message"
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="mt-1.5 w-full resize-y rounded-xl border border-white/[0.08] bg-black/40 px-3 py-2.5 text-sm text-white outline-none placeholder:text-[#52525B] focus:border-[#3B82F6]/50"
            placeholder="Tell us about your team and what you want to solve."
          />
        </label>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-[#3B82F6] px-6 text-sm font-medium text-white transition-all hover:bg-[#2563EB] active:scale-[0.98]"
          >
            Send message
          </button>
          <a
            href="mailto:sales@useactora.com"
            className="text-sm text-[#93C5FD] transition-colors hover:text-white"
          >
            or email sales@useactora.com
          </a>
        </div>

        {status === "sent" && (
          <p className="mt-4 text-xs text-[#71717A]" role="status">
            Opening your email client… If nothing opens, write us at
            sales@useactora.com.
          </p>
        )}
      </form>
    </FadeUp>
  );
}
