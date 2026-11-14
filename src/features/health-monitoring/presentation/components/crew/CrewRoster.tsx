"use client";

import * as React from "react";
import { ArrowUpRight, Link2Off, Radiation, UserPlus } from "lucide-react";
import { Button } from "@/core/presentation/ui/button";
import { Card } from "@/core/presentation/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/core/presentation/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/core/presentation/ui/tooltip";
import { StatusBadge } from "@/core/presentation/shared/StatusBadge";
import { STATUS_META } from "@/core/presentation/shared/status-meta";
import { EcgTrace } from "@/core/presentation/shared/EcgTrace";
import { PageHeader } from "@/core/presentation/shared/PageHeader";
import { cn } from "@/core/utils/cn";
import type { HealthStatus } from "../../../domain/value-objects/health-status.vo";
import type { ClinicalThresholds } from "../../../domain/services/clinical-rules.domain-service";
import type { AstronautSummaryDto } from "../../../application/dto/dashboard-summary.dto";
import type { RegisterAstronautDto } from "../../../application/dto/record-measurement.dto";
import { AddCrewDialog } from "./AddCrewDialog";

type Filter = "all" | HealthStatus;

export function CrewRoster({
  crew,
  thresholds,
  pending,
  onRegister,
  onUnlink,
  onOpenTwin,
}: {
  crew: AstronautSummaryDto[];
  thresholds: ClinicalThresholds;
  pending: boolean;
  onRegister: (dto: RegisterAstronautDto) => Promise<{ ok: boolean; fieldErrors?: Record<string, string[]> }>;
  onUnlink: (id: string, name: string) => void;
  onOpenTwin: (id: string) => void;
}) {
  const [filter, setFilter] = React.useState<Filter>("all");

  const counts = {
    all: crew.length,
    NOMINAL: crew.filter((c) => c.overall === "NOMINAL").length,
    WARNING: crew.filter((c) => c.overall === "WARNING").length,
    CRITICAL: crew.filter((c) => c.overall === "CRITICAL").length,
  };
  const visible = crew.filter((c) => filter === "all" || c.overall === filter);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Tripulación · malla UWB 120 Hz"
        title="Telemetría clínica de la tripulación"
        description="Monitorización biométrica multicanal en tiempo real para cada miembro de la misión."
        actions={
          <AddCrewDialog pending={pending} onSubmit={onRegister}>
            <Button>
              <UserPlus /> Agregar tripulante
            </Button>
          </AddCrewDialog>
        }
      />

      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
        <TabsList>
          {(
            [
              ["all", "Todos"],
              ["NOMINAL", "Nominal"],
              ["WARNING", "Precaución"],
              ["CRITICAL", "Crítico"],
            ] as const
          ).map(([k, label]) => (
            <TabsTrigger key={k} value={k}>
              {label}
              <span className="font-mono text-[11px] text-muted-foreground">{counts[k]}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          Ningún tripulante en estado {filter === "all" ? "" : STATUS_META[filter].label.toLowerCase()}.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {visible.map((member) => {
            const c = { ...member.astronaut, status: member.overall, vitals: member.vitals };
            const ev = member.vitalsEvaluation;
            const metrics = [
              { label: "Frec. cardíaca", value: Math.round(c.vitals.heartRate), unit: "lpm", status: ev.heartRate },
              { label: "SpO₂", value: c.vitals.spo2.toFixed(1), unit: "%", status: ev.spo2 },
              { label: "Presión art.", value: `${Math.round(c.vitals.systolic)}/${Math.round(c.vitals.diastolic)}`, unit: "mmHg", status: ev.bloodPressure },
              {
                label: `PIC · umbral ${thresholds.icpWarning}`,
                value: c.vitals.intracranialPressure.toFixed(1),
                unit: "mmHg",
                status: ev.intracranialPressure,
              },
            ];
            return (
              <Card key={c.id} className={cn("gap-0 p-5", c.status === "WARNING" && "border-caution/30", c.status === "CRITICAL" && "border-critical/40")}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-secondary text-[13px] font-semibold">{c.initials}</span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-[15px] font-semibold">{c.name}</h3>
                        <StatusBadge status={c.status} />
                      </div>
                      <p className="mt-0.5 truncate text-[12.5px] text-muted-foreground">
                        {c.role} · {c.suitId} · Grupo {c.bloodType}
                      </p>
                    </div>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={pending || crew.length <= 1}
                        onClick={() => onUnlink(c.id, c.name)}
                        aria-label={`Desacoplar telemetría de ${c.name}`}
                      >
                        <Link2Off />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Desacoplar telemetría</TooltipContent>
                  </Tooltip>
                </div>

                <dl className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-4">
                  {metrics.map((m) => (
                    <div key={m.label} className="bg-card px-3 py-2.5">
                      <dt className="text-[11.5px] text-muted-foreground">{m.label}</dt>
                      <dd className={cn("mt-0.5 font-mono text-[17px] font-medium tabular", m.status !== "NOMINAL" && STATUS_META[m.status].text)}>
                        {m.value}
                        <span className="ml-1 text-[11px] font-normal text-muted-foreground">{m.unit}</span>
                      </dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-4 rounded-lg border bg-muted/20 px-3 py-2">
                  <div className="flex items-center justify-between text-[11.5px] text-muted-foreground">
                    <span>ECG · derivación II</span>
                    <span className="font-mono">25 mm/s</span>
                  </div>
                  <EcgTrace bpm={c.vitals.heartRate} color={STATUS_META[c.status].cssVar} />
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[12.5px]">
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Radiation className="size-3.5" />
                      <span className="font-mono text-foreground">{member.radiation.cumulativeMsv.toFixed(1)}</span> mSv
                    </span>
                    <span className="line-clamp-1">{member.alerts[0]?.message ?? c.note}</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => onOpenTwin(c.id)}>
                    Ver gemelo digital <ArrowUpRight />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
