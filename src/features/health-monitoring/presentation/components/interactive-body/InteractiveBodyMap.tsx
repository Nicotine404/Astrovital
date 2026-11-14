"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { AlertTriangle, Bone, Eye, Focus, HeartPulse, LineChart, Pause, Play, RotateCcw, Waypoints } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/presentation/ui/card";
import { Button } from "@/core/presentation/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/core/presentation/ui/tooltip";
import { STATUS_META } from "@/core/presentation/shared/status-meta";
import { cn } from "@/core/utils/cn";
import { STRUCTURES, type AnatomicalStructureId } from "../../../domain/value-objects/anatomical-structure.vo";
import { BODY_ZONES, BODY_ZONE_LABELS, type BodyZone } from "../../../domain/value-objects/body-zone.vo";
import type { HealthStatus } from "../../../domain/value-objects/health-status.vo";
import type { OrganAssessment } from "../../../domain/models/organ-assessment.model";
import type { AnatomyModel } from "../../../infrastructure/anatomy/anatomy-model.loader";
import type { AstronautSummaryDto, GravityEnvironmentDto } from "../../../application/dto/dashboard-summary.dto";
import type { TwinLayer, TwinLayers, TwinViewPreset } from "./twin.types";
import { CrewSwitcher } from "../crew/CrewSwitcher";
import { OrganInspector } from "./OrganInspector";

const BodyScene = dynamic(() => import("./BodyScene"), { ssr: false, loading: () => <SceneLoading /> });

function SceneLoading({ label = "Cargando modelo anatómico · 696k polígonos" }: { label?: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 grid place-items-center bg-[#080b11]" data-testid="anatomy-loading">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <div className="size-8 animate-spin rounded-full border-2 border-border border-t-primary" />
        <span className="font-mono text-[11px] tracking-[0.12em] uppercase">{label}</span>
      </div>
    </div>
  );
}

const LAYERS: { id: TwinLayer; label: string; icon: React.ElementType }[] = [
  { id: "skin", label: "Piel", icon: Eye },
  { id: "organs", label: "Órganos", icon: HeartPulse },
  { id: "bones", label: "Esqueleto", icon: Bone },
  { id: "vessels", label: "Vasos", icon: Waypoints },
];

const VIEWS: { id: TwinViewPreset; label: string }[] = [
  { id: "front", label: "Frontal" },
  { id: "back", label: "Posterior" },
  { id: "left", label: "Lat. izq." },
  { id: "right", label: "Lat. der." },
  { id: "top", label: "Superior" },
];

function HudCard({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/45 px-3 py-2 backdrop-blur-md">
      <p className="font-mono text-[9.5px] tracking-[0.14em] text-muted-foreground uppercase">{label}</p>
      <p className="mt-0.5 font-mono text-[13px] text-foreground tabular">{value}</p>
      {sub && <p className="font-mono text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

const glass = "border-white/10 bg-black/50 backdrop-blur-md";

export interface InteractiveBodyMapProps {
  anatomy: { model: AnatomyModel | null; status: "loading" | "ready" | "error"; error: string | null; onRetry: () => void };
  crew: AstronautSummaryDto[];
  member: AstronautSummaryDto;
  onSelectAstronaut: (id: string) => void;
  environment: GravityEnvironmentDto;
  statuses: Partial<Record<AnatomicalStructureId, HealthStatus>>;
  selected: AnatomicalStructureId;
  assessment: OrganAssessment | undefined;
  onSelectStructure: (id: AnatomicalStructureId) => void;
  activeZone: BodyZone | null;
  onZoneChange: (zone: BodyZone | null) => void;
  onOpenTrends: (zone: BodyZone) => void;
  onAssessmentAction: (assessment: OrganAssessment) => void;
  twin: { focused: boolean; autoRotate: boolean; layers: TwinLayers; view: { preset: TwinViewPreset; n: number } };
  onToggleFocus: () => void;
  onToggleAutoRotate: () => void;
  onToggleLayer: (layer: TwinLayer) => void;
  onView: (preset: TwinViewPreset) => void;
  onUserInteract: () => void;
}

/**
 * RF-01 body map: 3D twin + clinical zones (CARDIO / NEURO / IMMUNE / MUSCULOSKELETAL).
 * Pure: state and callbacks come from the controllers wired in the view.
 */
export function InteractiveBodyMap(props: InteractiveBodyMapProps) {
  const { anatomy, crew, member, environment, statuses, selected, assessment, activeZone, twin } = props;
  const a = member.astronaut;
  const msk = member.musculoskeletal;
  const zoneForTrends = activeZone ?? STRUCTURES[selected].zone;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b">
        <div className="space-y-1">
          <CardTitle>Gemelo digital biomédico</CardTitle>
          <p className="text-[13px] text-muted-foreground">
            Reconstrucción anatómica volumétrica · {environment.location} a <span className="font-mono text-foreground">{environment.label}</span>
          </p>
        </div>
        <CrewSwitcher crew={crew} selectedId={a.id} onSelect={props.onSelectAstronaut} />
      </CardHeader>

      <CardContent className="grid gap-0 p-0 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="relative h-[560px] overflow-hidden border-b bg-[#080b11] sm:h-[680px] xl:border-r xl:border-b-0">
          {anatomy.model ? (
            <BodyScene
              model={anatomy.model}
              subject={{ heightCm: a.heightCm, heartRate: member.vitals.heartRate, respiratoryRate: member.vitals.respiratoryRate }}
              statuses={statuses}
              assessment={assessment}
              activeZone={activeZone}
              selected={selected}
              onSelect={props.onSelectStructure}
              autoRotate={twin.autoRotate}
              focused={twin.focused}
              layers={twin.layers}
              view={twin.view}
              onUserInteract={props.onUserInteract}
            />
          ) : anatomy.status === "error" ? (
            <div className="absolute inset-0 grid place-items-center">
              <div className="flex max-w-xs flex-col items-center gap-3 text-center">
                <AlertTriangle className="size-6 text-caution" />
                <p className="text-[13px] text-muted-foreground">{anatomy.error}</p>
                <Button size="sm" variant="outline" onClick={anatomy.onRetry}>
                  Reintentar
                </Button>
              </div>
            </div>
          ) : (
            <SceneLoading />
          )}

          {/* frame corners */}
          <div className="pointer-events-none absolute inset-3">
            {["top-0 left-0 border-t border-l", "top-0 right-0 border-t border-r", "bottom-0 left-0 border-b border-l", "bottom-0 right-0 border-b border-r"].map((c) => (
              <span key={c} className={`absolute size-4 border-white/25 ${c}`} />
            ))}
          </div>

          <div className="pointer-events-none absolute top-5 left-5 hidden space-y-2 md:block">
            <div className="flex items-center gap-2 pb-1">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-nominal opacity-70" />
                <span className="relative inline-flex size-1.5 rounded-full bg-nominal" />
              </span>
              <span className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
                Live · {a.suitId} · 120 Hz
              </span>
            </div>
            <HudCard label="Sujeto" value={a.name} sub={`${a.heightCm} cm · grupo ${a.bloodType}`} />
            <HudCard label="Elongación espinal" value={`+${msk.spinalElongationCm.toFixed(1)} cm`} />
            <HudCard label="Fluid shift cefálico" value={`ΔP +${msk.cephalicFluidShiftMmHg.toFixed(0)} mmHg`} sub={STATUS_META[msk.evaluation.fluidShift].label} />
            <div className={cn("space-y-1 rounded-md border px-3 py-2 font-mono text-[10px] text-muted-foreground", glass)}>
              <Legend color="var(--caution)" label="Precaución" />
              <Legend color="var(--critical)" label="Crítico" />
              <Legend color="var(--primary)" label="Seleccionado" />
            </div>
          </div>

          {/* top-right camera actions */}
          <div className="absolute top-5 right-5 flex gap-1.5">
            <IconAction label="Vista completa" onClick={() => props.onView("reset")}>
              <RotateCcw />
            </IconAction>
            <IconAction label={twin.focused ? "Salir del foco" : "Aislar selección"} onClick={props.onToggleFocus}>
              <Focus className={twin.focused ? "text-primary" : undefined} />
            </IconAction>
            <IconAction label={twin.autoRotate ? "Pausar rotación" : "Rotación automática"} onClick={props.onToggleAutoRotate}>
              {twin.autoRotate ? <Pause /> : <Play />}
            </IconAction>
          </div>

          {/* bottom toolbar */}
          <div className="absolute inset-x-5 bottom-5 flex flex-wrap items-end justify-between gap-2">
            <div className={cn("flex items-center gap-0.5 rounded-md border p-0.5", glass)} role="group" aria-label="Capas">
              {LAYERS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={twin.layers[id]}
                  onClick={() => props.onToggleLayer(id)}
                  className={cn(
                    "flex h-7 items-center gap-1.5 rounded px-2 font-mono text-[10.5px] transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                    twin.layers[id] ? "bg-white/10 text-foreground" : "text-muted-foreground/60 hover:text-foreground"
                  )}
                >
                  <Icon className="size-3.5" />
                  {label}
                </button>
              ))}
            </div>
            <div className={cn("flex items-center gap-0.5 rounded-md border p-0.5", glass)} role="group" aria-label="Vistas">
              {VIEWS.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => props.onView(v.id)}
                  className="h-7 rounded px-2 font-mono text-[10.5px] text-muted-foreground transition-colors cursor-pointer outline-none hover:bg-white/10 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>
          <p className="pointer-events-none absolute top-[52px] right-5 hidden text-right font-mono text-[10px] whitespace-nowrap leading-relaxed text-muted-foreground/80 lg:block">
            Arrastrar · rotar &nbsp;·&nbsp; Clic der. · desplazar
            <br />
            Rueda · zoom al cursor &nbsp;·&nbsp; WASD / QE · mover
          </p>
        </div>

        <OrganInspector
          statuses={statuses}
          selected={selected}
          assessment={assessment}
          activeZone={activeZone}
          suitId={a.suitId}
          generatedAt={member.vitals.recordedAt}
          onSelect={props.onSelectStructure}
          onAction={props.onAssessmentAction}
        />
      </CardContent>
      <ZoneBar zones={member.zones} active={activeZone} onChange={props.onZoneChange} onOpenTrends={() => props.onOpenTrends(zoneForTrends)} />
    </Card>
  );
}

function IconAction({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline" size="icon-sm" className={glass} onClick={onClick} aria-label={label}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="size-1.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

/** Clinical zones: clicking one isolates its structures in the twin and filters the inspector. */
function ZoneBar({
  zones,
  active,
  onChange,
  onOpenTrends,
}: {
  zones: Record<BodyZone, HealthStatus>;
  active: BodyZone | null;
  onChange: (zone: BodyZone | null) => void;
  onOpenTrends: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-3">
      <div className="flex flex-wrap items-center gap-1.5" role="radiogroup" aria-label="Zonas clínicas">
        <span className="eyebrow mr-1">Zonas</span>
        {BODY_ZONES.map((z) => {
          const st = zones[z];
          const meta = STATUS_META[st];
          const on = active === z;
          return (
            <button
              key={z}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(on ? null : z)}
              className={cn(
                "inline-flex h-8 items-center gap-2 rounded-md border px-2.5 text-[12.5px] transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                on ? "border-primary/50 bg-primary/10 text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <span className={cn("size-1.5 rounded-full", meta.bg)} aria-hidden />
              {BODY_ZONE_LABELS[z]}
              <span className={cn("font-mono text-[10.5px]", meta.text)}>{meta.label}</span>
            </button>
          );
        })}
      </div>
      <Button size="sm" variant="outline" onClick={onOpenTrends}>
        <LineChart /> Tendencias 28 días
      </Button>
    </div>
  );
}
