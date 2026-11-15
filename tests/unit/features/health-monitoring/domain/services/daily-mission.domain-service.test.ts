import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ClinicalRulesService } from "@/features/health-monitoring/domain/services/clinical-rules.domain-service";
import { DailyMissionService } from "@/features/health-monitoring/domain/services/daily-mission.domain-service";
import { GravityEnvironment } from "@/features/health-monitoring/domain/value-objects/gravity-environment.vo";
import { anAstronaut, TODAY } from "../../../../../support/builders";

const MARS = GravityEnvironment.from("MARTIAN");
const NOW = new Date(`${TODAY}T15:00:00.000Z`);

const missionFor = (astronaut: ReturnType<typeof anAstronaut>, history: { recordedAt: string; exerciseMinutes: number }[] = []) => {
  const evaluation = new ClinicalRulesService().evaluate(astronaut, MARS, 0.5);
  return new DailyMissionService().build(astronaut, evaluation, NOW, history);
};

describe("DailyMissionService", () => {
  it("points to the next routine block that is still pending", () => {
    // Arrange
    const astronaut = anAstronaut({ exerciseMinutesToday: 50 });

    // Act
    const mission = missionFor(astronaut);

    // Assert
    const routine = mission.reminders.find((r) => r.id === "routine");
    assert.ok(routine?.message.startsWith("Te toca: Carrera en el hábitat"));
  });

  it("puts an overdue vitals reminder first when the last measurement is over six hours old", () => {
    // Arrange
    const astronaut = anAstronaut({ vitalsAt: `${TODAY}T07:00:00.000Z` });

    // Act
    const mission = missionFor(astronaut);

    // Assert
    assert.equal(mission.reminders[0].id, "vitals");
    assert.equal(mission.reminders[0].urgency, "now");
  });

  it("counts the routine streak from past days and adds today once complete", () => {
    // Arrange
    const history = [12, 13, 14].map((d) => ({ recordedAt: `2026-11-${d}T20:00:00.000Z`, exerciseMinutes: 100 }));
    const doneToday = anAstronaut({ exerciseMinutesToday: 90 });
    const pendingToday = anAstronaut({ exerciseMinutesToday: 30 });

    // Act
    const withToday = missionFor(doneToday, history).routineStreakDays;
    const withoutToday = missionFor(pendingToday, history).routineStreakDays;

    // Assert
    assert.equal(withToday, 4);
    assert.equal(withoutToday, 3);
  });

  it("awards 20 XP per completed task", () => {
    // Arrange
    const astronaut = anAstronaut({ exerciseMinutesToday: 90 });

    // Act
    const mission = missionFor(astronaut);

    // Assert
    assert.equal(mission.xp, mission.completed * 20);
  });
});
