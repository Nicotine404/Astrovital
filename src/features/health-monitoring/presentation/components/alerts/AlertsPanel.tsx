"use client";

import { Satellite, User, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/presentation/ui/card";
import { StatusBadge } from "@/core/presentation/shared/StatusBadge";
import { HelpDialog, HelpSection } from "@/core/presentation/shared/HelpDialog";
import { STATUS_META } from "@/core/presentation/shared/status-meta";
import { cn } from "@/core/utils/cn";
import type { ClinicalAlert, Escalation } from "../../../domain/services/clinical-rules.domain-service";

const ESCALATION: Record<Escalation, { icon: React.ElementType; label: string }> = {
  SELF: { icon: User, label: "Tú mismo" },
  CREW: { icon: Users, label: "Con un compañero" },
  GROUND: { icon: Satellite, label: "Avisa a Tierra" },
};

/** "14m 22s"-style round trip for a one-way delay in seconds. */
function roundTrip(oneWaySeconds: number): string {
  const s = Math.round(oneWaySeconds * 2);
  if (s < 60) return `${s} s`;
  return `${Math.floor(s / 60)} min`;
}

/**
 * Active alerts with who has to act: the astronaut, a crewmate or the flight surgeons on Earth
 * (with the round-trip delay of the current place). Pure: data arrives as props.
 */
export function AlertsPanel({ alerts, commDelaySeconds, className }: { alerts: ClinicalAlert[]; commDelaySeconds: number; className?: string }) {
  return (
    <Card className={className}>
      <CardHeader className="border-b">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-1.5">
            Alertas y quién actúa
            <HelpDialog title="¿Quién tiene que actuar?" description="Cada alerta indica a quién le toca resolverla.">
              <HelpSection icon={User} heading="Tú mismo">
                Precaución: puedes resolverlo solo siguiendo la indicación (beber agua, repetir la medición, completar la rutina).
              </HelpSection>
              <HelpSection icon={Users} heading="Con un compañero">
                Crítico que se resuelve a bordo: pide a un compañero que confirme la medición o te ayude (por ejemplo, ir al refugio o sacar una muestra de sangre).
              </HelpSection>
              <HelpSection icon={Satellite} heading="Avisa a Tierra">
                Crítico que necesita criterio médico: envía el reporte a los médicos de vuelo. La respuesta tarda al menos el retardo de ida y vuelta de tu ubicación.
              </HelpSection>
            </HelpDialog>
          </CardTitle>
          <p className="text-[13px] text-muted-foreground">{alerts.length ? `${alerts.length} activas · ordenadas por gravedad` : "Sin alertas activas"}</p>
        </div>
      </CardHeader>
      <CardContent className="pt-3">
        {alerts.length === 0 ? (
          <p className="py-6 text-center text-[13px] text-muted-foreground">Todo en rango. Sigue con tu misión del día.</p>
        ) : (
          <ul className="divide-y">
            {alerts.map((a, i) => {
              const esc = ESCALATION[a.escalation];
              const meta = STATUS_META[a.severity];
              return (
                <li key={`${a.zone}-${i}`} className="flex items-start gap-3 py-2.5">
                  <StatusBadge status={a.severity} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] leading-snug">{a.message}</p>
                    <p className={cn("mt-1 flex items-center gap-1.5 text-[11.5px]", a.escalation === "SELF" ? "text-muted-foreground" : meta.text)}>
                      <esc.icon className="size-3.5" />
                      {esc.label}
                      {a.escalation === "GROUND" && <span className="text-muted-foreground">· respuesta en ≥ {roundTrip(commDelaySeconds)}</span>}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
