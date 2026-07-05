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
                  ? "bg-[#2563EB]/15 border border-[#2563EB]/40 text-[#93C5FD]"
                  : "bg-[#0B1220] border border-[#1E293B] text-[#64748B] hover:border-[#2563EB]/35 hover:text-[#94A3B8]"
              }
            `}
          >
            {chip.label}
            {chip.count !== undefined && (
              <span
                className={`text-xs tabular-nums ${active ? "text-[#3B82F6]" : "text-[#64748B]"}`}
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
