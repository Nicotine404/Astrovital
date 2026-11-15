import type { AstronautTelemetry } from "../../../domain/models/astronaut-telemetry.model";
import type { VitalSigns } from "../../../domain/models/vital-signs.model";
import type { GravityEnvironment } from "../../../domain/value-objects/gravity-environment.vo";
import type { Habitat } from "../../../domain/value-objects/habitat.vo";

/** Contract that Infrastructure must implement (Supabase, in-memory, …). */
export interface TelemetryRepositoryPort {
  /** Where the crew is; the gravity environment follows from it. */
  getHabitat(): Promise<Habitat>;
  saveHabitat(habitat: Habitat): Promise<void>;
  /** Shortcut for (await getHabitat()).gravity. */
  getEnvironment(): Promise<GravityEnvironment>;
  findAll(): Promise<AstronautTelemetry[]>;
  findById(id: string): Promise<AstronautTelemetry | null>;
  /** Upserts the whole aggregate; the adapter decides how to persist each part. */
  save(telemetry: AstronautTelemetry): Promise<void>;
  delete(id: string): Promise<void>;
  /** Most recent vital-sign samples, oldest first. */
  getVitalHistory(astronautId: string, limit: number): Promise<VitalSigns[]>;
  /** Daily musculoskeletal samples, oldest first. */
  getMusculoskeletalHistory(astronautId: string, limit: number): Promise<MusculoskeletalSample[]>;
}

export interface MusculoskeletalSample {
  recordedAt: string;
  boneDensityDeltaPct: number;
  cephalicFluidShiftMmHg: number;
  exerciseMinutes: number;
}
