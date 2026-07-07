import { DashboardPageSkeleton } from "@/components/ui/DashboardPageSkeleton";
import { TasksContentSkeleton } from "@/components/tasks/TasksContentSkeleton";

export default function TasksLoading() {
  return (
    <div className="space-y-6">
      <DashboardPageSkeleton statCards={4} showHero={false} showTable={false} />
      <TasksContentSkeleton />
    </div>
  );
}
