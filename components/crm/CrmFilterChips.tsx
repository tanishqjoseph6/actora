type FilterChip = {
  id: string;
  label: string;
  count: number;
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
              inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium
              transition-all duration-200
              ${
                active
                  ? "bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 shadow-sm shadow-cyan-500/10"
                  : "bg-[#0d1730] border border-cyan-400/10 text-gray-400 hover:border-cyan-400/25 hover:text-gray-300"
              }
            `}
          >
            {chip.label}
            <span
              className={`text-xs tabular-nums ${active ? "text-cyan-400/80" : "text-gray-500"}`}
            >
              {chip.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
