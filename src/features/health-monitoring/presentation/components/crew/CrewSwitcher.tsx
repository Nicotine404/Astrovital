"use client";

import { STATUS_META } from "@/core/presentation/shared/status-meta";
import { cn } from "@/core/utils/cn";
import type { AstronautSummaryDto } from "../../../application/dto/dashboard-summary.dto";

export function CrewSwitcher({
  crew,
  selectedId,
  onSelect,
  className,
}: {
  crew: AstronautSummaryDto[];
  selectedId: string;
  onSelect: (id: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-1 overflow-x-auto rounded-lg border bg-muted/60 p-0.5 scrollbar-thin", className)} role="tablist" aria-label="Tripulante">
      {crew.map((c) => {
        const active = c.astronaut.id === selectedId;
        const meta = STATUS_META[c.overall];
        return (
          <button
            key={c.astronaut.id}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => onSelect(c.astronaut.id)}
            className={cn(
              "flex h-8 shrink-0 items-center gap-2 rounded-md px-2.5 text-[12.5px] font-medium transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
              active ? "bg-accent text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className={cn("size-1.5 rounded-full", meta.bg)} aria-label={meta.label} />
            {c.astronaut.shortName}
          </button>
        );
      })}
    </div>
  );
}
