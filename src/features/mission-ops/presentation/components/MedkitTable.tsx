import { Lock, PackageCheck, PackageX } from "lucide-react";
import { Card } from "@/core/presentation/ui/card";
import { Badge } from "@/core/presentation/ui/badge";
import { StatusBadge } from "@/core/presentation/shared/StatusBadge";
import type { MedkitInventoryDto } from "../../application/dto/mission-ops.dto";

/** Medical supply inventory with restock status. Pure, server-renderable. */
export function MedkitTable({ inventory }: { inventory: MedkitInventoryDto }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border bg-card p-4">
            <p className="flex items-center gap-1.5 text-[12.5px] text-muted-foreground"><PackageCheck className="size-3.5" /> Artículos</p>
            <p className="mt-2 font-mono text-[24px] font-medium tabular">{inventory.items.length}</p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <p className="flex items-center gap-1.5 text-[12.5px] text-muted-foreground"><PackageX className="size-3.5" /> Reposición sugerida</p>
            <p className="mt-2 font-mono text-[24px] font-medium tabular">{inventory.restockCount}</p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <p className="flex items-center gap-1.5 text-[12.5px] text-muted-foreground"><Lock className="size-3.5" /> Cerradura</p>
            <p className="mt-2 text-[17px] font-medium">Biométrica + UWB</p>
          </div>
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[760px] text-left text-[13px]">
              <thead className="border-b bg-muted/30 text-[12px] text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Casillero</th>
                  <th className="px-5 py-3 font-medium">Artículo</th>
                  <th className="px-5 py-3 font-medium">Categoría</th>
                  <th className="px-5 py-3 font-medium w-[220px]">Existencias</th>
                  <th className="px-5 py-3 font-medium">Caducidad</th>
                  <th className="px-5 py-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {inventory.items.map((m) => {
                  const st = m.status;
                  const pct = m.fillPct;
                  return (
                    <tr key={m.id} className="transition-colors hover:bg-accent/30">
                      <td className="px-5 py-3.5 font-mono text-muted-foreground">{m.locker}</td>
                      <td className="px-5 py-3.5">
                        <p className="font-medium">{m.name}</p>
                        {m.note && <p className="text-[12px] text-muted-foreground">{m.note}</p>}
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant="secondary">{m.category}</Badge>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                            <div className={`h-full rounded-full ${st === "NOMINAL" ? "bg-primary" : st === "WARNING" ? "bg-caution" : "bg-critical"}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="w-24 text-right font-mono text-[12.5px] tabular">
                            {m.stock}/{m.capacity} <span className="text-muted-foreground">{m.unit}</span>
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[12.5px] text-muted-foreground">{m.expires}</td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={st} label={st === "NOMINAL" ? "Suficiente" : st === "WARNING" ? "Bajo" : "Agotándose"} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
    </div>
  );
}
