type AuthMessageProps = {
  variant: "error" | "success";
  children: React.ReactNode;
};

export function AuthMessage({ variant, children }: AuthMessageProps) {
  const styles =
    variant === "error"
      ? "text-rose-400 bg-rose-500/10 border-rose-400/20"
      : "text-emerald-400 bg-emerald-500/10 border-emerald-400/20";

  return (
    <p
      role={variant === "error" ? "alert" : "status"}
      className={`mb-6 text-sm border rounded-xl px-4 py-3 ${styles}`}
    >
      {children}
    </p>
  );
}
