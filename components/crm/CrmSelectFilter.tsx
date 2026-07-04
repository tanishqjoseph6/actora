type CrmSelectFilterProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
};

export function CrmSelectFilter({
  label,
  value,
  onChange,
  options,
}: CrmSelectFilterProps) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <label className="text-[10px] uppercase tracking-wider text-gray-500 shrink-0">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 sm:flex-none min-w-[130px] px-3 py-2 rounded-xl bg-[#111827] border border-blue-400/15 text-sm text-gray-300 focus:outline-none focus:border-blue-400/40 focus:ring-1 focus:ring-blue-400/20 transition-all cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-[#111827]">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
