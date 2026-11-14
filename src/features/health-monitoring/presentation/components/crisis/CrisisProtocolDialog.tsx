"use client";

import * as React from "react";
import { Check, HeartPulse, Pill, ScanHeart, Wind } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/core/presentation/ui/dialog";
import { Button } from "@/core/presentation/ui/button";
import { cn } from "@/core/utils/cn";

const STEPS = [
  {
    icon: ScanHeart,
    title: "Medición guiada",
    body: (
      <>
        Colocar el transductor en el <strong className="font-medium text-foreground">4.º espacio intercostal izquierdo</strong> (ventana apical 4 cámaras).
      </>
    ),
    checks: ["Auto-captura de FEVI", "Descartar derrame o taponamiento"],
    action: "Activar sonda ecográfica",
  },
  {
    icon: HeartPulse,
    title: "Ajuste fisiológico a gravedad parcial",
    body: "El corazón adopta una configuración más esférica y la volemia plasmática se reduce ~15 %. Descartar sobrecarga ventricular y arritmias por redistribución de potasio.",
    checks: ["Límites de troponina I ajustados a hipovolemia espacial"],
    action: "Confirmar evaluación",
  },
  {
    icon: Pill,
    title: "Acción terapéutica",
    body: (
      <>
        Administrar <strong className="font-medium text-foreground">300 mg de AAS masticable</strong> (dispensario A-1) y conectar <strong className="font-medium text-foreground">O₂ normobárico al 100 %</strong> mientras se transmite la telemetría.
      </>
    ),
    checks: ["Dispensario A-1 desbloqueado por UWB"],
    action: "Confirmar administración",
  },
];

/** Pure: open state and environment arrive as props. */
export function CrisisProtocolDialog({
  open,
  onOpenChange,
  gravityLabel,
  commDelay,
  patientName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gravityLabel: string;
  commDelay: string;
  patientName: string;
}) {
  const crisisOpen = open;
  const setCrisisOpen = onOpenChange;
  const [step, setStep] = React.useState(0);
  const [o2, setO2] = React.useState(false);

  React.useEffect(() => {
    if (!crisisOpen) {
      setStep(0);
      setO2(false);
    }
  }, [crisisOpen]);

  return (
    <Dialog open={crisisOpen} onOpenChange={setCrisisOpen}>
      <DialogContent className="max-w-4xl border-critical/40">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-critical opacity-70" />
              <span className="relative inline-flex size-2.5 rounded-full bg-critical" />
            </span>
            <span className="eyebrow !text-critical">Prioridad 1 · Triaje autónomo</span>
          </div>
          <DialogTitle className="text-xl">Protocolo de dolor torácico agudo</DialogTitle>
          <DialogDescription>
            Paciente: {patientName} · entorno {gravityLabel} · retardo con la Tierra {commDelay}. Siga los pasos en orden; el sistema
            registra cada acción para el informe médico.
          </DialogDescription>
        </DialogHeader>

        <ol className="grid gap-3 md:grid-cols-3">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const state = i < step ? "done" : i === step ? "active" : "pending";
            return (
              <li
                key={s.title}
                className={cn(
                  "flex flex-col rounded-lg border p-4 transition-colors",
                  state === "active" && "border-critical/50 bg-critical/5",
                  state === "done" && "border-nominal/30",
                  state === "pending" && "opacity-55"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] text-muted-foreground">Paso {i + 1}</span>
                  {state === "done" ? <Check className="size-4 text-nominal" /> : <Icon className="size-4 text-muted-foreground" />}
                </div>
                <h4 className="mt-2 text-[15px] font-semibold">{s.title}</h4>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{s.body}</p>
                <ul className="mt-3 space-y-1 text-[12.5px] text-secondary-foreground">
                  {s.checks.map((c) => (
                    <li key={c} className="flex gap-2">
                      <span className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground" />
                      {c}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto space-y-2 pt-4">
                  <Button
                    className="w-full"
                    variant={state === "active" ? "destructive" : "outline"}
                    size="lg"
                    disabled={state !== "active"}
                    onClick={() => setStep((n) => n + 1)}
                  >
                    {state === "done" ? "Completado" : s.action}
                  </Button>
                  {i === 2 && (
                    <Button className="w-full" variant="outline" size="lg" disabled={step < 2} onClick={() => setO2(true)}>
                      <Wind /> {o2 ? "O₂ a 15 L/min activo" : "Iniciar flujo O₂ (15 L/min)"}
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ol>

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/40 px-4 py-3 text-[13px]">
          <span className="text-muted-foreground">Ráfaga de telemetría enviada a control de misión</span>
          <span className="font-mono tabular">Acuse estimado +28m 44s</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
