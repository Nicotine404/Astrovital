"use client";

import { StatusBadge } from "@/core/presentation/shared/StatusBadge";
import { cn } from "@/core/utils/cn";
import type { AstronautSummaryDto } from "../../../application/dto/dashboard-summary.dto";

export function CrewSummary({ crew, selectedId, onSelect }: { crew: AstronautSummaryDto[]; selectedId: string; onSelect: (id: string) => void }) {
  return (
    <section aria-label="Resumen de tripulación" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {crew.map((c) => {
        const a = c.astronaut;
        const active = a.id === selectedId;
        return (
          <button
            key={a.id}
            type="button"
            onClick={() => onSelect(a.id)}
            aria-pressed={active}
            className={cn(
              "group flex flex-col gap-3 rounded-xl border bg-card p-4 text-left transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
              active ? "border-primary/50 ring-1 ring-primary/20" : "hover:border-foreground/15"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-[12px] font-semibold">{a.initials}</span>
                <span className="min-w-0">
                  <span className="block truncate text-[14px] font-medium">{a.name}</span>
                  <span className="block truncate text-[12px] text-muted-foreground">
                    {a.role} · {a.suitId}
                  </span>
                </span>
              </div>
              <StatusBadge status={c.overall} />
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
                  {Math.round(c.vitals.heartRate)}
                </div>
                <div>
                  <p className="font-sans text-[11px] text-muted-foreground">SpO₂</p>
                  {c.vitals.spo2.toFixed(1)}
                </div>
                <div>
                  <p className="font-sans text-[11px] text-muted-foreground">PIC</p>
                  {c.vitals.intracranialPressure.toFixed(1)}
                </div>
              </div>
            </div>
            <p className="line-clamp-2 border-t pt-2.5 text-[12px] text-muted-foreground">{c.alerts[0]?.message ?? a.note}</p>
          </button>
        );
      })}
    </section>
  );
}
