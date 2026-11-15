import type { VitalSigns } from "../../domain/models/vital-signs.model";
import type { VitalsStreamPort } from "../../application/ports/out/vitals-stream.port";
import { SimulatedVitalsStream } from "./simulated-vitals.stream";

/**
 * Real measurements from Realtime plus a simulated wearable sensor in between: a bounded
 * random walk around the last real sample. Every real sample is shown as-is and re-centres
 * the walk. Nothing simulated is written to the database, so history and trends stay real.
 */
export class HybridVitalsStream implements VitalsStreamPort {
  constructor(
    private readonly realtime: VitalsStreamPort,
    private readonly intervalMs = 1500
  ) {}

  subscribe(astronautId: string, baseline: VitalSigns, onSample: (sample: VitalSigns) => void): () => void {
    const simulate = (from: VitalSigns) => new SimulatedVitalsStream(this.intervalMs).subscribe(astronautId, from, onSample);
    let stopSimulation = simulate(baseline);
    const stopRealtime = this.realtime.subscribe(astronautId, baseline, (real) => {
      stopSimulation();
      onSample(real);
      stopSimulation = simulate(real);
    });
    return () => {
      stopSimulation();
      stopRealtime();
    };
  }
}
