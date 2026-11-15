"use client";

import type { DashboardSummaryDto } from "../../application/dto/dashboard-summary.dto";
import { CrewSwitcher } from "../components/crew/CrewSwitcher";
import { MentalWellbeingCard } from "../components/mental-health/MentalWellbeingCard";
import { BoneFluidsCard } from "../components/musculoskeletal/BoneFluidsCard";
import { NutritionGoalsCard } from "../components/nutrition/NutritionGoalsCard";
import { useNutritionController } from "../controllers/useNutritionController";
import { usePhysicalController } from "../controllers/usePhysicalController";
import { useTelemetryController } from "../controllers/useTelemetryController";
import { useWellbeingController } from "../controllers/useWellbeingController";

/** RF-04 / RF-05 / RF-06 for the selected astronaut. */
export function WellbeingView({ summary }: { summary: DashboardSummaryDto }) {
  const t = useTelemetryController(summary);
  const member = t.selected;
  const id = member.astronaut.id;
  const wellbeing = useWellbeingController(id, member.mental.history);
  const nutrition = useNutritionController(id, member.nutrition.log);
  const physical = usePhysicalController(id);

  return (
    <div className="space-y-4">
      <CrewSwitcher crew={t.crew} selectedId={id} onSelect={t.selectAstronaut} className="w-fit" />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <BoneFluidsCard
          key={id}
          member={member}
          thresholds={t.thresholds}
          environment={t.environment}
          pending={physical.isPending}
          onLogExercise={physical.logExercise}
          onReportSymptoms={physical.reportSymptoms}
        />
        <NutritionGoalsCard log={nutrition.log} targets={member.nutrition.targets} evaluation={member.nutrition.evaluation} pending={nutrition.isPending} onAddIntake={nutrition.addIntake} />
      </div>
      {/* keyed so the form resets to the new astronaut's last check-in */}
      <MentalWellbeingCard key={id} history={wellbeing.history} evaluation={member.mental.evaluation} pending={wellbeing.isPending} onSubmit={wellbeing.submit} />
    </div>
  );
}
