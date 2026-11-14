import type { VitalSigns } from "../../domain/models/vital-signs.model";
import type { VitalsStreamPort } from "../../application/ports/out/vitals-stream.port";

/** Bounded random walk around the last recorded sample. Used when Supabase Realtime is not configured. */
export class SimulatedVitalsStream implements VitalsStreamPort {
  constructor(private readonly intervalMs = 1500) {}

  subscribe(_astronautId: string, baseline: VitalSigns, onSample: (sample: VitalSigns) => void): () => void {
    let current = baseline;
    const walk = (value: number, base: number, spread: number, decimals = 0) => {
      const drift = (base - value) * 0.3;
      const next = value + drift + (Math.random() - 0.5) * 2 * spread;
      const f = 10 ** decimals;
      return Math.round(next * f) / f;
    };
    const id = setInterval(() => {
      current = {
        recordedAt: new Date().toISOString(),
        heartRate: walk(current.heartRate, baseline.heartRate, 2),
        systolic: walk(current.systolic, baseline.systolic, 1.5),
        diastolic: walk(current.diastolic, baseline.diastolic, 1),
        spo2: Math.min(100, walk(current.spo2, baseline.spo2, 0.25, 1)),
        respiratoryRate: walk(current.respiratoryRate, baseline.respiratoryRate, 0.6),
        coreTemperature: walk(current.coreTemperature, baseline.coreTemperature, 0.03, 2),
        glucose: walk(current.glucose, baseline.glucose, 1.2),
        cardiacOutput: walk(current.cardiacOutput, baseline.cardiacOutput, 0.08, 2),
        intracranialPressure: walk(current.intracranialPressure, baseline.intracranialPressure, 0.15, 1),
      };
      onSample(current);
    }, this.intervalMs);
    return () => clearInterval(id);
  }
}
