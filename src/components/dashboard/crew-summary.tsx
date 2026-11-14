"use client";

import { StatusBadge } from "@/components/shared/status-badge";
import { useMission } from "@/components/providers/mission-provider";
import { cn } from "@/lib/utils";

export function CrewSummary() {
  const { crew, selectedCrew, selectCrew } = useMission();
  return (
    <section aria-label="Resumen de tripulación" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {crew.map((c) => {
        const active = c.id === selectedCrew.id;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => selectCrew(c.id)}
            aria-pressed={active}
            className={cn(
              "group flex flex-col gap-3 rounded-xl border bg-card p-4 text-left transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
              active ? "border-primary/50 ring-1 ring-primary/20" : "hover:border-foreground/15"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-[12px] font-semibold">{c.initials}</span>
                <span className="min-w-0">
                  <span className="block truncate text-[14px] font-medium">{c.name}</span>
                  <span className="block truncate text-[12px] text-muted-foreground">
                    {c.role} · {c.suitId}
                  </span>
                </span>
              </div>
              <StatusBadge status={c.status} />
            </div>
            <div className="flex items-end justify-between gap-2">
              <div>
                <p className="text-[11.5px] text-muted-foreground">Índice de salud</p>
                <p className="font-mono text-[20px] leading-tight font-medium tabular">
                  {c.healthIndex.toFixed(1)}
                  <span className="text-[12px] text-muted-foreground">%</span>
                </p>
              </div>
              <div className="flex gap-4 text-right font-mono text-[12px] tabular">
                <div>
                  <p className="font-sans text-[11px] text-muted-foreground">FC</p>
                  {c.vitals.heartRate}
                </div>
                <div>
                  <p className="font-sans text-[11px] text-muted-foreground">SpO₂</p>
                  {c.vitals.spo2}
                </div>
              </div>
            </div>
            <p className="border-t pt-2.5 text-[12px] text-muted-foreground">{c.note}</p>
          </button>
        );
      })}
    </section>
  );
}
