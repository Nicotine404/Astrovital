"use client";

import { ArrowRight, CalendarCheck } from "lucide-react";
import { Button } from "@/core/presentation/ui/button";
import { StatusBadge } from "@/core/presentation/shared/StatusBadge";
import { STATUS_META } from "@/core/presentation/shared/status-meta";
import { cn } from "@/core/utils/cn";
import { ANATOMICAL_STRUCTURES, STRUCTURES, type AnatomicalStructureId } from "../../../domain/value-objects/anatomical-structure.vo";
import { BODY_ZONE_LABELS, type BodyZone } from "../../../domain/value-objects/body-zone.vo";
import type { HealthStatus } from "../../../domain/value-objects/health-status.vo";
import type { OrganAssessment } from "../../../domain/models/organ-assessment.model";

const GROUPS = [
  { label: "Órganos y sistemas", items: ANATOMICAL_STRUCTURES.filter((id) => STRUCTURES[id].category !== "bone") },
  { label: "Esqueleto", items: ANATOMICAL_STRUCTURES.filter((id) => STRUCTURES[id].category === "bone") },
];

export function OrganInspector({
  statuses,
  selected,
  assessment,
  activeZone,
  suitId,
  generatedAt,
  onSelect,
  onAction,
}: {
  statuses: Partial<Record<AnatomicalStructureId, HealthStatus>>;
  selected: AnatomicalStructureId;
  assessment: OrganAssessment | undefined;
  activeZone: BodyZone | null;
  suitId: string;
  generatedAt: string;
  onSelect: (id: AnatomicalStructureId) => void;
  onAction: (assessment: OrganAssessment) => void;
}) {
  const def = STRUCTURES[selected];
  const recalibrated = assessment && assessment.status !== assessment.clinicalStatus;

  return (
    <div className="flex flex-col">
      <div className="space-y-4 border-b p-5">
        {GROUPS.map((g) => {
          const items = activeZone ? g.items.filter((id) => STRUCTURES[id].zone === activeZone) : g.items;
          if (!items.length) return null;
          return (
            <div key={g.label}>
              <p className="eyebrow mb-2">
                {g.label} · {items.length}
                {activeZone && <span className="text-primary"> · {BODY_ZONE_LABELS[activeZone]}</span>}
              </p>
              <div className="flex flex-wrap gap-1.5" role="listbox" aria-label={g.label}>
                {items.map((id) => {
                  const st = statuses[id] ?? "NOMINAL";
                  const active = id === selected;
                  const Icon = STATUS_META[st].icon;
                  return (
                    <button
                      key={id}
                      role="option"
                      aria-selected={active}
                      type="button"
                      onClick={() => onSelect(id)}
                      className={cn(
                        "inline-flex h-7 items-center gap-1.5 rounded-md border px-2 text-[12px] transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                        active ? "border-primary/50 bg-primary/10 text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      )}
                    >
                      {st !== "NOMINAL" && <Icon className={cn("size-3", STATUS_META[st].text)} aria-label={STATUS_META[st].label} />}
                      {STRUCTURES[id].name}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-1 flex-col p-5" aria-live="polite">
        {assessment ? (
          <>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="eyebrow">
                  {def.system}
                  {def.system.toLowerCase() !== BODY_ZONE_LABELS[def.zone].toLowerCase() && ` · ${BODY_ZONE_LABELS[def.zone]}`}
                </p>
                <h4 className="mt-1 text-[17px] font-semibold tracking-tight text-balance">{assessment.title}</h4>
              </div>
              <StatusBadge status={assessment.status} />
            </div>
            <p className="mt-3 text-[13.5px] leading-relaxed text-muted-foreground text-pretty">{assessment.summary}</p>
            {recalibrated && (
              <p className="mt-3 rounded-md border border-caution/30 bg-caution/5 px-3 py-2 text-[12.5px] text-caution">
                Reclasificado por umbrales de gravedad: hallazgo clínico {STATUS_META[assessment.clinicalStatus].label.toLowerCase()} →{" "}
                {STATUS_META[assessment.status].label.toLowerCase()}.
              </p>
            )}

            <dl className="mt-5 grid grid-cols-3 divide-x rounded-lg border bg-muted/30">
              {assessment.metrics.slice(0, 3).map((m) => (
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
                  <CalendarCheck className="size-3.5" /> Calibración in vivo ·{" "}
                  {new Date(generatedAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" })} UTC
                </span>
                <span className="font-mono">{suitId}</span>
              </div>
              <Button className="w-full" size="lg" variant={assessment.status === "NOMINAL" ? "secondary" : "default"} onClick={() => onAction(assessment)}>
                {assessment.recommendedAction}
                <ArrowRight />
              </Button>
            </div>
          </>
        ) : (
          <p className="text-[13px] text-muted-foreground">Sin evaluación registrada para {def.name.toLowerCase()}.</p>
        )}
      </div>
    </div>
  );
}
