type CrmSearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
};

export function CrmSearchInput({
  value,
  onChange,
  placeholder,
}: CrmSearchInputProps) {
  return (
    <div className="relative">
      <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717A] pointer-events-none" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
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
