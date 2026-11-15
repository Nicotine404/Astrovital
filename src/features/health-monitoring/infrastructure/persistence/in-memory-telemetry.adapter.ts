import type { AstronautTelemetry } from "../../domain/models/astronaut-telemetry.model";
import type { VitalSigns } from "../../domain/models/vital-signs.model";
import type { GravityEnvironment } from "../../domain/value-objects/gravity-environment.vo";
import type { Habitat } from "../../domain/value-objects/habitat.vo";
import type { MusculoskeletalSample, TelemetryRepositoryPort } from "../../application/ports/out/telemetry-repository.port";
import type { ClockPort } from "../../application/ports/out/clock.port";
import { TelemetryMapper, type AstronautRowSet } from "./mappers/telemetry.mapper";
import { buildSeedTables, type TelemetryTables } from "./seed/telemetry.seed";

/**
 * Implements TelemetryRepositoryPort over in-process tables shaped exactly like the
 * PostgreSQL schema (snake_case rows), so the same mapper is exercised as with Supabase.
 * Used automatically when Supabase is not configured. State lives for the server process.
 */
const STORE_KEY = "__astrovital_telemetry_tables__";
const store = globalThis as unknown as Record<string, TelemetryTables | undefined>;

export class InMemoryTelemetryAdapter implements TelemetryRepositoryPort {
  constructor(private readonly clock: ClockPort) {}

  private get tables(): TelemetryTables {
    return (store[STORE_KEY] ??= buildSeedTables(this.clock.now()));
  }

  private today() {
    return this.clock.now().toISOString().slice(0, 10);
  }

  async getHabitat(): Promise<Habitat> {
    return TelemetryMapper.habitatToDomain(this.tables.mission_state[0] ?? null);
  }

  async saveHabitat(habitat: Habitat): Promise<void> {
    this.tables.mission_state = [TelemetryMapper.habitatToRow(habitat)];
  }

  async getEnvironment(): Promise<GravityEnvironment> {
    return (await this.getHabitat()).gravity;
  }

  private rowSet(id: string): AstronautRowSet | null {
    const t = this.tables;
    const astronaut = t.astronauts.find((a) => a.id === id);
    if (!astronaut) return null;
    const by = <T extends { astronaut_id: string }>(rows: T[]) => rows.filter((r) => r.astronaut_id === id);
    const vitals = by(t.vital_signs).sort((a, b) => a.recorded_at.localeCompare(b.recorded_at));
    return {
      astronaut,
      latestVitals: vitals[vitals.length - 1],
      assessments: by(t.organ_assessments),
      dosimetry: by(t.radiation_dosimetry)[0],
      readings: by(t.radiation_readings).slice(-60),
      musculoskeletal: by(t.musculoskeletal_status)[0],
      checkins: by(t.mental_checkins).slice(-30),
      nutrition: by(t.nutrition_logs).find((n) => n.log_date === this.today()) ?? null,
    };
  }

  async findAll(): Promise<AstronautTelemetry[]> {
    return this.tables.astronauts.map((a) => TelemetryMapper.toDomain(this.rowSet(a.id)!, this.today()));
  }

  async findById(id: string): Promise<AstronautTelemetry | null> {
    const set = this.rowSet(id);
    return set ? TelemetryMapper.toDomain(set, this.today()) : null;
  }

  async save(telemetry: AstronautTelemetry): Promise<void> {
    const rows = TelemetryMapper.toRowSet(telemetry);
    const t = this.tables;
    const id = rows.astronaut.id;
    const upsert = <T>(list: T[], row: T, match: (r: T) => boolean) => {
      const i = list.findIndex(match);
      if (i >= 0) list[i] = row;
      else list.push(row);
    };
    const insertNew = <T extends { astronaut_id: string; recorded_at: string }>(list: T[], incoming: T[]) => {
      const seen = new Set(list.filter((r) => r.astronaut_id === id).map((r) => r.recorded_at));
      for (const r of incoming) if (!seen.has(r.recorded_at)) list.push(r);
    };

    upsert(t.astronauts, rows.astronaut, (r) => r.id === id);
    insertNew(t.vital_signs, [rows.latestVitals]);
    for (const a of rows.assessments) upsert(t.organ_assessments, a, (r) => r.astronaut_id === id && r.structure_id === a.structure_id);
    upsert(t.radiation_dosimetry, rows.dosimetry, (r) => r.astronaut_id === id);
    insertNew(t.radiation_readings, rows.readings);
    upsert(t.musculoskeletal_status, rows.musculoskeletal, (r) => r.astronaut_id === id);
    insertNew(t.mental_checkins, rows.checkins);
    if (rows.nutrition) upsert(t.nutrition_logs, rows.nutrition, (r) => r.astronaut_id === id && r.log_date === rows.nutrition!.log_date);
  }

  async delete(id: string): Promise<void> {
    const t = this.tables;
    t.astronauts = t.astronauts.filter((a) => a.id !== id);
    const keep = <T extends { astronaut_id: string }>(rows: T[]) => rows.filter((r) => r.astronaut_id !== id);
    t.vital_signs = keep(t.vital_signs);
    t.organ_assessments = keep(t.organ_assessments);
    t.radiation_dosimetry = keep(t.radiation_dosimetry);
    t.radiation_readings = keep(t.radiation_readings);
    t.musculoskeletal_status = keep(t.musculoskeletal_status);
    t.musculoskeletal_history = keep(t.musculoskeletal_history);
    t.mental_checkins = keep(t.mental_checkins);
    t.nutrition_logs = keep(t.nutrition_logs);
  }

  async getVitalHistory(astronautId: string, limit: number): Promise<VitalSigns[]> {
    return this.tables.vital_signs
      .filter((r) => r.astronaut_id === astronautId)
      .sort((a, b) => a.recorded_at.localeCompare(b.recorded_at))
      .slice(-limit)
      .map(TelemetryMapper.vitalsToDomain);
  }

  async getMusculoskeletalHistory(astronautId: string, limit: number): Promise<MusculoskeletalSample[]> {
    return this.tables.musculoskeletal_history
      .filter((r) => r.astronaut_id === astronautId)
      .sort((a, b) => a.recorded_at.localeCompare(b.recorded_at))
      .slice(-limit)
      .map(TelemetryMapper.mskHistoryToSample);
  }
}
