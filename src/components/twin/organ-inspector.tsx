"use client";

import { ArrowRight, CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { useMission } from "@/components/providers/mission-provider";
import { ORGANS, ORGAN_BY_ID, MISSION } from "@/lib/data/mock";
import { STATUS_META } from "@/lib/status";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/providers/toast-provider";

export function OrganInspector() {
  const { selectedCrew, selectedOrgan, selectOrgan } = useMission();
  const toast = useToast();
  const organ = ORGAN_BY_ID[selectedOrgan];
  const a = selectedCrew.assessments[selectedOrgan]!;

  return (
    <div className="flex flex-col">
      <div className="border-b p-5">
        <p className="eyebrow mb-2.5">Sistemas · {ORGANS.length}</p>
        <div className="flex flex-wrap gap-1.5" role="listbox" aria-label="Seleccionar órgano">
          {ORGANS.map((o) => {
            const st = selectedCrew.assessments[o.id]?.status ?? "nominal";
            const active = o.id === selectedOrgan;
            const Icon = STATUS_META[st].icon;
            return (
              <button
                key={o.id}
                role="option"
                aria-selected={active}
                type="button"
                onClick={() => selectOrgan(o.id)}
                className={cn(
                  "inline-flex h-7 items-center gap-1.5 rounded-md border px-2 text-[12px] transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                  active ? "border-primary/50 bg-primary/10 text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                {st !== "nominal" && <Icon className={cn("size-3", STATUS_META[st].text)} aria-label={STATUS_META[st].label} />}
                {o.name.split(" /")[0]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5" aria-live="polite">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="eyebrow">{organ.system}</p>
            <h4 className="mt-1 text-[17px] font-semibold tracking-tight text-balance">{a.title}</h4>
          </div>
          <StatusBadge status={a.status} />
        </div>
        <p className="mt-3 text-[13.5px] leading-relaxed text-muted-foreground text-pretty">{a.summary}</p>

        <dl className="mt-5 grid grid-cols-3 divide-x rounded-lg border bg-muted/30">
          {a.metrics.map((m) => (
            <div key={m.label} className="px-3 py-3">
              <dt className="text-[11.5px] text-muted-foreground">{m.label}</dt>
              <dd className="mt-1 font-mono text-[19px] font-medium tracking-tight tabular">
                {m.value}
                {m.unit && <span className="ml-1 text-[11px] font-normal text-muted-foreground">{m.unit}</span>}
              </dd>
              {m.hint && <p className="mt-0.5 text-[11px] text-muted-foreground/80">{m.hint}</p>}
            </div>
          ))}
        </dl>

        <div className="mt-auto space-y-3 pt-6">
          <div className="flex items-center justify-between text-[12px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CalendarCheck className="size-3.5" /> Calibración in vivo · Sol {MISSION.sol}
            </span>
            <span className="font-mono">{selectedCrew.suitId}</span>
          </div>
          <Button
            className="w-full"
            size="lg"
            variant={a.status === "nominal" ? "secondary" : "default"}
            onClick={() => toast(`${a.action}: iniciado para ${selectedCrew.shortName}`)}
          >
            {a.action}
            <ArrowRight />
          </Button>
        </div>
      </div>
    </div>
  );
}
