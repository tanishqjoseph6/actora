import Link from "next/link";
import { CrmBackLink } from "@/components/crm/CrmBackLink";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";

export default function CrmNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <CrmBackLink href="/dashboard/crm" label="Back to CRM" />
      <div
        className={`w-16 h-16 rounded-xl ${dashboard.card} border ${dashboard.border} flex items-center justify-center mb-5 mt-4`}
      >
        <span className="text-2xl">🔍</span>
      </div>
      <h1 className="text-xl font-bold text-white mb-2">CRM record not found</h1>
      <p className={`text-sm ${dashboard.muted} max-w-sm mb-6`}>
        This contact or company does not exist in your workspace.
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link
          href="/dashboard/crm/contacts"
          className={`${dashboard.btnSecondary} px-4 py-2 text-sm ${dashboard.accent}`}
        >
          View contacts
        </Link>
        <Link
          href="/dashboard/crm/companies"
          className={`${dashboard.btnSecondary} px-4 py-2 text-sm ${dashboard.accent}`}
        >
          View companies
        </Link>
      </div>
    </div>
  );
}
