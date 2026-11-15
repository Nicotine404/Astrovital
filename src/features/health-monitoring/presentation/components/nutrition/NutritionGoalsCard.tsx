"use client";

import { Coffee, Droplet, Drumstick, Loader2, Pill, Utensils } from "lucide-react";
import { Button } from "@/core/presentation/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/presentation/ui/card";
import { StatusBadge } from "@/core/presentation/shared/StatusBadge";
import { STATUS_META } from "@/core/presentation/shared/status-meta";
import { cn } from "@/core/utils/cn";
import type { NutritionIntake, NutritionLog } from "../../../domain/models/nutrition-log.model";
import type { NUTRITION_TARGETS, NutritionEvaluation } from "../../../domain/services/clinical-rules.domain-service";

type Key = keyof typeof NUTRITION_TARGETS;
const ROWS: { key: Key; label: string; unit: string }[] = [
  { key: "caloriesKcal", label: "Energía", unit: "kcal" },
  { key: "waterMl", label: "Agua", unit: "mL" },
  { key: "calciumMg", label: "Calcio", unit: "mg" },
  { key: "vitaminDIu", label: "Vitamina D", unit: "UI" },
  { key: "proteinG", label: "Proteínas", unit: "g" },
];

/** Quick-log presets from the habitat's food system. */
const PRESETS: { label: string; icon: React.ElementType; intake: NutritionIntake }[] = [
  { label: "Ración principal", icon: Utensils, intake: { caloriesKcal: 650, waterMl: 150, calciumMg: 220, vitaminDIu: 80, proteinG: 30 } },
  { label: "Agua 500 mL", icon: Droplet, intake: { waterMl: 500 } },
  { label: "Bebida láctea", icon: Coffee, intake: { caloriesKcal: 180, waterMl: 250, calciumMg: 300, vitaminDIu: 100, proteinG: 9 } },
  { label: "Suplemento Ca + D", icon: Pill, intake: { calciumMg: 500, vitaminDIu: 800 } },
  { label: "Barra proteica", icon: Drumstick, intake: { caloriesKcal: 220, proteinG: 20 } },
];

/** RF-06. Pure: log (optimistic), targets, evaluation and the add handler arrive as props. */
export function NutritionGoalsCard({
  log,
  targets,
  evaluation,
  pending,
  onAddIntake,
}: {
  log: NutritionLog;
  targets: typeof NUTRITION_TARGETS;
  evaluation: NutritionEvaluation;
  pending: boolean;
  onAddIntake: (intake: NutritionIntake, label: string) => void;
}) {
  return (
    <Card>
      <CardHeader className="border-b">
        <div className="space-y-1">
          <CardTitle>Nutrición diaria</CardTitle>
          <p className="text-[13px] text-muted-foreground">Objetivos de vuelo · la evaluación tiene en cuenta la hora del día</p>
        </div>
        <StatusBadge status={evaluation.overall} />
      </CardHeader>
      <CardContent className="space-y-5 pt-5">
        <ul className="space-y-4">
          {ROWS.map((r) => {
            const value = log[r.key];
            const pct = Math.min(100, (value / targets[r.key]) * 100);
            const st = evaluation.statuses[r.key];
            return (
              <li key={r.key}>
                <div className="mb-1.5 flex items-baseline justify-between text-[13px]">
                  <span>{r.label}</span>
                  <span className="font-mono tabular">
                    {Math.round(value).toLocaleString("es-ES")}
                    <span className="text-muted-foreground">
                      {" "}
                      / {targets[r.key].toLocaleString("es-ES")} {r.unit}
                    </span>
                  </span>
                </div>
                <div className="relative h-2 overflow-hidden rounded-full bg-secondary" role="meter" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label={`${r.label} ${Math.round(pct)} % del objetivo`}>
                  <div className={cn("h-full rounded-full transition-[width] duration-500", st === "NOMINAL" ? "bg-primary" : STATUS_META[st].bg)} style={{ width: `${pct}%` }} />
                </div>
              </li>
            );
          })}
        </ul>

        {evaluation.alerts.length > 0 && (
          <ul className="space-y-1.5 rounded-md border border-caution/30 bg-caution/5 px-3 py-2.5 text-[12.5px] text-caution">
            {evaluation.alerts.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        )}

        <div>
          <p className="eyebrow mb-2">Registro rápido</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {PRESETS.map((p) => (
              <Button key={p.label} variant="outline" size="sm" className="justify-start" disabled={pending} onClick={() => onAddIntake(p.intake, p.label)}>
                {pending ? <Loader2 className="animate-spin" /> : <p.icon />} {p.label}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
