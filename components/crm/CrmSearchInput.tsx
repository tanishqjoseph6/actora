"use client";

import { useEffect, useState, type ChangeEvent } from "react";

type CrmSearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  debounceMs?: number;
};

export function CrmSearchInput({
  value,
  onChange,
  placeholder,
  debounceMs = 200,
}: CrmSearchInputProps) {
  const [local, setLocal] = useState(value);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  useEffect(() => {
    if (local === value) return;
    const timer = window.setTimeout(() => onChange(local), debounceMs);
    return () => window.clearTimeout(timer);
  }, [local, value, onChange, debounceMs]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setLocal(e.target.value);
  };

  return (
    <div className="relative">
      <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717A] pointer-events-none" />
      <input
        type="search"
        value={local}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-[#0A0A0A] border border-white/[0.06] text-white placeholder:text-[#71717A] text-sm focus:outline-none focus:border-[#3B82F6]/50 focus:ring-1 focus:ring-[#2563EB]/20 transition-all duration-200 focus-ring"
      />
    </div>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}
