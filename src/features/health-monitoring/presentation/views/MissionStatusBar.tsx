"use client";

import { Siren } from "lucide-react";
import { Button } from "@/core/presentation/ui/button";
import type { DashboardSummaryDto } from "../../application/dto/dashboard-summary.dto";
import { GravityEnvironmentBar } from "../components/gravity-selector/GravityEnvironmentBar";
import { useGravityController } from "../controllers/useGravityController";
import { useHealthSessionStore } from "../controllers/useHealthSession.store";

/** Topbar slot: gravity environment (RF-03), crisis protocol trigger and crew alert count. */
export function MissionStatusBar({ summary }: { summary: DashboardSummaryDto }) {
  const gravity = useGravityController(summary.environment, summary.environments);
  const setCrisisOpen = useHealthSessionStore((s) => s.setCrisisOpen);
  const commander = summary.crew[0]?.astronaut;
  const alerts = summary.crew.reduce((n, c) => n + c.alerts.length, 0);

  return (
    <>
      <GravityEnvironmentBar environments={gravity.environments} current={gravity.environment} pending={gravity.isPending} onChange={gravity.change} />
      <Button variant="outline" size="sm" className="border-critical/40 text-critical hover:bg-critical/10 hover:text-critical" onClick={() => setCrisisOpen(true)}>
        <Siren />
        <span className="hidden sm:inline">Modo crisis</span>
      </Button>
      {commander && (
        <div className="flex items-center gap-2 pl-1" title={`${alerts} alertas clínicas activas`}>
          <div className="relative grid size-8 place-items-center rounded-full bg-secondary text-[12px] font-semibold">
            {commander.initials}
            {alerts > 0 && <span className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full border-2 border-background bg-caution" />}
          </div>
          <div className="hidden leading-tight 2xl:block">
            <p className="text-[13px] font-medium">{commander.name}</p>
            <p className="text-[11.5px] text-muted-foreground">Oficial al mando</p>
          </div>
        </div>
      )}
    </>
  );
}
