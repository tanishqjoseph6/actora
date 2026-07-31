"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, MicOff, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionEventLike = {
  results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }>;
};

function getRecognition(): SpeechRecognitionLike | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

type RoxxVoiceControlsProps = {
  disabled?: boolean;
  language?: string;
  autoSpeak?: boolean;
  lastAssistantText?: string | null;
  onTranscript: (text: string, isFinal: boolean) => void;
  onFinalTranscript: (text: string) => void;
};

export function RoxxVoiceControls({
  disabled,
  language = "en-US",
  autoSpeak = false,
  lastAssistantText,
  onTranscript,
  onFinalTranscript,
}: RoxxVoiceControlsProps) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const lastSpokenRef = useRef<string | null>(null);

  useEffect(() => {
    setSupported(Boolean(getRecognition()));
  }, []);

  useEffect(() => {
    if (!autoSpeak || !lastAssistantText) return;
    if (lastSpokenRef.current === lastAssistantText) return;
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    lastSpokenRef.current = lastAssistantText;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(lastAssistantText.slice(0, 1200));
    utter.lang = language;
    utter.onstart = () => setSpeaking(true);
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utter);
  }, [autoSpeak, lastAssistantText, language]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const interruptSpeech = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }
  }, []);

  const startListening = useCallback(() => {
    interruptSpeech();
    const recognition = getRecognition();
    if (!recognition) return;

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = language;
    recognition.onresult = (event) => {
      let interim = "";
      let finalText = "";
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) finalText += result[0].transcript;
        else interim += result[0].transcript;
      }
      if (interim) onTranscript(interim, false);
      if (finalText.trim()) {
        onTranscript(finalText.trim(), true);
        onFinalTranscript(finalText.trim());
      }
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, [interruptSpeech, language, onFinalTranscript, onTranscript]);

  if (!supported) return null;

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        disabled={disabled}
        onMouseDown={() => startListening()}
        onMouseUp={() => stopListening()}
        onMouseLeave={() => listening && stopListening()}
        onTouchStart={(e) => {
          e.preventDefault();
          startListening();
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          stopListening();
        }}
        className={cn(
          "inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-colors",
          listening
            ? "border-red-400/40 bg-red-500/15 text-red-300"
            : "border-white/[0.08] text-[#A1A1AA] hover:border-[#3B82F6]/35 hover:text-white",
          disabled && "opacity-40"
        )}
        aria-label={listening ? "Release to send voice" : "Hold to talk"}
        title="Hold to talk"
      >
        {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
      </button>
      <button
        type="button"
        onClick={interruptSpeech}
        disabled={!speaking}
        className={cn(
          "inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] text-[#A1A1AA] transition-colors hover:text-white disabled:opacity-30",
          speaking && "border-[#3B82F6]/35 text-[#93C5FD]"
        )}
        aria-label="Interrupt speech"
        title="Interrupt speech"
      >
        <Volume2 className="h-4 w-4" />
      </button>
    </div>
  );
}
