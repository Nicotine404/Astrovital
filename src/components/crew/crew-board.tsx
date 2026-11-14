"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Link2Off, Radiation, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { StatusBadge } from "@/components/shared/status-badge";
import { EcgTrace } from "@/components/shared/ecg-trace";
import { PageHeader } from "@/components/shared/page-header";
import { useMission } from "@/components/providers/mission-provider";
import { useToast } from "@/components/providers/toast-provider";
import type { CrewMember, Status } from "@/lib/data/types";
import { cn } from "@/lib/utils";
import { AddCrewDialog } from "./add-crew-dialog";

type Filter = "all" | Status;

export function CrewBoard() {
  const { crew, setCrew, selectCrew } = useMission();
  const toast = useToast();
  const router = useRouter();
  const [filter, setFilter] = React.useState<Filter>("all");

  const counts = {
    all: crew.length,
    nominal: crew.filter((c) => c.status === "nominal").length,
    caution: crew.filter((c) => c.status === "caution").length,
    critical: crew.filter((c) => c.status === "critical").length,
  };
  const visible = crew.filter((c) => filter === "all" || c.status === filter);

  const openTwin = (id: string) => {
    selectCrew(id);
    router.push("/#digital-twin");
  };

  const unlink = (c: CrewMember) => {
    if (crew.length <= 1) return;
    setCrew((list) => list.filter((x) => x.id !== c.id));
    toast(`Telemetría desacoplada: ${c.name}`, "error");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Tripulación · malla UWB 120 Hz"
        title="Telemetría clínica de la tripulación"
        description="Monitorización biométrica multicanal en tiempo real para cada miembro de la misión."
        actions={
          <AddCrewDialog>
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
              ["nominal", "Nominal"],
              ["caution", "Precaución"],
              ["critical", "Crítico"],
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
          Ningún tripulante en estado {filter === "critical" ? "crítico" : filter}. Buenas noticias.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {visible.map((c) => {
            const metrics = [
              { label: "Frec. cardíaca", value: c.vitals.heartRate, unit: "lpm" },
              { label: "SpO₂", value: c.vitals.spo2, unit: "%" },
              { label: "Presión art.", value: `${c.vitals.systolic}/${c.vitals.diastolic}`, unit: "mmHg" },
              { label: "PIC estimada", value: c.vitals.icp, unit: "mmHg", flag: c.vitals.icp > 15 },
            ];
            return (
              <Card key={c.id} className={cn("gap-0 p-5", c.status === "caution" && "border-caution/30", c.status === "critical" && "border-critical/40")}>
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
                      <Button variant="ghost" size="icon-sm" onClick={() => unlink(c)} aria-label={`Desacoplar telemetría de ${c.name}`}>
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
                      <dd className={cn("mt-0.5 font-mono text-[17px] font-medium tabular", m.flag && "text-caution")}>
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
                  <EcgTrace bpm={c.vitals.heartRate} color={c.status === "nominal" ? "var(--nominal)" : `var(--${c.status})`} />
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[12.5px]">
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Radiation className="size-3.5" />
                      <span className="font-mono text-foreground">{c.vitals.radiationMSv.toFixed(1)}</span> mSv
                    </span>
                    <span>{c.note}</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => openTwin(c.id)}>
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
