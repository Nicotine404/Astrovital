"use client";

import { useMission } from "@/components/providers/mission-provider";
import { STATUS_META } from "@/lib/status";
import { cn } from "@/lib/utils";

export function CrewSwitcher({ className }: { className?: string }) {
  const { crew, selectedCrew, selectCrew } = useMission();
  return (
    <div className={cn("flex items-center gap-1 overflow-x-auto rounded-lg border bg-muted/60 p-0.5 scrollbar-thin", className)} role="tablist" aria-label="Tripulante">
      {crew.map((c) => {
        const active = c.id === selectedCrew.id;
        const meta = STATUS_META[c.status];
        return (
          <button
            key={c.id}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => selectCrew(c.id)}
            className={cn(
              "flex h-8 shrink-0 items-center gap-2 rounded-md px-2.5 text-[12.5px] font-medium transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
              active ? "bg-accent text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className={cn("size-1.5 rounded-full", meta.bg)} aria-label={meta.label} />
            {c.shortName}
          </button>
        );
      })}
    </div>
  );
}
