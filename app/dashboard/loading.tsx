import { DashboardPageSkeleton } from "@/components/ui/DashboardPageSkeleton";

export default function DashboardLoading() {
  return (
    <DashboardPageSkeleton
      statCards={7}
      showHero
      showWidgets
      showBottomGrid
      showTable={false}
    />
  );
}
