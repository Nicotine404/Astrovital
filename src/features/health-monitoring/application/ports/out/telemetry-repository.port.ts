import type { AstronautTelemetry } from "../../../domain/models/astronaut-telemetry.model";
import type { VitalSigns } from "../../../domain/models/vital-signs.model";
import type { GravityEnvironment } from "../../../domain/value-objects/gravity-environment.vo";

/** Contract that Infrastructure must implement (Supabase, in-memory, …). */
export interface TelemetryRepositoryPort {
  getEnvironment(): Promise<GravityEnvironment>;
  saveEnvironment(environment: GravityEnvironment): Promise<void>;
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
