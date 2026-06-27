"use client";

import { useCallback, useEffect, useState } from "react";
import type { EmailDetail, InboxEmail } from "@/lib/gmail";
import { getAvatarGradient, getInitials } from "@/lib/avatar";

type EmailDetailPanelProps = {
  email: InboxEmail;
  onClose: () => void;
};

type PanelState = "loading" | "ready" | "error";

export function EmailDetailPanel({ email, onClose }: EmailDetailPanelProps) {
  const [detail, setDetail] = useState<EmailDetail | null>(null);
  const [panelState, setPanelState] = useState<PanelState>("loading");
  const [panelError, setPanelError] = useState<string | null>(null);

  const [replyText, setReplyText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState(false);

  const loadDetail = useCallback(async () => {
    setPanelState("loading");
    setPanelError(null);
    setReplyText("");
    setActionError(null);
    setSendSuccess(false);

    try {
      const res = await fetch(`/api/gmail/${email.id}`);
      const data = await res.json();

      if (!res.ok) {
        setPanelState("error");
        setPanelError(data.error ?? "Failed to load email");
        return;
      }

      setDetail(data.email);
      setPanelState("ready");
    } catch {
      setPanelState("error");
      setPanelError("Failed to load email. Please try again.");
    }
  }, [email.id]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const handleGenerateReply = async () => {
    if (!detail) return;

    setIsGenerating(true);
    setActionError(null);
    setSendSuccess(false);

    try {
      const res = await fetch("/api/gmail/ai-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: detail.sender,
          subject: detail.subject,
          emailBody: detail.body,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setActionError(data.error ?? "Failed to generate reply");
        return;
      }

      setReplyText(data.reply);
    } catch {
      setActionError("Failed to generate reply. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!replyText) return;

    try {
      await navigator.clipboard.writeText(replyText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      setActionError("Failed to copy to clipboard.");
    }
  };

  const handleSend = async () => {
    if (!detail || !replyText.trim()) return;

    setIsSending(true);
    setActionError(null);
    setSendSuccess(false);

    try {
      const res = await fetch("/api/gmail/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId: detail.threadId,
          to: detail.senderEmail,
          subject: detail.subject,
          replyBody: replyText,
          inReplyTo: detail.messageIdHeader || undefined,
          references: detail.messageIdHeader || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setActionError(data.error ?? "Failed to send email");
        return;
      }

      setSendSuccess(true);
    } catch {
      setActionError("Failed to send email. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const initials = getInitials(email.sender);
  const gradient = getAvatarGradient(email.sender);

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:bg-black/40"
        onClick={onClose}
        aria-hidden
      />

      <aside
        className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] lg:w-[540px] bg-[#081226] border-l border-cyan-400/20 shadow-2xl shadow-black/50 flex flex-col animate-slide-in-right"
        role="dialog"
        aria-modal
        aria-label="Email detail"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-cyan-400/10 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`shrink-0 w-10 h-10 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-sm font-semibold text-white`}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-white truncate">{email.sender}</p>
              <p className="text-xs text-gray-500">{email.date}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 p-2 rounded-lg text-gray-400 hover:text-white hover:bg-cyan-500/10 transition-colors"
            aria-label="Close panel"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {panelState === "loading" && (
            <div className="p-5 space-y-4 animate-pulse">
              <div className="h-6 w-3/4 bg-cyan-400/10 rounded" />
              <div className="h-4 w-1/4 bg-cyan-400/10 rounded" />
              <div className="space-y-2 pt-4">
                <div className="h-3 w-full bg-cyan-400/10 rounded" />
                <div className="h-3 w-full bg-cyan-400/10 rounded" />
                <div className="h-3 w-2/3 bg-cyan-400/10 rounded" />
              </div>
            </div>
          )}

          {panelState === "error" && (
            <div className="p-5">
              <div className="bg-[#0d1730] border border-red-400/20 rounded-2xl p-6 text-center">
                <p className="text-red-300 font-medium mb-2">Could not load email</p>
                <p className="text-gray-400 text-sm mb-4">{panelError}</p>
                <button
                  onClick={loadDetail}
                  className="px-4 py-2 rounded-lg border border-cyan-400/30 text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                >
                  Try again
                </button>
              </div>
            </div>
          )}

          {panelState === "ready" && detail && (
            <div className="p-5">
              <h2 className="text-xl font-bold text-white mb-1">{detail.subject}</h2>
              <time className="text-sm text-gray-500">{detail.date}</time>

              <div className="mt-6 p-4 rounded-2xl bg-[#0d1730]/60 border border-cyan-400/10">
                <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {detail.body || "No content available."}
                </p>
              </div>

              {/* AI Reply section */}
              <div className="mt-8 pt-6 border-t border-cyan-400/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <SparkleIcon className="w-5 h-5 text-cyan-400" />
                    AI Reply
                  </h3>
                  <button
                    onClick={handleGenerateReply}
                    disabled={isGenerating}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 text-sm font-medium hover:bg-cyan-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? (
                      <>
                        <LoadingSpinner />
                        Generating…
                      </>
                    ) : (
                      <>
                        <SparkleIcon className="w-4 h-4" />
                        AI Reply
                      </>
                    )}
                  </button>
                </div>

                {isGenerating && !replyText && (
                  <div className="rounded-2xl border border-cyan-400/10 bg-[#0d1730]/40 p-6 flex flex-col items-center justify-center gap-3">
                    <LoadingSpinner size="lg" />
                    <p className="text-sm text-gray-400 animate-pulse">
                      Crafting your professional reply…
                    </p>
                  </div>
                )}

                {(replyText || !isGenerating) && (
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Click AI Reply to generate a response, or write your own…"
                    rows={8}
                    className="w-full px-4 py-3 rounded-2xl bg-[#0d1730] border border-cyan-400/10 text-white placeholder:text-gray-600 text-sm leading-relaxed resize-none focus:outline-none focus:border-cyan-400/40 focus:ring-1 focus:ring-cyan-400/20 transition-all"
                  />
                )}

                {actionError && (
                  <p className="mt-3 text-sm text-red-300">{actionError}</p>
                )}

                {sendSuccess && (
                  <p className="mt-3 text-sm text-emerald-400">
                    Reply sent successfully!
                  </p>
                )}

                {replyText && (
                  <div className="flex flex-wrap gap-3 mt-4">
                    <button
                      onClick={handleCopy}
                      disabled={!replyText}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-cyan-400/20 text-gray-300 text-sm font-medium hover:bg-cyan-500/10 hover:text-white transition-all duration-200"
                    >
                      <CopyIcon className="w-4 h-4" />
                      {copySuccess ? "Copied!" : "Copy"}
                    </button>
                    <button
                      onClick={handleSend}
                      disabled={isSending || !replyText.trim()}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 text-[#050816] text-sm font-semibold hover:bg-cyan-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSending ? (
                        <>
                          <LoadingSpinner dark />
                          Sending…
                        </>
                      ) : (
                        <>
                          <SendIcon className="w-4 h-4" />
                          Send
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

function LoadingSpinner({
  size = "sm",
  dark = false,
}: {
  size?: "sm" | "lg";
  dark?: boolean;
}) {
  const sizeClass = size === "lg" ? "w-8 h-8" : "w-4 h-4";
  const colorClass = dark
    ? "border-white/30 border-t-[#050816]"
    : "border-cyan-400/30 border-t-cyan-400";

  return (
    <span
      className={`inline-block ${sizeClass} border-2 ${colorClass} rounded-full animate-spin`}
    />
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.813 2.659a.75.75 0 01.874 0l1.33.774a.75.75 0 00.874 0l1.33-.774a.75.75 0 011.374.42l.307 1.518a.75.75 0 00.574.574l1.518.307a.75.75 0 010 1.374l-1.518.307a.75.75 0 00-.574.574l-.307 1.518a.75.75 0 01-1.374.42l-1.33-.774a.75.75 0 00-.874 0l-1.33.774a.75.75 0 01-1.374-.42l-.307-1.518a.75.75 0 00-.574-.574l-1.518-.307a.75.75 0 010-1.374l1.518-.307a.75.75 0 00.574-.574l.307-1.518a.75.75 0 01.42-.42zM4 14.25a.75.75 0 01.42.42l.307 1.518a.75.75 0 001.374 0l1.33-.774a.75.75 0 01.874 0l1.33.774a.75.75 0 001.374-.42l.307-1.518a.75.75 0 01.42-.42l1.518-.307a.75.75 0 000-1.374l-1.518-.307a.75.75 0 01-.42-.42l-.307-1.518a.75.75 0 00-1.374 0l-1.33.774a.75.75 0 01-.874 0l-1.33-.774a.75.75 0 00-1.374.42l-.307 1.518a.75.75 0 01-.42.42l-1.518.307a.75.75 0 000 1.374l1.518.307z" />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  );
}
