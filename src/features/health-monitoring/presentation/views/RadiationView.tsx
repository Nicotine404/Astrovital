"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/core/presentation/ui/card";
import { STATUS_META } from "@/core/presentation/shared/status-meta";
import { cn } from "@/core/utils/cn";
import type { DashboardSummaryDto } from "../../application/dto/dashboard-summary.dto";
import { CrewSwitcher } from "../components/crew/CrewSwitcher";
import { CansRadiationWidget } from "../components/radiation-cans/CansRadiationWidget";
import { DoseChart } from "../components/radiation-cans/DoseChart";
import { useRadiationController } from "../controllers/useRadiationController";
import { useTelemetryController } from "../controllers/useTelemetryController";

/** RF-02 page: CANS widget for the selected astronaut, mission dose curve and crew exposure. */
export function RadiationView({ summary }: { summary: DashboardSummaryDto }) {
  const t = useTelemetryController(summary);
  const radiation = useRadiationController();
  const member = t.selected;
  const limit = member.radiation.careerLimitMsv;

  return (
    <div className="space-y-4">
      <CrewSwitcher crew={t.crew} selectedId={member.astronaut.id} onSelect={t.selectAstronaut} className="w-fit" />
      <CansRadiationWidget member={member} shelter={summary.habitat.shelter} pending={radiation.isPending} onSimulateSolarEvent={radiation.simulateSolarEvent} onLogBackground={radiation.logBackground} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Dosis acumulada · {member.astronaut.shortName}</CardTitle>
              <p className="mt-1 text-[13px] text-muted-foreground">mSv · últimas {member.radiation.series.length} lecturas del dosímetro</p>
            </div>
          </CardHeader>
          <CardContent>
            <DoseChart data={member.radiation.series} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Exposición por tripulante</CardTitle>
              <p className="mt-1 text-[13px] text-muted-foreground">Dosímetro personal del traje</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {t.crew.map((c) => {
              const st = c.radiation.evaluation.cumulative;
              return (
                <div key={c.astronaut.id}>
                  <div className="mb-1.5 flex items-baseline justify-between text-[13px]">
                    <span>{c.astronaut.name}</span>
                    <span className="font-mono tabular">
                      {c.radiation.cumulativeMsv.toFixed(1)} <span className="text-muted-foreground">mSv</span>
                    </span>
                  </div>
                  <div className="relative h-2 overflow-hidden rounded-full bg-secondary">
                    <div className={cn("h-full rounded-full", st === "NOMINAL" ? "bg-primary" : STATUS_META[st].bg)} style={{ width: `${Math.min(100, (c.radiation.cumulativeMsv / limit) * 100)}%` }} />
                  </div>
                </div>
              );
            })}
            <p className="border-t pt-3 text-[12px] text-muted-foreground">Escala: 0 – {limit} mSv (límite de carrera de referencia).</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
