"use client";

import * as React from "react";
import { Loader2, Satellite } from "lucide-react";
import { Button } from "@/core/presentation/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/core/presentation/ui/dialog";
import { Input, NativeSelect } from "@/core/presentation/ui/input";
import { Label } from "@/core/presentation/ui/label";
import { RegisterAstronautSchema, type RegisterAstronautDto } from "../../../application/dto/record-measurement.dto";

const BLOOD = ["O+", "O−", "A+", "A−", "B+", "B−", "AB+", "AB−"] as const;

/** Pure form: validates with the shared Zod schema, then hands the DTO to `onSubmit`. */
export function AddCrewDialog({
  children,
  pending,
  onSubmit,
}: {
  children: React.ReactNode;
  pending: boolean;
  onSubmit: (dto: RegisterAstronautDto) => Promise<{ ok: boolean; fieldErrors?: Record<string, string[]> }>;
}) {
  const [open, setOpen] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string[] | undefined>>({});

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const parsed = RegisterAstronautSchema.safeParse({
      name: f.get("name"),
      role: f.get("role"),
      suitId: f.get("suitId"),
      bloodType: f.get("bloodType"),
      heightCm: Number(f.get("heightCm")),
    });
    if (!parsed.success) {
      setErrors(parsed.error.flatten().fieldErrors);
      return;
    }
    setErrors({});
    const res = await onSubmit(parsed.data);
    if (res.ok) setOpen(false);
    else setErrors(res.fieldErrors ?? {});
  };

  const err = (k: keyof RegisterAstronautDto) =>
    errors[k]?.[0] ? (
      <p id={`${k}-error`} className="text-[12px] text-critical">
        {errors[k]![0]}
      </p>
    ) : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Vincular nuevo tripulante</DialogTitle>
          <DialogDescription>El traje se empareja por UWB y la telemetría basal comienza a registrarse en el dispositivo.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4" noValidate>
          <div className="grid gap-1.5">
            <Label htmlFor="name">Nombre completo</Label>
            <Input id="name" name="name" placeholder="Dr. Alex Vance" autoFocus aria-invalid={!!errors.name} aria-describedby="name-error" />
            {err("name")}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="role">Rol de misión</Label>
              <Input id="role" name="role" placeholder="Astrobiólogo" aria-invalid={!!errors.role} />
              {err("role")}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="suitId">ID de traje</Label>
              <Input id="suitId" name="suitId" placeholder="SUIT-05" aria-invalid={!!errors.suitId} />
              {err("suitId")}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="bloodType">Grupo sanguíneo</Label>
              <NativeSelect id="bloodType" name="bloodType" defaultValue="O+">
                {BLOOD.map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </NativeSelect>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="heightCm">Altura (cm)</Label>
              <Input id="heightCm" name="heightCm" type="number" inputMode="numeric" defaultValue={175} min={140} max={210} aria-invalid={!!errors.heightCm} />
              {err("heightCm")}
            </div>
          </div>
          <DialogFooter className="pt-2">
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : <Satellite />} Vincular telemetría
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
