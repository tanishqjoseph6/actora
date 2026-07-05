"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { htmlToPlainText, plainTextToHtml } from "@/lib/email/html";

export type ReplyContent = {
  plain: string;
  html: string;
};

export type ReplyComposerHandle = {
  setContent: (plain: string) => void;
  getContent: () => ReplyContent;
  focus: () => void;
};

type ReplyComposerProps = {
  onChange?: (content: ReplyContent) => void;
  placeholder?: string;
  disabled?: boolean;
};

export const ReplyComposer = forwardRef<ReplyComposerHandle, ReplyComposerProps>(
  function ReplyComposer(
    { onChange, placeholder = "Click AI Reply to generate a response…", disabled },
    ref
  ) {
    const editorRef = useRef<HTMLDivElement>(null);
    const isInternalUpdate = useRef(false);

    const emitChange = useCallback(() => {
      const el = editorRef.current;
      if (!el || isInternalUpdate.current) return;

      onChange?.({
        plain: htmlToPlainText(el.innerHTML),
        html: el.innerHTML,
      });
    }, [onChange]);

    const setEditorContent = useCallback(
      (plain: string) => {
        const el = editorRef.current;
        if (!el) return;

        isInternalUpdate.current = true;
        el.innerHTML = plain ? plainTextToHtml(plain) : "";
        isInternalUpdate.current = false;

        onChange?.({
          plain,
          html: el.innerHTML,
        });
      },
      [onChange]
    );

    useImperativeHandle(
      ref,
      () => ({
        setContent: setEditorContent,
        getContent: () => {
          const el = editorRef.current;
          if (!el) return { plain: "", html: "" };
          return {
            plain: htmlToPlainText(el.innerHTML),
            html: el.innerHTML,
          };
        },
        focus: () => editorRef.current?.focus(),
      }),
      [setEditorContent]
    );

    useEffect(() => {
      const el = editorRef.current;
      if (!el) return;

      const handleInput = () => emitChange();
      el.addEventListener("input", handleInput);
      return () => el.removeEventListener("input", handleInput);
    }, [emitChange]);

    const execFormat = (command: string, value?: string) => {
      if (disabled) return;
      editorRef.current?.focus();
      document.execCommand(command, false, value);
      emitChange();
    };

    return (
      <div className="rounded-2xl border border-[#1E293B] bg-[#111827]/60 overflow-hidden focus-within:border-[#2563EB]/40 focus-within:ring-1 focus-within:ring-[#2563EB]/20 transition-all">
        <div className="flex items-center gap-1 px-3 py-2 border-b border-[#1E293B] bg-[#0B1220]/40">
          <ToolbarButton
            label="Bold"
            onClick={() => execFormat("bold")}
            disabled={disabled}
          >
            <span className="font-bold">B</span>
          </ToolbarButton>
          <ToolbarButton
            label="Italic"
            onClick={() => execFormat("italic")}
            disabled={disabled}
          >
            <span className="italic">I</span>
          </ToolbarButton>
          <ToolbarButton
            label="Underline"
            onClick={() => execFormat("underline")}
            disabled={disabled}
          >
            <span className="underline">U</span>
          </ToolbarButton>
          <span className="w-px h-5 bg-blue-400/10 mx-1" aria-hidden />
          <ToolbarButton
            label="Bullet list"
            onClick={() => execFormat("insertUnorderedList")}
            disabled={disabled}
          >
            <ListIcon className="w-4 h-4" />
          </ToolbarButton>
        </div>

        <div className="relative min-h-[180px] max-h-[280px] overflow-y-auto">
          <div
            ref={editorRef}
            contentEditable={!disabled}
            suppressContentEditableWarning
            role="textbox"
            aria-multiline
            aria-label="Email reply composer"
            data-placeholder={placeholder}
            className="reply-composer px-4 py-3 text-sm text-gray-200 leading-relaxed outline-none min-h-[180px]"
          />
        </div>
      </div>
    );
  }
);

function ToolbarButton({
  children,
  label,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="w-8 h-8 rounded-lg text-gray-400 hover:text-white hover:bg-blue-500/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm"
    >
      {children}
    </button>
  );
}

function ListIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}
