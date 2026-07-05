"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { EmailDetail, InboxEmail } from "@/lib/gmail";
import { getAvatarGradient, getInitials } from "@/lib/avatar";
import { usePlanGate } from "@/components/subscription/PlanGateProvider";
import { isPlanLimitError } from "@/lib/subscription";
import {
  ReplyComposer,
  type ReplyComposerHandle,
  type ReplyContent,
} from "@/components/email/ReplyComposer";
import { hasRichFormatting, isComposerEmpty } from "@/lib/email/html";
import {
  getCachedReply,
  setCachedReply,
} from "@/lib/email/reply-cache";
import {
  REPLY_TONE_LABELS,
  REPLY_TONES,
  type ReplyTone,
} from "@/lib/openai";
import { AppToast, type AppToastState } from "@/components/ui/AppToast";
import { Skeleton, SkeletonText } from "@/components/ui/Skeleton";

type EmailDetailPanelProps = {
  email: InboxEmail;
  onClose: () => void;
  /** Opens tone picker once the email detail has loaded. */
  openAiReply?: boolean;
  onAiReplyOpened?: () => void;
};

type PanelState = "loading" | "ready" | "error";

const EMPTY_REPLY: ReplyContent = { plain: "", html: "" };

export function EmailDetailPanel({
  email,
  onClose,
  openAiReply,
  onAiReplyOpened,
}: EmailDetailPanelProps) {
  const { checkAiAction, showLimitModal, refreshSubscription } = usePlanGate();
  const composerRef = useRef<ReplyComposerHandle>(null);

  const [detail, setDetail] = useState<EmailDetail | null>(null);
  const [panelState, setPanelState] = useState<PanelState>("loading");
  const [panelError, setPanelError] = useState<string | null>(null);

  const [composerOpen, setComposerOpen] = useState(false);
  const [reply, setReply] = useState<ReplyContent>(EMPTY_REPLY);
  const [selectedTone, setSelectedTone] = useState<ReplyTone>("professional");
  const [showTonePicker, setShowTonePicker] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [toast, setToast] = useState<AppToastState>(null);

  const resetComposer = useCallback(() => {
    setReply(EMPTY_REPLY);
    composerRef.current?.setContent("");
    setComposerOpen(false);
    setShowTonePicker(false);
    setCopySuccess(false);
  }, []);

  const loadDetail = useCallback(async () => {
    setPanelState("loading");
    setPanelError(null);
    resetComposer();

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
  }, [email.id, resetComposer]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  useEffect(() => {
    if (panelState === "ready" && openAiReply) {
      setShowTonePicker(true);
      onAiReplyOpened?.();
    }
  }, [panelState, openAiReply, onAiReplyOpened]);

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

  const openComposerWithContent = useCallback((content: ReplyContent) => {
    composerRef.current?.setContent(content.plain);
    setReply(content);
    setComposerOpen(true);
  }, []);

  const generateReply = useCallback(
    async (tone: ReplyTone, options?: { skipCache?: boolean }) => {
      if (!detail) return false;
      if (!checkAiAction()) return false;

      if (!options?.skipCache) {
        const cached = getCachedReply(email.id, tone);
        if (cached) {
          setSelectedTone(tone);
          openComposerWithContent({
            plain: cached.plain,
            html: cached.html,
          });
          return true;
        }
      }

      setIsGenerating(true);
      setShowTonePicker(false);
      setComposerOpen(true);

      try {
        const res = await fetch("/api/gmail/ai-reply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sender: detail.sender,
            subject: detail.subject,
            emailBody: detail.body,
            threadContext: detail.threadContext,
            tone,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          if (isPlanLimitError(data)) {
            showLimitModal(data.error, data.limitType);
            setComposerOpen(false);
            return false;
          }
          setToast({
            type: "error",
            title: "Generation failed",
            message: data.error ?? "Failed to generate reply.",
          });
          return false;
        }

        const content: ReplyContent = {
          plain: data.reply,
          html: "",
        };

        setSelectedTone(tone);
        openComposerWithContent(content);
        setCachedReply(email.id, tone, {
          plain: data.reply,
          html: composerRef.current?.getContent().html ?? "",
        });
        await refreshSubscription();
        return true;
      } catch {
        setToast({
          type: "error",
          title: "Generation failed",
          message: "Failed to generate reply. Please try again.",
        });
        return false;
      } finally {
        setIsGenerating(false);
      }
    },
    [
      detail,
      checkAiAction,
      email.id,
      openComposerWithContent,
      showLimitModal,
      refreshSubscription,
    ]
  );

  const handleAiReplyClick = () => {
    setShowTonePicker((prev) => !prev);
  };

  const handleToneSelect = (tone: ReplyTone) => {
    void generateReply(tone);
  };

  const handleManualReply = () => {
    resetComposer();
    setComposerOpen(true);
  };

  const handleRegenerate = () => {
    void generateReply(selectedTone, { skipCache: true });
  };

  const handleCancelComposer = () => {
    resetComposer();
  };

  const handleCopy = async () => {
    const content = composerRef.current?.getContent() ?? reply;
    if (isComposerEmpty(content.plain, content.html)) return;

    try {
      if (
        hasRichFormatting(content.html) &&
        typeof ClipboardItem !== "undefined"
      ) {
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/plain": new Blob([content.plain], { type: "text/plain" }),
            "text/html": new Blob([content.html], { type: "text/html" }),
          }),
        ]);
      } else {
        await navigator.clipboard.writeText(content.plain);
      }

      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      setToast({
        type: "error",
        title: "Copy failed",
        message: "Could not copy to clipboard.",
      });
    }
  };

  const handleSend = async () => {
    if (!detail) return;

    const content = composerRef.current?.getContent() ?? reply;
    if (isComposerEmpty(content.plain, content.html)) return;

    setIsSending(true);

    try {
      const res = await fetch("/api/gmail/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId: detail.threadId,
          to: detail.senderEmail,
          subject: detail.subject,
          replyBody: content.plain,
          replyBodyHtml: hasRichFormatting(content.html)
            ? content.html
            : undefined,
          inReplyTo: detail.messageIdHeader || undefined,
          references: detail.messageIdHeader || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setToast({
          type: "error",
          title: "Send failed",
          message: data.error ?? "Failed to send email via Gmail.",
        });
        return;
      }

      setToast({
        type: "success",
        title: "Reply sent",
        message: "Your email was sent successfully via Gmail.",
      });
      resetComposer();
    } catch {
      setToast({
        type: "error",
        title: "Send failed",
        message: "Failed to send email. Please try again.",
      });
    } finally {
      setIsSending(false);
    }
  };

  const initials = getInitials(email.sender);
  const gradient = getAvatarGradient(email.sender);

  return (
    <>
      <AppToast toast={toast} onDismiss={() => setToast(null)} />

      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:bg-black/40"
        onClick={onClose}
        aria-hidden
      />

      <aside
        className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] lg:w-[540px] bg-[#0B1220] border-l border-[#1E293B] shadow-2xl shadow-black/50 flex flex-col animate-slide-in-right"
        role="dialog"
        aria-modal
        aria-label="Email detail"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E293B] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`shrink-0 w-10 h-10 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-sm font-semibold text-white`}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-white truncate">{email.sender}</p>
              <p className="text-xs text-[#64748B]">{email.date}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 p-2 rounded-lg text-[#94A3B8] hover:text-white hover:bg-[#2563EB]/10 transition-colors"
            aria-label="Close panel"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {panelState === "loading" && (
            <div className="p-5 space-y-4" aria-busy="true" aria-label="Loading email">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/4" />
              <div className="pt-4">
                <SkeletonText lines={5} />
              </div>
            </div>
          )}

          {panelState === "error" && (
            <div className="p-5">
              <div className="bg-[#111827] border border-red-400/20 rounded-2xl p-6 text-center">
                <p className="text-red-300 font-medium mb-2">Could not load email</p>
                <p className="text-[#94A3B8] text-sm mb-4">{panelError}</p>
                <button
                  onClick={loadDetail}
                  className="px-4 py-2 rounded-lg border border-[#2563EB]/30 text-[#3B82F6] hover:bg-[#2563EB]/10 transition-colors"
                >
                  Try again
                </button>
              </div>
            </div>
          )}

          {panelState === "ready" && detail && (
            <div className="p-5">
              <h2 className="text-xl font-bold text-white mb-1">{detail.subject}</h2>
              <time className="text-sm text-[#64748B]">{detail.date}</time>

              {/* Reply / Forward / AI Reply actions */}
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <ActionButton onClick={handleManualReply} disabled={isGenerating || isSending}>
                  <ReplyIcon className="w-4 h-4" />
                  Reply
                </ActionButton>
                <ActionButton
                  onClick={() =>
                    setToast({
                      type: "info",
                      title: "Forward",
                      message: "Forward is coming soon.",
                    })
                  }
                  disabled={isGenerating || isSending}
                >
                  <ForwardIcon className="w-4 h-4" />
                  Forward
                </ActionButton>
                <ActionButton
                  variant="primary"
                  onClick={handleAiReplyClick}
                  disabled={isGenerating || isSending}
                >
                  <SparkleIcon className="w-4 h-4" />
                  AI Reply
                </ActionButton>
              </div>

              {showTonePicker && (
                <div className="mt-3 p-4 rounded-2xl bg-[#111827]/60 border border-[#1E293B] backdrop-blur-sm animate-fade-in">
                  <p className="text-xs font-medium uppercase tracking-wider text-[#3B82F6] mb-3">
                    Choose tone
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {REPLY_TONES.map((tone) => (
                      <button
                        key={tone}
                        onClick={() => handleToneSelect(tone)}
                        disabled={isGenerating}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 ${
                          selectedTone === tone
                            ? "bg-[#2563EB]/20 border-[#2563EB]/40 text-[#93C5FD]"
                            : "border-[#1E293B] text-[#94A3B8] hover:border-[#2563EB]/30 hover:text-white"
                        } disabled:opacity-50`}
                      >
                        {REPLY_TONE_LABELS[tone]}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 p-4 rounded-2xl bg-[#111827]/60 border border-[#1E293B]">
                <p className="text-sm text-[#94A3B8] whitespace-pre-wrap leading-relaxed">
                  {detail.body || "No content available."}
                </p>
              </div>

              {composerOpen && (
                <div className="mt-6 pt-6 border-t border-[#1E293B] animate-fade-in">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <SparkleIcon className="w-5 h-5 text-[#3B82F6]" />
                      {isGenerating ? "Generating…" : "Compose Reply"}
                    </h3>
                    {selectedTone && !isGenerating && (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-[#2563EB]/10 border border-[#1E293B] text-[#93C5FD]">
                        {REPLY_TONE_LABELS[selectedTone]}
                      </span>
                    )}
                  </div>

                  {isGenerating ? (
                    <ComposerSkeleton />
                  ) : (
                    <ReplyComposer
                      ref={composerRef}
                      onChange={(content) => {
                        setReply(content);
                        if (detail) {
                          setCachedReply(email.id, selectedTone, content);
                        }
                      }}
                      disabled={isGenerating || isSending}
                      placeholder="Your reply will appear here…"
                    />
                  )}

                  {!isGenerating && (
                    <div className="flex flex-wrap gap-3 mt-4">
                      <button
                        onClick={handleCopy}
                        disabled={isComposerEmpty(reply.plain, reply.html)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#1E293B] text-[#94A3B8] text-sm font-medium hover:bg-[#2563EB]/10 hover:text-white transition-all duration-200 disabled:opacity-50"
                      >
                        <CopyIcon className="w-4 h-4" />
                        {copySuccess ? "Copied!" : "Copy"}
                      </button>
                      <button
                        onClick={handleRegenerate}
                        disabled={isGenerating || isSending}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#1E293B] text-[#94A3B8] text-sm font-medium hover:bg-[#2563EB]/10 hover:text-white transition-all duration-200 disabled:opacity-50"
                      >
                        <RefreshIcon className="w-4 h-4" />
                        Regenerate
                      </button>
                      <button
                        onClick={handleSend}
                        disabled={
                          isSending || isComposerEmpty(reply.plain, reply.html)
                        }
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2563EB] text-white hover:bg-[#1D4ED8] text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-[#2563EB]/20"
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
                      <button
                        onClick={handleCancelComposer}
                        disabled={isSending}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[rgba(37, 99, 235,0.15)] text-[#94A3B8] text-sm font-medium hover:border-[#2563EB]/30 hover:text-white transition-all duration-200 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

function ComposerSkeleton() {
  return (
    <div
      className="rounded-2xl border border-[#1E293B] bg-[#111827]/60 overflow-hidden"
      aria-busy="true"
      aria-label="Loading composer"
    >
      <Skeleton className="h-10 w-full rounded-none" />
      <div className="p-4 space-y-3 min-h-[180px]">
        <SkeletonText lines={5} />
      </div>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
  variant = "default",
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: "default" | "primary";
}) {
  const base =
    "inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

  if (variant === "primary") {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`${base} bg-[#2563EB] text-white hover:bg-[#1D4ED8] shadow-md shadow-[#2563EB]/15`}
      >
        {children}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} border border-[#1E293B] text-[#94A3B8] hover:bg-[#2563EB]/10 hover:text-white`}
    >
      {children}
    </button>
  );
}

function LoadingSpinner({ dark = false }: { dark?: boolean }) {
  const colorClass = dark
    ? "border-white/30 border-t-[#05070B]"
    : "border-[#2563EB]/30 border-t-[#2563EB]";

  return (
    <span
      className={`inline-block w-4 h-4 border-2 ${colorClass} rounded-full animate-spin`}
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

function ReplyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
    </svg>
  );
}

function ForwardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
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

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
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
