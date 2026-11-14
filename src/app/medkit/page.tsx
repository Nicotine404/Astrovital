import type { Metadata } from "next";
import { Lock, PackageCheck, PackageX } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MEDKIT } from "@/lib/data/mock";
import type { Status } from "@/lib/data/types";

export const metadata: Metadata = { title: "Botiquín" };

function stockStatus(stock: number, capacity: number): Status {
  const r = stock / capacity;
  return r < 0.15 ? "critical" : r < 0.35 ? "caution" : "nominal";
}

export default function MedkitPage() {
  const low = MEDKIT.filter((m) => stockStatus(m.stock, m.capacity) !== "nominal");
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Dispensario A-2 · en línea"
        title="Botiquín y dispensario EVA"
        description="Inventario de suministros médicos con liberación autorizada por UWB. Los consumos se registran automáticamente en el historial del tripulante."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4">
          <p className="flex items-center gap-1.5 text-[12.5px] text-muted-foreground"><PackageCheck className="size-3.5" /> Artículos</p>
          <p className="mt-2 font-mono text-[24px] font-medium tabular">{MEDKIT.length}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="flex items-center gap-1.5 text-[12.5px] text-muted-foreground"><PackageX className="size-3.5" /> Reposición sugerida</p>
          <p className="mt-2 font-mono text-[24px] font-medium tabular">{low.length}</p>
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
              {MEDKIT.map((m) => {
                const st = stockStatus(m.stock, m.capacity);
                const pct = Math.round((m.stock / m.capacity) * 100);
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
                          <div className={`h-full rounded-full ${st === "nominal" ? "bg-primary" : st === "caution" ? "bg-caution" : "bg-critical"}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-24 text-right font-mono text-[12.5px] tabular">
                          {m.stock}/{m.capacity} <span className="text-muted-foreground">{m.unit}</span>
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[12.5px] text-muted-foreground">{m.expires}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={st} label={st === "nominal" ? "Suficiente" : st === "caution" ? "Bajo" : "Agotándose"} />
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
