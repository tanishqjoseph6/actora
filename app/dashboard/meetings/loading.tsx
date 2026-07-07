import { DashboardPageSkeleton } from "@/components/ui/DashboardPageSkeleton";
import { MeetingsContentSkeleton } from "@/components/meetings/MeetingsContentSkeleton";

export default function MeetingsLoading() {
  return (
    <div className="space-y-6 lg:space-y-8">
      <DashboardPageSkeleton statCards={4} showHero={false} showTable={false} />
      <MeetingsContentSkeleton />
    </div>
  );
}
