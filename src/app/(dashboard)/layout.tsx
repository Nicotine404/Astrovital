import { createServerContainer } from "@/core/infrastructure/di/container";
import { MissionDashboardLayout } from "@/core/presentation/layouts/mission-dashboard/MissionDashboardLayout";
import { HealthOverlays } from "@/features/health-monitoring/presentation/views/HealthOverlays";
import { MissionStatusBar } from "@/features/health-monitoring/presentation/views/MissionStatusBar";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { healthMonitoring } = await createServerContainer();
  const summary = await healthMonitoring.getAstronautTelemetry.execute();
  return (
    <MissionDashboardLayout topbarActions={<MissionStatusBar summary={summary} />} overlays={<HealthOverlays summary={summary} />}>
      {children}
    </MissionDashboardLayout>
  );
}
