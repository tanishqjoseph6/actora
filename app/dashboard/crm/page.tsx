import Link from "next/link";
import { CrmPageHeader } from "@/components/crm/CrmPageHeader";
import { CrmStatCard } from "@/components/crm/CrmStatCard";
import { CrmSubNav } from "@/components/crm/CrmSubNav";
import { formatCurrency, MOCK_COMPANIES, MOCK_CONTACTS } from "@/lib/crm/mock-data";

const CRM_MODULES = [
  {
    href: "/dashboard/crm/contacts",
    icon: "👤",
    title: "Contacts",
    description: "People, roles, and engagement across your accounts.",
    stat: `${MOCK_CONTACTS.length} contacts`,
  },
  {
    href: "/dashboard/crm/companies",
    icon: "🏢",
    title: "Companies",
    description: "Accounts, revenue, and pipeline by organization.",
    stat: `${MOCK_COMPANIES.length} companies`,
  },
  {
    href: "/dashboard/crm/pipeline",
    icon: "📊",
    title: "Pipeline",
    description: "Drag-and-drop Kanban across deal stages.",
    stat: "Kanban board",
  },
  {
    href: "/dashboard/crm/deals",
    icon: "💼",
    title: "Deals",
    description: "List view of every opportunity in your book.",
    stat: "Deal list",
  },
] as const;

export default function CrmHomePage() {
  const activeContacts = MOCK_CONTACTS.filter((c) => c.status === "active").length;
  const totalPipeline = MOCK_COMPANIES.reduce((sum, c) => sum + c.totalPipeline, 0);

  return (
    <>
      <CrmPageHeader
        badge="✨ CRM · Overview"
        title="Customer"
        titleAccent="Relationship Hub"
        description="Manage contacts, companies, and deals from one workspace."
      />

      <div className="mb-6">
        <CrmSubNav />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <CrmStatCard title="Contacts" value={MOCK_CONTACTS.length} />
        <CrmStatCard title="Active contacts" value={activeContacts} />
        <CrmStatCard title="Companies" value={MOCK_COMPANIES.length} />
        <CrmStatCard title="Pipeline" value={formatCurrency(totalPipeline)} />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {CRM_MODULES.map((module) => (
          <Link
            key={module.href}
            href={module.href}
            className="group block rounded-2xl bg-[#0B1220]/80 border border-blue-400/20 p-5 sm:p-6 backdrop-blur-sm hover:border-blue-400/40 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-200"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#111827] border border-[#1E293B] flex items-center justify-center text-xl shrink-0">
                {module.icon}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors">
                  {module.title}
                </h2>
                <p className="text-sm text-gray-400 mt-1">{module.description}</p>
                <p className="text-xs text-blue-400/70 mt-3 font-medium">{module.stat}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
