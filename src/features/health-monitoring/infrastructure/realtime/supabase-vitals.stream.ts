import type { SupabaseClient } from "@supabase/supabase-js";
import type { VitalSigns } from "../../domain/models/vital-signs.model";
import type { VitalsStreamPort } from "../../application/ports/out/vitals-stream.port";
import { TelemetryMapper, type VitalSignsRow } from "../persistence/mappers/telemetry.mapper";

/** Supabase Realtime (postgres_changes) on vital_signs inserts for one crew member. */
export class SupabaseVitalsStream implements VitalsStreamPort {
  constructor(private readonly db: SupabaseClient) {}

  subscribe(astronautId: string, _baseline: VitalSigns, onSample: (sample: VitalSigns) => void): () => void {
    const channel = this.db
      .channel(`vitals:${astronautId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "vital_signs", filter: `astronaut_id=eq.${astronautId}` },
        (payload) => onSample(TelemetryMapper.vitalsToDomain(payload.new as VitalSignsRow))
      )
      .subscribe();
    return () => {
      void this.db.removeChannel(channel);
    };
  }
}
