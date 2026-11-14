"use client";

import * as React from "react";
import { Satellite } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input, NativeSelect } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMission } from "@/components/providers/mission-provider";
import { useToast } from "@/components/providers/toast-provider";
import { CREW } from "@/lib/data/mock";
import type { CrewMember, Status } from "@/lib/data/types";

export function AddCrewDialog({ children }: { children: React.ReactNode }) {
  const { setCrew } = useMission();
  const toast = useToast();
  const [open, setOpen] = React.useState(false);

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const name = String(f.get("name")).trim();
    if (!name) return;
    const status = String(f.get("status")) as Status;
    const template = CREW[3];
    const member: CrewMember = {
      ...template,
      id: `crew-${Date.now()}`,
      name,
      shortName: name.split(" ").slice(-2).join(" "),
      initials: name
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .join("")
        .slice(-2)
        .toUpperCase(),
      role: String(f.get("role")),
      suitId: String(f.get("suit")),
      bloodType: String(f.get("blood")),
      status,
      healthIndex: status === "nominal" ? 99 : status === "caution" ? 92 : 71,
      note: "Enlace local acoplado",
      vitals: { ...template.vitals, heartRate: 68, spo2: 98.5, systolic: 119, diastolic: 76, radiationMSv: 0 },
    };
    setCrew((list) => [...list, member]);
    toast(`Tripulante vinculado: ${name}`);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Vincular nuevo tripulante</DialogTitle>
          <DialogDescription>El traje se empareja por UWB y la telemetría comienza a registrarse en el dispositivo.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="name">Nombre completo</Label>
            <Input id="name" name="name" required placeholder="Dr. Alex Vance" autoFocus />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="role">Rol de misión</Label>
              <Input id="role" name="role" required placeholder="Astrobiólogo" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="suit">ID de traje</Label>
              <Input id="suit" name="suit" required placeholder="SUIT-05" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="blood">Grupo sanguíneo</Label>
              <NativeSelect id="blood" name="blood" defaultValue="O+">
                {["O+", "O−", "A+", "A−", "B+", "B−", "AB+", "AB−"].map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </NativeSelect>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="status">Estado inicial</Label>
              <NativeSelect id="status" name="status" defaultValue="nominal">
                <option value="nominal">Nominal</option>
                <option value="caution">Precaución</option>
                <option value="critical">Crítico</option>
              </NativeSelect>
            </div>
          </div>
          <DialogFooter className="pt-2">
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit">
              <Satellite /> Vincular telemetría
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
