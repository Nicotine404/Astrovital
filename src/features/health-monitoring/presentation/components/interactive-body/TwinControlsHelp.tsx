"use client";

import { Hand, Keyboard, Mouse, MousePointerClick, MoveDiagonal, Rotate3d, ZoomIn } from "lucide-react";
import { HelpDialog } from "@/core/presentation/shared/HelpDialog";

const CONTROLS: { icon: React.ElementType; action: string; how: string }[] = [
  { icon: MousePointerClick, action: "Seleccionar un órgano", how: "Clic sobre el órgano o hueso" },
  { icon: Mouse, action: "Rotar el cuerpo", how: "Mantén el clic izquierdo y arrastra" },
  { icon: Hand, action: "Desplazar la vista", how: "Mantén el clic derecho y arrastra" },
  { icon: ZoomIn, action: "Acercar o alejar", how: "Rueda del mouse (acerca hacia donde apunta el cursor)" },
  { icon: Keyboard, action: "Moverte por la escena", how: "W S avanzar y retroceder · A D moverte a los lados · Q E subir y bajar" },
  { icon: Rotate3d, action: "Orbitar con el teclado", how: "Flechas del teclado" },
  { icon: MoveDiagonal, action: "Moverte más rápido", how: "Mantén Shift mientras usas el teclado" },
];

/** "?" with a visual legend of the 3D viewer controls. */
export function TwinControlsHelp() {
  return (
    <HelpDialog title="Cómo usar el visor 3D" description="Explora el cuerpo y toca una zona para ver su estado." className="size-7">
      <ul className="divide-y">
        {CONTROLS.map((c) => (
          <li key={c.action} className="flex items-center gap-3 py-2.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-md border bg-muted">
              <c.icon className="size-4" />
            </span>
            <div>
              <p className="text-[13px] font-medium">{c.action}</p>
              <p className="text-[12.5px] text-muted-foreground">{c.how}</p>
            </div>
          </li>
        ))}
      </ul>
    </HelpDialog>
  );
}
