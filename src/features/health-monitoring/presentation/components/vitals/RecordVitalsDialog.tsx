"use client";

import * as React from "react";
import { ClipboardPlus, Loader2 } from "lucide-react";
import { Button } from "@/core/presentation/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/core/presentation/ui/dialog";
import { Input } from "@/core/presentation/ui/input";
import { Label } from "@/core/presentation/ui/label";
import type { VitalSigns } from "../../../domain/models/vital-signs.model";
import { RecordVitalSignsSchema, type RecordVitalSignsDto } from "../../../application/dto/record-measurement.dto";

type Field = Exclude<keyof VitalSigns, "recordedAt">;

/** Each field says how to take the measurement on board: astronauts are not clinicians. */
const FIELDS: { key: Field; label: string; unit: string; step: number; howTo: string }[] = [
  { key: "heartRate", label: "Frecuencia cardíaca", unit: "lpm", step: 1, howTo: "En reposo 5 min; pulso radial 30 s × 2 o lectura del parche ECG." },
  { key: "systolic", label: "Sistólica", unit: "mmHg", step: 1, howTo: "Manguito en el brazo izquierdo a la altura del corazón, sujeto al asiento." },
  { key: "diastolic", label: "Diastólica", unit: "mmHg", step: 1, howTo: "Misma lectura del manguito; no hables durante la medición." },
  { key: "spo2", label: "Saturación O₂", unit: "%", step: 0.1, howTo: "Pulsioxímetro en el dedo índice, mano quieta y caliente." },
  { key: "respiratoryRate", label: "Frecuencia respiratoria", unit: "rpm", step: 1, howTo: "Cuenta respiraciones durante 60 s sin cambiar tu ritmo." },
  { key: "coreTemperature", label: "Temperatura", unit: "°C", step: 0.1, howTo: "Termómetro timpánico; espera 15 min tras ejercicio o comida." },
  { key: "glucose", label: "Glucosa", unit: "mg/dL", step: 1, howTo: "Glucómetro capilar; anota si estás en ayunas o tras comer." },
  { key: "cardiacOutput", label: "Gasto cardíaco", unit: "L/min", step: 0.1, howTo: "Lectura del chaleco de bioimpedancia, en reposo." },
  { key: "intracranialPressure", label: "Presión intracraneal", unit: "mmHg", step: 0.1, howTo: "Estimación no invasiva del sensor ocular (ultrasonido del nervio óptico)." },
];

/** CU-02 manual entry. Pure form: validates with the shared Zod schema, then hands the values to `onSubmit`. */
export function RecordVitalsDialog({
  defaults,
  pending,
  onSubmit,
}: {
  defaults: VitalSigns;
  pending: boolean;
  onSubmit: (form: Omit<RecordVitalSignsDto, "astronautId">) => Promise<{ ok: boolean; fieldErrors?: Record<string, string[]> }>;
}) {
  const [open, setOpen] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string[] | undefined>>({});

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const values = Object.fromEntries(FIELDS.map(({ key }) => [key, Number(f.get(key))]));
    const parsed = RecordVitalSignsSchema.omit({ astronautId: true }).safeParse(values);
    if (!parsed.success) {
      setErrors(parsed.error.flatten().fieldErrors);
      return;
    }
    if (parsed.data.diastolic >= parsed.data.systolic) {
      setErrors({ diastolic: ["Debe ser menor que la sistólica"] });
      return;
    }
    setErrors({});
    const res = await onSubmit(parsed.data);
    if (res.ok) setOpen(false);
    else setErrors(res.fieldErrors ?? {});
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <ClipboardPlus /> Registrar medición
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Registrar signos vitales</DialogTitle>
          <DialogDescription>Usa los valores de tu instrumental. Cada campo explica cómo tomar la medición; se evalúan con los umbrales del entorno gravitacional actual.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            {FIELDS.map((fd) => (
              <div key={fd.key} className="grid gap-1.5">
                <Label htmlFor={`vital-${fd.key}`}>
                  {fd.label} <span className="font-normal text-muted-foreground">({fd.unit})</span>
                </Label>
                <Input
                  id={`vital-${fd.key}`}
                  name={fd.key}
                  type="number"
                  inputMode="decimal"
                  step={fd.step}
                  defaultValue={defaults[fd.key]}
                  aria-invalid={!!errors[fd.key]}
                  aria-describedby={`vital-${fd.key}-hint`}
                />
                <p id={`vital-${fd.key}-hint`} className={errors[fd.key] ? "text-[11.5px] text-critical" : "text-[11.5px] text-muted-foreground"}>
                  {errors[fd.key]?.[0] ?? fd.howTo}
                </p>
              </div>
            ))}
          </div>
          <DialogFooter className="pt-2">
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : <ClipboardPlus />} Guardar medición
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
