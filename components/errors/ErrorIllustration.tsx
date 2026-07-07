type ErrorIllustrationVariant = "404" | "500" | "offline";

export function ErrorIllustration({
  variant,
  className = "w-28 h-28 sm:w-32 sm:h-32",
}: {
  variant: ErrorIllustrationVariant;
  className?: string;
}) {
  const gradientId = `error-grad-${variant}`;

  return (
    <svg
      viewBox="0 0 80 80"
      className={className}
      aria-hidden
      fill="none"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
      </defs>

      {variant === "404" && (
        <>
          <rect
            x="14"
            y="16"
            width="52"
            height="48"
            rx="8"
            stroke={`url(#${gradientId})`}
            strokeWidth="2.5"
          />
          <path
            d="M26 34 H54 M26 44 H46 M26 54 H38"
            stroke="#2563EB"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.45"
          />
          <circle cx="56" cy="24" r="10" fill="#0B1220" stroke="#2563EB" strokeWidth="2" />
          <path
            d="M52 24 L56 28 L60 20"
            stroke="#93C5FD"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <text
            x="40"
            y="72"
            textAnchor="middle"
            fill="#64748B"
            fontSize="9"
            fontFamily="system-ui, sans-serif"
            fontWeight="600"
          >
            404
          </text>
        </>
      )}

      {variant === "500" && (
        <>
          <path
            d="M40 14 L62 58 H18 Z"
            stroke={`url(#${gradientId})`}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path
            d="M40 28 V42"
            stroke="#93C5FD"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="40" cy="50" r="2" fill="#93C5FD" />
          <rect
            x="22"
            y="62"
            width="36"
            height="6"
            rx="3"
            fill="#2563EB"
            opacity="0.35"
          />
        </>
      )}

      {variant === "offline" && (
        <>
          <circle
            cx="40"
            cy="38"
            r="18"
            stroke={`url(#${gradientId})`}
            strokeWidth="2.5"
          />
          <path
            d="M22 48 C28 32 52 32 58 48"
            stroke="#2563EB"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.55"
          />
          <path
            d="M28 52 C32 44 48 44 52 52"
            stroke="#2563EB"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.75"
          />
          <circle cx="40" cy="54" r="2.5" fill="#3B82F6" />
          <path
            d="M18 22 L62 62"
            stroke="#EF4444"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.85"
          />
        </>
      )}
    </svg>
  );
}
