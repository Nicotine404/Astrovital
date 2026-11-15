import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ClinicalRulesService } from "@/features/health-monitoring/domain/services/clinical-rules.domain-service";
import { GravityEnvironment } from "@/features/health-monitoring/domain/value-objects/gravity-environment.vo";
import { Habitat } from "@/features/health-monitoring/domain/value-objects/habitat.vo";
import { aCheckin, aDosimetry, aMusculoskeletal, aVitals, TODAY } from "../../../../../support/builders";

const ZERO_G = GravityEnvironment.from("ZERO_G");
const MARS = GravityEnvironment.from("MARTIAN");
const EARTH = GravityEnvironment.from("EARTH");

describe("ClinicalRulesService · thresholds by gravity (CU-04)", () => {
  it("flags a systolic of 135 mmHg in 0 g but not on Earth", () => {
    // Arrange
    const rules = new ClinicalRulesService();
    const vitals = aVitals({ systolic: 135 });

    // Act
    const inOrbit = rules.evaluateVitals(vitals, ZERO_G).bloodPressure;
    const onEarth = rules.evaluateVitals(vitals, EARTH).bloodPressure;

    // Assert
    assert.equal(inOrbit, "WARNING");
    assert.equal(onEarth, "NOMINAL");
  });

  it("marks 153 mmHg critical in 0 g and only a warning on Earth", () => {
    // Arrange
    const rules = new ClinicalRulesService();
    const vitals = aVitals({ systolic: 153 });

    // Act
    const inOrbit = rules.evaluateVitals(vitals, ZERO_G).bloodPressure;
    const onEarth = rules.evaluateVitals(vitals, EARTH).bloodPressure;

    // Assert
    assert.equal(inOrbit, "CRITICAL");
    assert.equal(onEarth, "WARNING");
  });

  it("derives the daily exercise target from each gravity's routine", () => {
    // Arrange
    const rules = new ClinicalRulesService();

    // Act
    const targets = [ZERO_G, GravityEnvironment.from("LUNAR"), MARS, EARTH].map((g) => rules.thresholdsFor(g).exerciseTargetMinutes);

    // Assert
    assert.deepEqual(targets, [150, 120, 90, 60]);
  });

  it("replaces the resistance machine with bands in a rover, keeping the minutes", () => {
    // Arrange
    const rules = new ClinicalRulesService();

    // Act
    const rover = rules.countermeasuresFor(MARS, Habitat.from("MARS_ROVER"));
    const base = rules.countermeasuresFor(MARS, Habitat.from("MARS_BASE"));

    // Assert
    assert.equal(rover[0].label, "Bandas elásticas y peso corporal");
    assert.equal(base[0].label, "Resistencia con carga");
    assert.equal(rover.reduce((n, r) => n + r.minutes, 0), 90);
  });
});

describe("ClinicalRulesService · symptoms (CU-05)", () => {
  it("escalates moderate blurred vision to critical when the fluid shift is off", () => {
    // Arrange
    const rules = new ClinicalRulesService();
    const normalShift = aMusculoskeletal({ visionSymptom: 2 });
    const abnormalShift = aMusculoskeletal({ visionSymptom: 2, cephalicFluidShiftMmHg: 30 });

    // Act
    const withNormalShift = rules.evaluateMusculoskeletal(normalShift, MARS, 0.5).vision;
    const withAbnormalShift = rules.evaluateMusculoskeletal(abnormalShift, MARS, 0.5).vision;

    // Assert
    assert.equal(withNormalShift, "WARNING");
    assert.equal(withAbnormalShift, "CRITICAL");
  });

  it("treats mild dizziness as expected adaptation and severe dizziness as critical", () => {
    // Arrange
    const rules = new ClinicalRulesService();

    // Act
    const mild = rules.evaluateMusculoskeletal(aMusculoskeletal({ dizzinessSymptom: 1 }), MARS, 0.5).dizziness;
    const severe = rules.evaluateMusculoskeletal(aMusculoskeletal({ dizzinessSymptom: 3 }), MARS, 0.5).dizziness;

    // Assert
    assert.equal(mild, "NOMINAL");
    assert.equal(severe, "CRITICAL");
  });
});

describe("ClinicalRulesService · radiation (CU-03)", () => {
  it("requires shelter and an immune check during a strong solar event", () => {
    // Arrange
    const rules = new ClinicalRulesService();
    const dosimetry = aDosimetry({ doseRateMsvDay: 6.4, neutronFlux: 9.2 });

    // Act
    const ev = rules.evaluateRadiation(dosimetry);

    // Assert
    assert.equal(ev.shelterRequired, true);
    assert.equal(ev.immuneCheckRequired, true);
  });

  it("asks for an immune check near the career limit even without an event", () => {
    // Arrange
    const rules = new ClinicalRulesService();
    const dosimetry = aDosimetry({ doseRateMsvDay: 0.4, neutronFlux: 0.9, source: "GCR" }, 500);

    // Act
    const ev = rules.evaluateRadiation(dosimetry);

    // Assert
    assert.equal(ev.shelterRequired, false);
    assert.equal(ev.immuneCheckRequired, true);
  });

  it("gives a rover less protection than a base", () => {
    // Arrange
    const external = 6.4;

    // Act
    const inBase = Habitat.from("MARS_BASE").shield(external);
    const inRover = Habitat.from("MARS_ROVER").shield(external);

    // Assert
    assert.equal(inBase, 1.92);
    assert.ok(inRover > inBase);
  });
});

describe("ClinicalRulesService · mental trend (CU-06)", () => {
  it("flags three short nights in a row as a warning and five as critical", () => {
    // Arrange
    const rules = new ClinicalRulesService();
    const threeNights = [aCheckin(1, 7, 7), aCheckin(2, 5, 7), aCheckin(3, 5, 7), aCheckin(4, 5, 7)];
    const fiveNights = [1, 2, 3, 4, 5].map((d) => aCheckin(d, 5, 7));

    // Act
    const three = rules.evaluateMental(threeNights).trend;
    const five = rules.evaluateMental(fiveNights).trend;

    // Assert
    assert.equal(three, "WARNING");
    assert.equal(five, "CRITICAL");
  });

  it("counts only the last check-in of each day", () => {
    // Arrange
    const rules = new ClinicalRulesService();
    const earlyBadNight = { ...aCheckin(3, 5, 7), recordedAt: "2026-11-03T07:00:00.000Z" };
    const history = [aCheckin(1, 5, 7), aCheckin(2, 5, 7), earlyBadNight, aCheckin(3, 8, 7)];

    // Act
    const ev = rules.evaluateMental(history);

    // Assert
    assert.equal(ev.poorSleepDays, 0);
  });
});

describe("ClinicalRulesService · nutrition (CU-07)", () => {
  it("judges protein and water against the pace of the day", () => {
    // Arrange
    const rules = new ClinicalRulesService();
    const halfDayLog = { date: TODAY, caloriesKcal: 1250, waterMl: 1250, calciumMg: 500, vitaminDIu: 400, proteinG: 10 };

    // Act
    const ev = rules.evaluateNutrition(halfDayLog, 0.5);

    // Assert
    assert.equal(ev.statuses.proteinG, "CRITICAL");
    assert.equal(ev.statuses.waterMl, "NOMINAL");
  });
});
