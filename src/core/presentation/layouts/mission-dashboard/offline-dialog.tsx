"use client";

import * as React from "react";
import { Check, Cpu, Database, Layers, RefreshCcw } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/core/presentation/ui/dialog";
import { Button } from "@/core/presentation/ui/button";
import { Progress } from "@/core/presentation/ui/progress";

const LAYERS = [
  {
    icon: Layers,
    title: "Service Worker",
    tag: "v3.4.1 · activo",
    body: "Estrategia cache-first: la interfaz, fuentes, modelos 3D y pesos de IA se precargan antes del lanzamiento.",
    rows: [["Caché", "142.8 MB"], ["Recursos", "100 % precargados"]],
    action: "Validar integridad",
    done: "Integridad verificada",
  },
  {
    icon: Database,
    title: "Almacenamiento local",
    tag: "IndexedDB · OPFS",
    body: "Registros biomédicos, trazas ECG e imágenes cifradas en el dispositivo con AES-GCM 256.",
    rows: [["Cuota", "48.2 / 64 GB"], ["Persistencia", "Sin desalojo"]],
    action: "Verificar cuota",
    done: "Cuota confirmada",
    usage: 75,
  },
  {
    icon: Cpu,
    title: "Inferencia en el dispositivo (simulada)",
    tag: "WebGPU + WASM",
    body: "Triaje, diagnóstico diferencial y transcripción se ejecutan en la GPU de la consola, sin servidores terrestres.",
    rows: [["Modelo", "Simulado"], ["Latencia", "Ilustrativa"]],
    action: "Ejecutar benchmark",
    done: "18 ms · 384 MB",
  },
  {
    icon: RefreshCcw,
    title: "Sincronización diferida",
    tag: "Background Sync",
    body: "La telemetría se retiene mientras no hay enlace DSN y se replica con reintento exponencial y checksum.",
    rows: [["En cola", "4 paquetes"], ["Próxima ventana", "14m 22s"]],
    action: "Forzar envío",
    done: "Enviado al búfer DSN",
  },
];

export function OfflineDialog({ children }: { children: React.ReactNode }) {
  const [done, setDone] = React.useState<Record<string, boolean>>({});
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Arquitectura offline-first</DialogTitle>
          <DialogDescription>
            AstroVital opera de forma autónoma durante el tránsito interplanetario. Ninguna función clínica depende del enlace con la Tierra.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          {LAYERS.map((l) => {
            const Icon = l.icon;
            const isDone = done[l.title];
            return (
              <div key={l.title} className="flex flex-col rounded-lg border bg-card p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Icon className="size-4 text-primary" />
                    <span className="text-sm font-medium">{l.title}</span>
                  </div>
                  <span className="font-mono text-[10.5px] text-muted-foreground">{l.tag}</span>
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{l.body}</p>
                <dl className="mt-3 space-y-1 text-[12.5px]">
                  {l.rows.map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <dt className="text-muted-foreground">{k}</dt>
                      <dd className="font-mono tabular">{v}</dd>
                    </div>
                  ))}
                </dl>
                {l.usage != null && <Progress value={l.usage} className="mt-2" />}
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => setDone((d) => ({ ...d, [l.title]: true }))}
                >
                  {isDone ? (
                    <>
                      <Check className="text-nominal" /> {l.done}
                    </>
                  ) : (
                    l.action
                  )}
                </Button>
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/40 px-4 py-3 text-[13px]">
          <span className="text-muted-foreground">PWA instalada en modo standalone · kiosco presurizado</span>
          <span className="font-mono text-nominal">Puntuación offline 100/100</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
