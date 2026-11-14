"use client";

import { useRouter } from "next/navigation";
import type { DashboardSummaryDto } from "../../application/dto/dashboard-summary.dto";
import { CrewRoster } from "../components/crew/CrewRoster";
import { useCrewController } from "../controllers/useCrewController";

export function CrewView({ summary }: { summary: DashboardSummaryDto }) {
  const crew = useCrewController();
  const router = useRouter();
  return (
    <CrewRoster
      crew={summary.crew}
      thresholds={summary.thresholds}
      pending={crew.isPending}
      onRegister={crew.register}
      onUnlink={crew.unlink}
      onOpenTwin={(id) => {
        crew.selectAstronaut(id);
        router.push("/#digital-twin");
      }}
    />
  );
}
