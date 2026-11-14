import type { SupabaseClient } from "@supabase/supabase-js";
import type { AstronautTelemetry } from "../../domain/models/astronaut-telemetry.model";
import type { VitalSigns } from "../../domain/models/vital-signs.model";
import type { GravityEnvironment } from "../../domain/value-objects/gravity-environment.vo";
import type { ClockPort } from "../../application/ports/out/clock.port";
import type { MusculoskeletalSample, TelemetryRepositoryPort } from "../../application/ports/out/telemetry-repository.port";
import {
  TelemetryMapper,
  type AstronautRow,
  type AstronautRowSet,
  type MentalCheckinRow,
  type MissionStateRow,
  type MusculoskeletalHistoryRow,
  type MusculoskeletalStatusRow,
  type NutritionLogRow,
  type OrganAssessmentRow,
  type RadiationDosimetryRow,
  type RadiationReadingRow,
  type VitalSignsRow,
} from "./mappers/telemetry.mapper";

/** Implements TelemetryRepositoryPort on Supabase (PostgreSQL + RLS). Schema: supabase/migrations. */
export class SupabaseTelemetryAdapter implements TelemetryRepositoryPort {
  constructor(
    private readonly db: SupabaseClient,
    private readonly clock: ClockPort
  ) {}

  private today() {
    return this.clock.now().toISOString().slice(0, 10);
  }

  private static check<T>(res: { data: T | null; error: { message: string } | null }, what: string): T {
    if (res.error) throw new Error(`Supabase (${what}): ${res.error.message}`);
    return res.data as T;
  }

  async getEnvironment(): Promise<GravityEnvironment> {
    const res = await this.db.from("mission_state").select("*").eq("id", 1).maybeSingle();
    return TelemetryMapper.environmentToDomain(SupabaseTelemetryAdapter.check<MissionStateRow | null>(res, "mission_state"));
  }

  async saveEnvironment(environment: GravityEnvironment): Promise<void> {
    SupabaseTelemetryAdapter.check(await this.db.from("mission_state").upsert(TelemetryMapper.environmentToRow(environment)), "mission_state");
  }

  private async loadRowSets(ids?: string[]): Promise<AstronautRowSet[]> {
    const C = SupabaseTelemetryAdapter.check;
    let astronautQuery = this.db.from("astronauts").select("*").order("created_at", { ascending: true });
    if (ids) astronautQuery = astronautQuery.in("id", ids);
    const astronauts = C<AstronautRow[]>(await astronautQuery, "astronauts");
    if (!astronauts.length) return [];
    const list = astronauts.map((a) => a.id);
    const since = new Date(this.clock.now().getTime() - 60 * 86_400_000).toISOString();
    const [vitals, assessments, dosimetry, readings, msk, checkins, nutrition] = await Promise.all([
      this.db.from("latest_vital_signs").select("*").in("astronaut_id", list),
      this.db.from("organ_assessments").select("*").in("astronaut_id", list),
      this.db.from("radiation_dosimetry").select("*").in("astronaut_id", list),
      this.db.from("radiation_readings").select("*").in("astronaut_id", list).gte("recorded_at", since).order("recorded_at"),
      this.db.from("musculoskeletal_status").select("*").in("astronaut_id", list),
      this.db.from("mental_checkins").select("*").in("astronaut_id", list).gte("recorded_at", since).order("recorded_at"),
      this.db.from("nutrition_logs").select("*").in("astronaut_id", list).eq("log_date", this.today()),
    ]);
    const v = C<VitalSignsRow[]>(vitals, "latest_vital_signs");
    const oa = C<OrganAssessmentRow[]>(assessments, "organ_assessments");
    const d = C<RadiationDosimetryRow[]>(dosimetry, "radiation_dosimetry");
    const r = C<RadiationReadingRow[]>(readings, "radiation_readings");
    const m = C<MusculoskeletalStatusRow[]>(msk, "musculoskeletal_status");
    const c = C<MentalCheckinRow[]>(checkins, "mental_checkins");
    const n = C<NutritionLogRow[]>(nutrition, "nutrition_logs");
    return astronauts
      .map((astronaut) => {
        const id = astronaut.id;
        const latestVitals = v.find((x) => x.astronaut_id === id);
        const dos = d.find((x) => x.astronaut_id === id);
        const status = m.find((x) => x.astronaut_id === id);
        if (!latestVitals || !dos || !status) return null; // incomplete record: skip rather than crash the dashboard
        return {
          astronaut,
          latestVitals,
          assessments: oa.filter((x) => x.astronaut_id === id),
          dosimetry: dos,
          readings: r.filter((x) => x.astronaut_id === id),
          musculoskeletal: status,
          checkins: c.filter((x) => x.astronaut_id === id),
          nutrition: n.find((x) => x.astronaut_id === id) ?? null,
        };
      })
      .filter((s): s is AstronautRowSet => s !== null);
  }

  async findAll(): Promise<AstronautTelemetry[]> {
    return (await this.loadRowSets()).map((s) => TelemetryMapper.toDomain(s, this.today()));
  }

  async findById(id: string): Promise<AstronautTelemetry | null> {
    const [set] = await this.loadRowSets([id]);
    return set ? TelemetryMapper.toDomain(set, this.today()) : null;
  }

  async save(telemetry: AstronautTelemetry): Promise<void> {
    const C = SupabaseTelemetryAdapter.check;
    const rows = TelemetryMapper.toRowSet(telemetry);
    C(await this.db.from("astronauts").upsert(rows.astronaut), "astronauts");
    await Promise.all([
      this.db.from("vital_signs").upsert(rows.latestVitals, { onConflict: "astronaut_id,recorded_at", ignoreDuplicates: true }).then((r) => C(r, "vital_signs")),
      this.db.from("organ_assessments").upsert(rows.assessments, { onConflict: "astronaut_id,structure_id" }).then((r) => C(r, "organ_assessments")),
      this.db.from("radiation_dosimetry").upsert(rows.dosimetry).then((r) => C(r, "radiation_dosimetry")),
      rows.readings.length
        ? this.db.from("radiation_readings").upsert(rows.readings, { onConflict: "astronaut_id,recorded_at", ignoreDuplicates: true }).then((r) => C(r, "radiation_readings"))
        : null,
      this.db.from("musculoskeletal_status").upsert(rows.musculoskeletal).then((r) => C(r, "musculoskeletal_status")),
      rows.checkins.length
        ? this.db.from("mental_checkins").upsert(rows.checkins, { onConflict: "astronaut_id,recorded_at", ignoreDuplicates: true }).then((r) => C(r, "mental_checkins"))
        : null,
      rows.nutrition ? this.db.from("nutrition_logs").upsert(rows.nutrition, { onConflict: "astronaut_id,log_date" }).then((r) => C(r, "nutrition_logs")) : null,
    ]);
  }

  async delete(id: string): Promise<void> {
    SupabaseTelemetryAdapter.check(await this.db.from("astronauts").delete().eq("id", id), "astronauts");
  }

  async getVitalHistory(astronautId: string, limit: number): Promise<VitalSigns[]> {
    const res = await this.db.from("vital_signs").select("*").eq("astronaut_id", astronautId).order("recorded_at", { ascending: false }).limit(limit);
    return SupabaseTelemetryAdapter.check<VitalSignsRow[]>(res, "vital_signs").reverse().map(TelemetryMapper.vitalsToDomain);
  }

  async getMusculoskeletalHistory(astronautId: string, limit: number): Promise<MusculoskeletalSample[]> {
    const res = await this.db.from("musculoskeletal_history").select("*").eq("astronaut_id", astronautId).order("recorded_at", { ascending: false }).limit(limit);
    return SupabaseTelemetryAdapter.check<MusculoskeletalHistoryRow[]>(res, "musculoskeletal_history").reverse().map(TelemetryMapper.mskHistoryToSample);
  }
}
