import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";

type CrmPageHeaderProps = {
  badge: string;
  title: string;
  titleAccent: string;
  description: string;
};

export function CrmPageHeader({
  badge,
  title,
  titleAccent,
  description,
}: CrmPageHeaderProps) {
  return (
    <div className="mb-5 sm:mb-6 lg:mb-8">
      <div
        className={`inline-flex items-center gap-2 px-3 sm:px-4 py-1 rounded-full border ${dashboard.border} ${dashboard.accent} text-xs sm:text-sm mb-3 sm:mb-4 ${dashboard.surface}`}
      >
        {badge}
      </div>
      <h1 className={dashboard.pageTitle}>
        {title}{" "}
        <span className="text-white">{titleAccent}</span>
      </h1>
      <p className={`${dashboard.muted} mt-2 text-sm sm:text-base max-w-2xl`}>
        {description}
      </p>
    </div>
  );
}
