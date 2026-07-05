"use client";

import type { ReactNode } from "react";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";

type SettingsSectionProps = {
  id: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function SettingsSection({
  id,
  title,
  description,
  children,
  footer,
}: SettingsSectionProps) {
  return (
    <section
      id={id}
      className={`${dashboard.cardLg} scroll-mt-24 overflow-hidden`}
    >
      <div className="p-5 sm:p-6 border-b border-[#1E293B]">
        <h2 className="text-base font-semibold text-white">{title}</h2>
        <p className={`text-sm ${dashboard.muted} mt-1`}>{description}</p>
      </div>
      <div className="p-5 sm:p-6 space-y-5">{children}</div>
      {footer && (
        <div className="px-5 sm:px-6 py-4 border-t border-[#1E293B] bg-[#0B1220]/40 flex justify-end">
          {footer}
        </div>
      )}
    </section>
  );
}

type SettingsFieldProps = {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: ReactNode;
};

export function SettingsField({
  label,
  hint,
  htmlFor,
  children,
}: SettingsFieldProps) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-white"
      >
        {label}
      </label>
      {children}
      {hint && <p className={`text-xs ${dashboard.subtle}`}>{hint}</p>}
    </div>
  );
}

type SettingsInputProps = {
  id?: string;
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  readOnly?: boolean;
};

export function SettingsInput({
  id,
  value,
  onChange,
  placeholder,
  type = "text",
  disabled,
  readOnly,
}: SettingsInputProps) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      readOnly={readOnly}
      className={`${dashboard.input} px-3.5 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed read-only:opacity-70`}
    />
  );
}

type SettingsSelectProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
};

export function SettingsSelect({
  id,
  value,
  onChange,
  options,
}: SettingsSelectProps) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`${dashboard.input} px-3.5 py-2.5 cursor-pointer`}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} className="bg-[#111827]">
          {opt.label}
        </option>
      ))}
    </select>
  );
}

type SettingsToggleProps = {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export function SettingsToggle({
  id,
  label,
  description,
  checked,
  onChange,
}: SettingsToggleProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-1">
      <div className="min-w-0">
        <label htmlFor={id} className="text-sm font-medium text-white cursor-pointer">
          {label}
        </label>
        {description && (
          <p className={`text-xs ${dashboard.subtle} mt-0.5`}>{description}</p>
        )}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`
          relative shrink-0 w-11 h-6 rounded-full transition-colors duration-200
          ${checked ? "bg-[#2563EB]" : "bg-[#1E293B]"}
        `}
      >
        <span
          className={`
            absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200
            ${checked ? "translate-x-5" : "translate-x-0"}
          `}
        />
      </button>
    </div>
  );
}

export function SettingsDivider() {
  return <div className="border-t border-[#1E293B]" />;
}
