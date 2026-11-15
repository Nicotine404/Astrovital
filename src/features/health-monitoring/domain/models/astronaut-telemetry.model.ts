import { DomainError } from "../errors/domain.error";
import type { AnatomicalStructureId } from "../value-objects/anatomical-structure.vo";
import type { MentalCheckin } from "./mental-health.model";
import { addExercise, reportSymptoms, type Musculoskeletal } from "./musculoskeletal.model";
import { addIntake, emptyNutritionLog, type NutritionIntake, type NutritionLog } from "./nutrition-log.model";
import type { OrganAssessment } from "./organ-assessment.model";
import { accumulateExposure, type RadiationDosimetry, type RadiationReading } from "./radiation-dosimetry.model";
import type { VitalSigns } from "./vital-signs.model";

export interface Astronaut {
  id: string;
  name: string;
  shortName: string;
  initials: string;
  role: string;
  suitId: string;
  bloodType: string;
  heightCm: number;
  note: string;
}

export interface AstronautTelemetryProps {
  astronaut: Astronaut;
  vitals: VitalSigns;
  assessments: OrganAssessment[];
  radiation: RadiationDosimetry;
  musculoskeletal: Musculoskeletal;
  mentalCheckins: MentalCheckin[];
  nutrition: NutritionLog;
}

const MAX_CHECKINS = 30;

/**
 * Aggregate root: the complete biomedical state of one crew member.
 * All mutations go through methods that keep invariants; persistence uses toSnapshot().
 */
export class AstronautTelemetry {
  private constructor(private props: AstronautTelemetryProps) {}

  static create(props: AstronautTelemetryProps): AstronautTelemetry {
    if (!props.astronaut.id) throw new DomainError("El tripulante necesita un identificador", "INVALID_ASTRONAUT");
    if (!props.astronaut.name.trim()) throw new DomainError("El tripulante necesita un nombre", "INVALID_ASTRONAUT");
    if (props.astronaut.heightCm < 120 || props.astronaut.heightCm > 230) {
      throw new DomainError("Altura fuera de rango", "INVALID_ASTRONAUT");
    }
    return new AstronautTelemetry(structuredClone(props));
  }

  get id() {
    return this.props.astronaut.id;
  }
  get astronaut(): Readonly<Astronaut> {
    return this.props.astronaut;
  }
  get vitals(): Readonly<VitalSigns> {
    return this.props.vitals;
  }
  get assessments(): readonly OrganAssessment[] {
    return this.props.assessments;
  }
  get radiation(): Readonly<RadiationDosimetry> {
    return this.props.radiation;
  }
  get musculoskeletal(): Readonly<Musculoskeletal> {
    return this.props.musculoskeletal;
  }
  get mentalCheckins(): readonly MentalCheckin[] {
    return this.props.mentalCheckins;
  }
  get latestCheckin(): MentalCheckin | undefined {
    return this.props.mentalCheckins[this.props.mentalCheckins.length - 1];
  }
  get nutrition(): Readonly<NutritionLog> {
    return this.props.nutrition;
  }

  assessment(id: AnatomicalStructureId): OrganAssessment | undefined {
    return this.props.assessments.find((a) => a.structureId === id);
  }

  recordVitals(vitals: VitalSigns): void {
    this.props.vitals = vitals;
  }

  logRadiation(reading: RadiationReading): void {
    this.props.radiation = accumulateExposure(this.props.radiation, reading);
  }

  logMentalCheckin(checkin: MentalCheckin): void {
    this.props.mentalCheckins = [...this.props.mentalCheckins, checkin].slice(-MAX_CHECKINS);
  }

  logNutrition(intake: NutritionIntake, today: string): void {
    const base = this.props.nutrition.date === today ? this.props.nutrition : emptyNutritionLog(today);
    this.props.nutrition = addIntake(base, intake);
  }

  logExercise(minutes: number, today: string): void {
    this.props.musculoskeletal = addExercise(this.props.musculoskeletal, minutes, today);
  }

  reportSymptoms(vision: number, dizziness: number, recordedAt: string): void {
    this.props.musculoskeletal = reportSymptoms(this.props.musculoskeletal, vision, dizziness, recordedAt);
  }

  /** The daily countermeasure target follows the gravity environment (set by the clinical rules). */
  setExerciseTarget(minutes: number): void {
    this.props.musculoskeletal = { ...this.props.musculoskeletal, exerciseTargetMinutes: minutes };
  }

  replaceAssessments(next: OrganAssessment[]): void {
    this.props.assessments = next;
  }

  toSnapshot(): AstronautTelemetryProps {
    return structuredClone(this.props);
  }
}
