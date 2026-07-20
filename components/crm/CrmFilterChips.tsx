type FilterChip = {
  id: string;
  label: string;
  count?: number;
};

type CrmFilterChipsProps = {
  chips: FilterChip[];
  activeId: string;
  onChange: (id: string) => void;
};

export function CrmFilterChips({
  chips,
  activeId,
  onChange,
}: CrmFilterChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => {
        const active = chip.id === activeId;
        return (
          <button
            key={chip.id}
            type="button"
            onClick={() => onChange(chip.id)}
            className={`
              inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium
              transition-all duration-200 interactive-press
              ${
                active
                  ? "bg-[#3B82F6]/15 border border-[#3B82F6]/40 text-[#93C5FD]"
                  : "bg-[#0A0A0A] border border-white/[0.06] text-[#71717A] hover:border-[#3B82F6]/35 hover:text-[#A1A1AA]"
              }
            `}
          >
            {chip.label}
            {chip.count !== undefined && (
              <span
                className={`text-xs tabular-nums ${active ? "text-[#3B82F6]" : "text-[#71717A]"}`}
              >
                {chip.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
