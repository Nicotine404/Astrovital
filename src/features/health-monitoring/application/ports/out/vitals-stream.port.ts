import type { VitalSigns } from "../../../domain/models/vital-signs.model";

/** Live vital-sign feed (Supabase Realtime or a simulator). Returns an unsubscribe function. */
export interface VitalsStreamPort {
  subscribe(astronautId: string, baseline: VitalSigns, onSample: (sample: VitalSigns) => void): () => void;
}
