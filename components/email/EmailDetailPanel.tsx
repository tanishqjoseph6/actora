"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { EmailDetail, InboxEmail } from "@/lib/gmail";
import { getAvatarGradient, getInitials } from "@/lib/avatar";
import { usePlanGateActions } from "@/components/subscription/PlanGateProvider";
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
  getCachedSummary,
  setCachedSummary,
} from "@/lib/email/summary-cache";
import {
  getCachedInsights,
  setCachedInsights,
} from "@/lib/email/insights-cache";
import { SNOOZE_OPTIONS } from "@/lib/email/snooze-store";
import {
  REPLY_TONE_LABELS,
  REPLY_TONES,
  type EmailInsights,
  type ReplyTone,
} from "@/lib/openai";
import { AppToast, type AppToastState } from "@/components/ui/AppToast";
import { Skeleton, SkeletonText, SkeletonInline } from "@/components/ui/Skeleton";
import { EmailSchedulingActions } from "@/components/calendar/EmailSchedulingActions";

type EmailDetailPanelProps = {
  email: InboxEmail;
  accountEmail?: string | null;
  onClose: () => void;
  /** Opens tone picker once the email detail has loaded. */
  openAiReply?: boolean;
  onAiReplyOpened?: () => void;
  onMarkRead?: () => void;
  onArchive?: () => Promise<boolean>;
  onStar?: (starred: boolean) => void;
  onSnooze?: (hours: number) => void;
};

type PanelState = "loading" | "ready" | "error";

const EMPTY_REPLY: ReplyContent = { plain: "", html: "" };

export function EmailDetailPanel({
  email,
  accountEmail,
  onClose,
  openAiReply,
  onAiReplyOpened,
  onMarkRead,
  onArchive,
  onStar,
  onSnooze,
}: EmailDetailPanelProps) {
  const { checkAiAction, showLimitModal, refreshSubscription } =
    usePlanGateActions();
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
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryState, setSummaryState] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [isArchiving, setIsArchiving] = useState(false);
  const [isMarkingRead, setIsMarkingRead] = useState(false);
  const [starred, setStarred] = useState(email.starred);
  const [showSnoozePicker, setShowSnoozePicker] = useState(false);
  const [insights, setInsights] = useState<EmailInsights | null>(null);
  const [insightsState, setInsightsState] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [availableLabels, setAvailableLabels] = useState<
    { id: string; name: string }[]
  >([]);

  const resetComposer = useCallback(() => {
    setReply(EMPTY_REPLY);
    composerRef.current?.setContent("");
    setComposerOpen(false);
    setShowTonePicker(false);
    setCopySuccess(false);
  }, []);

  const generateSummary = useCallback(
    async (emailDetail: EmailDetail, options?: { skipCache?: boolean }) => {
      if (!checkAiAction()) return;

      if (!options?.skipCache) {
        const cached = getCachedSummary(email.id);
        if (cached) {
          setSummary(cached);
          setSummaryState("ready");
          return;
        }
      }

      setSummaryState("loading");

      try {
        const res = await fetch("/api/gmail/ai-summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sender: emailDetail.sender,
            subject: emailDetail.subject,
            emailBody: emailDetail.body,
            threadContext: emailDetail.threadContext,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          if (isPlanLimitError(data)) {
            showLimitModal(data.error, data.limitType);
            setSummaryState("idle");
            return;
          }
          setSummaryState("error");
          setToast({
            type: "error",
            title: "Summary failed",
            message: data.error ?? "Failed to generate summary.",
          });
          return;
        }

        setSummary(data.summary);
        setSummaryState("ready");
        setCachedSummary(email.id, data.summary);
        await refreshSubscription();
      } catch {
        setSummaryState("error");
        setToast({
          type: "error",
          title: "Summary failed",
          message: "Failed to generate summary. Please try again.",
        });
      }
    },
    [checkAiAction, email.id, showLimitModal, refreshSubscription]
  );

  const generateInsights = useCallback(
    async (emailDetail: EmailDetail, options?: { skipCache?: boolean }) => {
      if (!checkAiAction()) return;

      if (!options?.skipCache) {
        const cached = getCachedInsights(email.id);
        if (cached) {
          setInsights(cached);
          setInsightsState("ready");
          return;
        }
      }

      setInsightsState("loading");

      try {
        const res = await fetch("/api/gmail/ai-insights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sender: emailDetail.sender,
            subject: emailDetail.subject,
            emailBody: emailDetail.body,
            threadContext: emailDetail.threadContext,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          if (isPlanLimitError(data)) {
            showLimitModal(data.error, data.limitType);
            setInsightsState("idle");
            return;
          }
          setInsightsState("error");
          return;
        }

        setInsights(data.insights);
        setInsightsState("ready");
        setCachedInsights(email.id, data.insights);
        await refreshSubscription();
      } catch {
        setInsightsState("error");
      }
    },
    [checkAiAction, email.id, showLimitModal, refreshSubscription]
  );

  const loadDetail = useCallback(async () => {
    setPanelState("loading");
    setPanelError(null);
    resetComposer();
    setSummary(null);
    setSummaryState("idle");
    setInsights(null);
    setInsightsState("idle");
    setStarred(email.starred);
    setShowSnoozePicker(false);

    try {
      const accountQuery = accountEmail
        ? `?account=${encodeURIComponent(accountEmail)}`
        : "";
      const res = await fetch(`/api/gmail/${email.id}${accountQuery}`);
      const data = await res.json();

      if (!res.ok) {
        setPanelState("error");
        setPanelError(data.error ?? "Failed to load email");
        return;
      }

      const loadedDetail = data.email as EmailDetail;
      setDetail(loadedDetail);
      setPanelState("ready");

      const cachedSummary = getCachedSummary(email.id);
      if (cachedSummary) {
        setSummary(cachedSummary);
        setSummaryState("ready");
      } else {
        void generateSummary(loadedDetail);
      }

      void generateInsights(loadedDetail);

      try {
        const accountQuery = accountEmail
          ? `?account=${encodeURIComponent(accountEmail)}`
          : "";
        const labelsRes = await fetch(`/api/gmail/labels${accountQuery}`);
        if (labelsRes.ok) {
          const labelsData = await labelsRes.json();
          setAvailableLabels(labelsData.labels ?? []);
        }
      } catch {
        setAvailableLabels([]);
      }

      setStarred(loadedDetail.starred ?? email.starred);

      if (openAiReply) {
        setShowTonePicker(true);
        onAiReplyOpened?.();
      }

      if (email.unread && onMarkRead) {
        setIsMarkingRead(true);
        onMarkRead();
        setIsMarkingRead(false);
      }
    } catch {
      setPanelState("error");
      setPanelError("Failed to load email. Please try again.");
    }
  }, [
    accountEmail,
    email.id,
    email.unread,
    generateSummary,
    generateInsights,
    onAiReplyOpened,
    onMarkRead,
    openAiReply,
    resetComposer,
  ]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadDetail();
    });
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

  const handleMarkRead = () => {
    if (!email.unread || !onMarkRead) return;
    setIsMarkingRead(true);
    onMarkRead();
    setIsMarkingRead(false);
    setToast({
      type: "success",
      title: "Marked as read",
      message: "This email is now marked as read.",
    });
  };

  const handleArchive = async () => {
    if (!onArchive) return;

    setIsArchiving(true);
    try {
      const success = await onArchive();
      if (success) {
        setToast({
          type: "success",
          title: "Archived",
          message: "Email moved out of your inbox.",
        });
        onClose();
      } else {
        setToast({
          type: "error",
          title: "Archive failed",
          message: "Could not archive this email.",
        });
      }
    } finally {
      setIsArchiving(false);
    }
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
      const accountQuery = accountEmail
        ? `?account=${encodeURIComponent(accountEmail)}`
        : "";
      const res = await fetch(`/api/gmail/send${accountQuery}`, {
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

  const handleGenerateDraft = () => {
    setComposerOpen(true);
    void generateReply(selectedTone);
  };

  const handleStar = () => {
    const next = !starred;
    setStarred(next);
    onStar?.(next);
    setToast({
      type: "success",
      title: next ? "Starred" : "Unstarred",
      message: next ? "Email added to starred." : "Star removed.",
    });
  };

  const handleSnooze = (hours: number) => {
    setShowSnoozePicker(false);
    onSnooze?.(hours);
    setToast({
      type: "success",
      title: "Snoozed",
      message: "Email archived until the snooze time.",
    });
    onClose();
  };

  const handleNextAction = (type: EmailInsights["nextActions"][0]["type"]) => {
    if (type === "reply" || type === "follow_up") {
      setShowTonePicker(true);
      return;
    }
    if (type === "archive") {
      void handleArchive();
      return;
    }
    if (type === "schedule") {
      setToast({
        type: "success",
        title: "Schedule",
        message: "Use the scheduling actions below to book time.",
      });
    }
  };

  const handleToggleLabel = async (labelId: string, active: boolean) => {
    if (!detail) return;
    const accountQuery = accountEmail
      ? `?account=${encodeURIComponent(accountEmail)}`
      : "";
    await fetch(`/api/gmail/${detail.id}/labels${accountQuery}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        addLabelIds: active ? [] : [labelId],
        removeLabelIds: active ? [labelId] : [],
      }),
    });
    await loadDetail();
  };

  const attachmentUrl = (attachmentId: string, filename: string, mimeType: string) => {
    const accountQuery = accountEmail
      ? `&account=${encodeURIComponent(accountEmail)}`
      : "";
    return `/api/gmail/${email.id}/attachments/${attachmentId}?filename=${encodeURIComponent(filename)}&mimeType=${encodeURIComponent(mimeType)}${accountQuery}`;
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
        className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] lg:w-[540px] bg-[#0A0A0A] border-l border-white/[0.06] shadow-2xl shadow-black/50 flex flex-col animate-slide-in-right"
        role="dialog"
        aria-modal
        aria-label="Email detail"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`shrink-0 w-10 h-10 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-sm font-semibold text-white`}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-white truncate">{email.sender}</p>
              <p className="text-xs text-[#71717A]">{email.date}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 p-2 rounded-lg text-[#A1A1AA] hover:text-white hover:bg-[#3B82F6]/10 transition-colors"
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
              <div className="bg-[#111111] border border-red-400/20 rounded-2xl p-6 text-center">
                <p className="text-red-300 font-medium mb-2">Could not load email</p>
                <p className="text-[#A1A1AA] text-sm mb-4">{panelError}</p>
                <button
                  onClick={loadDetail}
                  className="px-4 py-2 rounded-lg border border-[#3B82F6]/30 text-[#3B82F6] hover:bg-[#3B82F6]/10 transition-colors"
                >
                  Try again
                </button>
              </div>
            </div>
          )}

          {panelState === "ready" && detail && (
            <div className="p-5">
              <h2 className="text-xl font-bold text-white mb-1">{detail.subject}</h2>
              <time className="text-sm text-[#71717A]">{detail.date}</time>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <ActionButton
                  variant="primary"
                  onClick={handleAiReplyClick}
                  disabled={isGenerating || isSending || isArchiving}
                >
                  <SparkleIcon className="w-4 h-4" />
                  Reply with AI
                </ActionButton>
                <ActionButton onClick={handleManualReply} disabled={isGenerating || isSending || isArchiving}>
                  <ReplyIcon className="w-4 h-4" />
                  Reply
                </ActionButton>
                {onArchive && (
                  <ActionButton
                    onClick={() => void handleArchive()}
                    disabled={isArchiving || isGenerating || isSending}
                  >
                    {isArchiving ? (
                      <SkeletonInline className="w-4 h-4 rounded" />
                    ) : (
                      <ArchiveIcon className="w-4 h-4" />
                    )}
                    Archive
                  </ActionButton>
                )}
                {email.unread && onMarkRead && (
                  <ActionButton
                    onClick={handleMarkRead}
                    disabled={isMarkingRead || isArchiving}
                  >
                    <ReadIcon className="w-4 h-4" />
                    Mark as Read
                  </ActionButton>
                )}
                {onStar && (
                  <ActionButton onClick={handleStar} disabled={isArchiving}>
                    <StarIcon className="w-4 h-4" filled={starred} />
                    {starred ? "Unstar" : "Star"}
                  </ActionButton>
                )}
                {onSnooze && (
                  <ActionButton
                    onClick={() => setShowSnoozePicker((v) => !v)}
                    disabled={isArchiving}
                  >
                    Snooze
                  </ActionButton>
                )}
              </div>

              {showSnoozePicker && (
                <div className="mt-3 p-4 rounded-2xl bg-[#111111]/60 border border-white/[0.06] backdrop-blur-sm animate-fade-in">
                  <p className="text-xs font-medium uppercase tracking-wider text-[#3B82F6] mb-3">
                    Snooze until
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {SNOOZE_OPTIONS.map((option) => (
                      <button
                        key={option.label}
                        type="button"
                        onClick={() => handleSnooze(option.hours)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium border border-white/[0.06] text-[#A1A1AA] hover:border-[#3B82F6]/30 hover:text-white transition-all duration-200"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <EmailSchedulingActions
                subject={detail.subject}
                participantEmail={
                  detail.senderEmail ||
                  (email.sender.includes("@") ? email.sender : undefined)
                }
                disabled={isGenerating || isSending || isArchiving}
              />

              {showTonePicker && (
                <div className="mt-3 p-4 rounded-2xl bg-[#111111]/60 border border-white/[0.06] backdrop-blur-sm animate-fade-in">
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
                            ? "bg-[#3B82F6]/20 border-[#3B82F6]/40 text-[#93C5FD]"
                            : "border-white/[0.06] text-[#A1A1AA] hover:border-[#3B82F6]/30 hover:text-white"
                        } disabled:opacity-50`}
                      >
                        {REPLY_TONE_LABELS[tone]}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 p-4 rounded-2xl bg-[#111111] border border-[#3B82F6]/20">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <SparkleIcon className="w-4 h-4 text-[#3B82F6]" />
                    AI Summary
                  </h3>
                  {summaryState === "ready" && (
                    <button
                      type="button"
                      onClick={() => detail && void generateSummary(detail, { skipCache: true })}
                      className="text-xs text-[#3B82F6] hover:text-[#93C5FD] transition-colors"
                    >
                      Regenerate
                    </button>
                  )}
                </div>

                {summaryState === "loading" && (
                  <div aria-busy="true">
                    <SkeletonText lines={3} />
                  </div>
                )}

                {summaryState === "error" && (
                  <div className="space-y-3">
                    <p className="text-sm text-[#A1A1AA]">Could not generate a summary.</p>
                    <button
                      type="button"
                      onClick={() => detail && void generateSummary(detail, { skipCache: true })}
                      className="text-xs font-medium text-[#3B82F6] hover:text-[#93C5FD]"
                    >
                      Try again
                    </button>
                  </div>
                )}

                {summaryState === "ready" && summary && (
                  <p className="text-sm text-[#CBD5E1] whitespace-pre-wrap leading-relaxed">
                    {summary}
                  </p>
                )}

                {summaryState === "idle" && (
                  <button
                    type="button"
                    onClick={() => detail && void generateSummary(detail)}
                    className="text-sm font-medium text-[#3B82F6] hover:text-[#93C5FD] transition-colors"
                  >
                    Summarize with AI
                  </button>
                )}
              </div>

              {(insightsState === "loading" ||
                (insightsState === "ready" && insights)) && (
                <div className="mt-4 p-4 rounded-2xl bg-[#111111]/60 border border-white/[0.06]">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <h3 className="text-sm font-semibold text-white">
                      Smart priority
                    </h3>
                    {insightsState === "ready" && insights && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          insights.priority === "high"
                            ? "bg-[#3B82F6]/15 text-[#93C5FD] border border-[#3B82F6]/30"
                            : insights.priority === "medium"
                              ? "bg-white/[0.04] text-[#A1A1AA] border border-white/[0.08]"
                              : "bg-white/[0.03] text-[#71717A] border border-white/[0.06]"
                        }`}
                      >
                        {insights.priority}
                      </span>
                    )}
                  </div>
                  {insightsState === "loading" && <SkeletonText lines={2} />}
                  {insightsState === "ready" && insights && (
                    <>
                      <p className="text-sm text-[#CBD5E1]">
                        {insights.priorityReason}
                      </p>
                      {insights.nextActions.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {insights.nextActions.map((action) => (
                            <button
                              key={action.label}
                              type="button"
                              onClick={() => handleNextAction(action.type)}
                              className="inline-flex items-center rounded-lg border border-[#3B82F6]/25 bg-[#3B82F6]/10 px-2.5 py-1 text-xs text-[#93C5FD] transition-colors hover:bg-[#3B82F6]/15"
                            >
                              {action.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {insightsState === "ready" &&
                insights &&
                insights.followUps.length > 0 && (
                  <div className="mt-4 p-4 rounded-2xl bg-[#111111] border border-[#3B82F6]/20">
                    <h3 className="text-sm font-semibold text-white mb-3">
                      Suggested follow-ups
                    </h3>
                    <ul className="space-y-3">
                      {insights.followUps.map((item) => (
                        <li
                          key={item.label}
                          className="rounded-xl border border-white/[0.06] bg-[#0A0A0A] px-3 py-2.5"
                        >
                          <p className="text-sm font-medium text-white">
                            {item.label}
                          </p>
                          <p className="mt-1 text-xs text-[#71717A]">
                            {item.timing}
                            {item.draftHint ? ` · ${item.draftHint}` : ""}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setShowTonePicker(true);
                              setComposerOpen(true);
                            }}
                            className="mt-2 text-xs font-medium text-[#3B82F6] hover:text-[#93C5FD]"
                          >
                            Draft follow-up
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              {detail.threadMessages.length > 1 && (
                <div className="mt-6 p-4 rounded-2xl bg-[#111111]/60 border border-white/[0.06]">
                  <p className="text-xs font-medium uppercase tracking-wider text-[#71717A] mb-3">
                    Thread timeline
                  </p>
                  <ul className="space-y-3">
                    {detail.threadMessages.map((msg) => (
                      <li
                        key={msg.id}
                        className={`rounded-xl border px-3 py-2.5 ${
                          msg.isCurrent
                            ? "border-[#3B82F6]/35 bg-[#3B82F6]/10"
                            : "border-white/[0.06] bg-[#0A0A0A]"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-white truncate">
                            {msg.sender}
                          </p>
                          <time className="shrink-0 text-[11px] text-[#71717A]">
                            {msg.date}
                          </time>
                        </div>
                        <p className="mt-1 text-xs text-[#A1A1AA] line-clamp-2">
                          {msg.preview}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {detail.attachments.length > 0 && (
                <div className="mt-6 p-4 rounded-2xl bg-[#111111]/60 border border-white/[0.06]">
                  <p className="text-xs font-medium uppercase tracking-wider text-[#71717A] mb-3">
                    Attachments
                  </p>
                  <ul className="space-y-2">
                    {detail.attachments.map((file) => (
                      <li key={file.id}>
                        <a
                          href={attachmentUrl(
                            file.id,
                            file.filename,
                            file.mimeType
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-[#0A0A0A] px-3 py-2.5 text-sm text-[#A1A1AA] transition-colors hover:border-[#3B82F6]/30 hover:text-white"
                        >
                          <span className="truncate">{file.filename}</span>
                          <span className="shrink-0 text-xs text-[#71717A]">
                            {file.size > 0
                              ? `${Math.max(1, Math.round(file.size / 1024))} KB`
                              : "Preview"}
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {(detail.labels.length > 0 || availableLabels.length > 0) && (
                <div className="mt-6 p-4 rounded-2xl bg-[#111111]/60 border border-white/[0.06]">
                  <p className="text-xs font-medium uppercase tracking-wider text-[#71717A] mb-3">
                    Labels
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {availableLabels.slice(0, 8).map((label) => {
                      const active = detail.labels.includes(label.id);
                      return (
                        <button
                          key={label.id}
                          type="button"
                          onClick={() => void handleToggleLabel(label.id, active)}
                          className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                            active
                              ? "bg-[#3B82F6]/15 border border-[#3B82F6]/35 text-[#93C5FD]"
                              : "border border-white/[0.08] text-[#71717A] hover:text-white"
                          }`}
                        >
                          {label.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mt-6 p-4 rounded-2xl bg-[#111111]/60 border border-white/[0.06]">
                <p className="text-xs font-medium uppercase tracking-wider text-[#71717A] mb-3">
                  Full message
                </p>
                <p className="text-sm text-[#A1A1AA] whitespace-pre-wrap leading-relaxed">
                  {detail.body || "No content available."}
                </p>
              </div>

              {composerOpen && (
                <div className="mt-6 pt-6 border-t border-white/[0.06] animate-fade-in">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <SparkleIcon className="w-5 h-5 text-[#3B82F6]" />
                      {isGenerating ? "Generating…" : "Compose Reply"}
                    </h3>
                    {selectedTone && !isGenerating && (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-[#3B82F6]/10 border border-white/[0.06] text-[#93C5FD]">
                        {REPLY_TONE_LABELS[selectedTone]}
                      </span>
                    )}
                    {!isGenerating && isComposerEmpty(reply.plain, reply.html) && (
                      <button
                        type="button"
                        onClick={handleGenerateDraft}
                        className="text-xs font-medium text-[#3B82F6] hover:text-[#93C5FD]"
                      >
                        Generate draft
                      </button>
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
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/[0.06] text-[#A1A1AA] text-sm font-medium hover:bg-[#3B82F6]/10 hover:text-white transition-all duration-200 disabled:opacity-50"
                      >
                        <CopyIcon className="w-4 h-4" />
                        {copySuccess ? "Copied!" : "Copy"}
                      </button>
                      <button
                        onClick={handleRegenerate}
                        disabled={isGenerating || isSending}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/[0.06] text-[#A1A1AA] text-sm font-medium hover:bg-[#3B82F6]/10 hover:text-white transition-all duration-200 disabled:opacity-50"
                      >
                        <RefreshIcon className="w-4 h-4" />
                        Regenerate
                      </button>
                      <button
                        onClick={handleSend}
                        disabled={
                          isSending || isComposerEmpty(reply.plain, reply.html)
                        }
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#3B82F6] text-white hover:bg-[#2563EB] text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-[#3B82F6]/20"
                      >
                        {isSending ? (
                          <>
                            <SkeletonInline className="w-4 h-4 rounded" />
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
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[rgba(37, 99, 235,0.15)] text-[#A1A1AA] text-sm font-medium hover:border-[#3B82F6]/30 hover:text-white transition-all duration-200 disabled:opacity-50"
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
      className="rounded-2xl border border-white/[0.06] bg-[#111111]/60 overflow-hidden"
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
        className={`${base} bg-[#3B82F6] text-white hover:bg-[#2563EB] shadow-md shadow-[#3B82F6]/15`}
      >
        {children}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} border border-white/[0.06] text-[#A1A1AA] hover:bg-[#3B82F6]/10 hover:text-white`}
    >
      {children}
    </button>
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

function ArchiveIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
    </svg>
  );
}

function ReadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
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

function StarIcon({
  className,
  filled,
}: {
  className?: string;
  filled?: boolean;
}) {
  return (
    <svg
      className={className}
      fill={filled ? "currentColor" : "none"}
      viewBox="0 0 20 20"
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.5}
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}
