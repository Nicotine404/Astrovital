"use client";

import { toast } from "sonner";
import type { DashboardSummaryDto } from "../../application/dto/dashboard-summary.dto";
import { AlertsPanel } from "../components/alerts/AlertsPanel";
import { CrewSummary } from "../components/crew/CrewSummary";
import { DailyMissionCard } from "../components/mission/DailyMissionCard";
import { InteractiveBodyMap } from "../components/interactive-body/InteractiveBodyMap";
import { CansRadiationWidget } from "../components/radiation-cans/CansRadiationWidget";
import { BoneFluidsCard } from "../components/musculoskeletal/BoneFluidsCard";
import { RecordVitalsDialog } from "../components/vitals/RecordVitalsDialog";
import { VitalsStrip } from "../components/vitals/VitalsStrip";
import { useAnatomyModelController } from "../controllers/useAnatomyModelController";
import { useHealthSessionStore } from "../controllers/useHealthSession.store";
import { useLiveVitalsController } from "../controllers/useLiveVitalsController";
import { useRadiationController } from "../controllers/useRadiationController";
import { useRecordVitalsController } from "../controllers/useRecordVitalsController";
import { useRemindersController } from "../controllers/useRemindersController";
import { useTelemetryController } from "../controllers/useTelemetryController";

/** Overview: crew, RF-01 body map with zones, live vitals, RF-02 radiation and RF-04 summary. */
export function MissionOverviewView({ summary }: { summary: DashboardSummaryDto }) {
  const t = useTelemetryController(summary);
  const anatomy = useAnatomyModelController();
  const radiation = useRadiationController();
  const session = useHealthSessionStore();
  const member = t.selected;
  const live = useLiveVitalsController(member.astronaut.id, member.vitals);
  const recordVitals = useRecordVitalsController(member.astronaut.id);
  const reminders = useRemindersController(member.astronaut.id, member.mission.reminders);

  return (
    <div className="space-y-6">
      <CrewSummary crew={t.crew} selectedId={member.astronaut.id} onSelect={t.selectAstronaut} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <AlertsPanel alerts={member.alerts} commDelaySeconds={summary.habitat.gravity.commDelaySeconds} />
        <DailyMissionCard mission={member.mission} crewCompleted={summary.crewMissionsCompleted} crewSize={summary.crew.length} onShowReminder={reminders.showNext} />
      </div>

      <div id="digital-twin" className="scroll-mt-20">
        <InteractiveBodyMap
          anatomy={{ ...anatomy, onRetry: anatomy.retry }}
          crew={t.crew}
          member={member}
          onSelectAstronaut={t.selectAstronaut}
          environment={t.environment}
          statuses={t.statuses}
          selected={t.structure}
          assessment={t.assessment}
          onSelectStructure={(id) => t.selectStructure(id)}
          activeZone={session.activeZone}
          onZoneChange={session.setActiveZone}
          onOpenTrends={session.openTrends}
          onAssessmentAction={(a) => toast.success(`${a.recommendedAction}`, { description: `Protocolo iniciado para ${member.astronaut.shortName}.` })}
          twin={{ focused: session.focused, autoRotate: session.autoRotate, layers: session.layers, view: session.view }}
          onToggleFocus={() => session.setFocused(!session.focused)}
          onToggleAutoRotate={() => session.setAutoRotate(!session.autoRotate)}
          onToggleLayer={session.toggleLayer}
          onView={session.goToView}
          onUserInteract={() => session.autoRotate && session.setAutoRotate(false)}
        />
      </div>

      <VitalsStrip
        latest={live.latest}
        series={live.series}
        evaluation={member.vitalsEvaluation}
        thresholds={t.thresholds}
        source={live.source}
        onOpenTrends={session.openTrends}
        action={<RecordVitalsDialog key={member.astronaut.id} defaults={member.vitals} pending={recordVitals.isPending} onSubmit={recordVitals.submit} />}
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <CansRadiationWidget member={member} shelter={summary.habitat.shelter} pending={radiation.isPending} onSimulateSolarEvent={radiation.simulateSolarEvent} compact />
        <BoneFluidsCard member={member} thresholds={t.thresholds} environment={t.environment} />
      </div>
    </div>
  );
}
