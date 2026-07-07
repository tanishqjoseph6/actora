import { BillingPageSkeleton } from "@/components/billing/BillingPageSkeleton";

export default function BillingLoading() {
  return (
    <main className="min-h-screen bg-[#05070B] text-white">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-12 sm:py-16 lg:py-20">
        <BillingPageSkeleton />
      </div>
    </main>
  );
}
