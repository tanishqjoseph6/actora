import Link from "next/link";
import type { ReactNode } from "react";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";

type AuthCardProps = {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <main
      className={`min-h-screen ${dashboard.bg} text-white flex flex-col items-center justify-center px-4 sm:px-6 py-12`}
    >
      <div className={`w-full max-w-md ${dashboard.panelLg}`}>
        <div className="text-center mb-8">
          <p
            className={`text-sm ${dashboard.accent} font-semibold uppercase tracking-wider mb-3`}
          >
            Actora
          </p>
          <h1 className={`${dashboard.pageTitle} mb-2`}>{title}</h1>
          <p className={`${dashboard.muted} text-sm`}>{description}</p>
        </div>

        {children}

        {footer && (
          <div className={`text-sm ${dashboard.subtle} mt-8 text-center`}>
            {footer}
          </div>
        )}
      </div>
    </main>
  );
}

type AuthFieldProps = {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
};

export function AuthField({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  required = true,
  minLength,
}: AuthFieldProps) {
  return (
    <div>
      <label htmlFor={id} className={`block text-sm font-medium ${dashboard.muted} mb-2`}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        className={`${dashboard.input} px-4 py-3`}
      />
    </div>
  );
}

export function AuthDivider() {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className={`w-full border-t ${dashboard.border}`} />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className={`px-3 ${dashboard.bg} ${dashboard.subtle} tracking-wider`}>
          or
        </span>
      </div>
    </div>
  );
}

export function AuthBackLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={dashboard.textLink}>
      {children}
    </Link>
  );
}
