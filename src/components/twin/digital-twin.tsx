"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Maximize2, Pause, Play } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useMission } from "@/components/providers/mission-provider";
import { CrewSwitcher } from "@/components/shared/crew-switcher";
import { OrganInspector } from "./organ-inspector";
import type { OrganId } from "@/lib/data/types";

const BodyScene = dynamic(() => import("./body-scene"), {
  ssr: false,
  loading: () => (
    <div className="grid size-full place-items-center bg-[#080b11]">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <div className="size-8 animate-spin rounded-full border-2 border-border border-t-primary" />
        <span className="font-mono text-[11px] tracking-[0.12em] uppercase">Inicializando gemelo digital</span>
      </div>
    </div>
  ),
});

function HudCard({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/45 px-3 py-2 backdrop-blur-md">
      <p className="font-mono text-[9.5px] tracking-[0.14em] text-muted-foreground uppercase">{label}</p>
      <p className="mt-0.5 font-mono text-[13px] text-foreground tabular">{value}</p>
      {sub && <p className="font-mono text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

export function DigitalTwin() {
  const { selectedCrew, selectedOrgan, selectOrgan, environment } = useMission();
  const [autoRotate, setAutoRotate] = React.useState(true);
  const [focused, setFocused] = React.useState(false);

  // Any selection change (scene, markers, inspector, analyzer) focuses the camera.
  const first = React.useRef(true);
  React.useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setFocused(true);
  }, [selectedOrgan]);

  const onSelect = React.useCallback(
    (id: OrganId) => {
      selectOrgan(id);
      setFocused(true);
    },
    [selectOrgan]
  );

  const zeroG = environment.gravity === 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b">
        <div className="space-y-1">
          <CardTitle>Gemelo digital biomédico</CardTitle>
          <p className="text-[13px] text-muted-foreground">
            Reconstrucción volumétrica en tiempo real · {environment.name.toLowerCase()} a{" "}
            <span className="font-mono text-foreground">{environment.gravity.toFixed(2)} g</span>
          </p>
        </div>
        <CrewSwitcher />
      </CardHeader>

      <CardContent className="grid gap-0 p-0 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="relative h-[520px] overflow-hidden border-b bg-[#080b11] sm:h-[620px] xl:border-r xl:border-b-0">
          <BodyScene
            crew={selectedCrew}
            selected={selectedOrgan}
            onSelect={onSelect}
            gravity={environment.gravity}
            autoRotate={autoRotate}
            focused={focused}
          />

          {/* frame corners */}
          <div className="pointer-events-none absolute inset-3">
            {["top-0 left-0 border-t border-l", "top-0 right-0 border-t border-r", "bottom-0 left-0 border-b border-l", "bottom-0 right-0 border-b border-r"].map((c) => (
              <span key={c} className={`absolute size-4 border-white/25 ${c}`} />
            ))}
          </div>

          <div className="pointer-events-none absolute top-5 left-5 hidden space-y-2 sm:block">
            <div className="flex items-center gap-2 pb-1">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-nominal opacity-70" />
                <span className="relative inline-flex size-1.5 rounded-full bg-nominal" />
              </span>
              <span className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
                Live · {selectedCrew.suitId} · 120 Hz
              </span>
            </div>
            <HudCard label="Sujeto" value={selectedCrew.name} sub={`${selectedCrew.heightCm} cm · grupo ${selectedCrew.bloodType}`} />
            <HudCard label="Elongación espinal" value={`+${zeroG ? "4.1" : "3.2"} cm`} />
            <HudCard label="Fluid shift cefálico" value={`ΔP +${zeroG ? 24 : 18} mmHg`} />
          </div>

          <div className="absolute top-5 right-5 flex gap-1.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon-sm"
                  className="border-white/10 bg-black/45 backdrop-blur-md"
                  onClick={() => setFocused(false)}
                  disabled={!focused}
                  aria-label="Vista completa"
                >
                  <Maximize2 />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Vista completa</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon-sm"
                  className="border-white/10 bg-black/45 backdrop-blur-md"
                  onClick={() => setAutoRotate((v) => !v)}
                  aria-label={autoRotate ? "Pausar rotación" : "Reanudar rotación"}
                >
                  {autoRotate ? <Pause /> : <Play />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{autoRotate ? "Pausar rotación" : "Reanudar rotación"}</TooltipContent>
            </Tooltip>
          </div>

          <div className="pointer-events-none absolute inset-x-5 bottom-5 flex flex-wrap items-end justify-between gap-2">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md border border-white/10 bg-black/45 px-3 py-1.5 font-mono text-[10.5px] text-muted-foreground backdrop-blur-md">
              <Legend color="rgba(214,224,245,0.7)" label="Nominal" />
              <Legend color="var(--caution)" label="Precaución" />
              <Legend color="var(--critical)" label="Crítico" />
              <Legend color="var(--primary)" label="Seleccionado" />
            </div>
            <span className="hidden font-mono text-[10.5px] text-muted-foreground lg:inline">Arrastrar · rotar &nbsp;/&nbsp; rueda · zoom &nbsp;/&nbsp; clic · inspeccionar</span>
          </div>
        </div>

        <OrganInspector />
      </CardContent>
    </Card>
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
