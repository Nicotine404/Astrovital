import { DomainError } from "../errors/domain.error";

/** Vital signs snapshot (RF-01). */
export interface VitalSigns {
  recordedAt: string; // ISO-8601
  heartRate: number; // bpm
  systolic: number; // mmHg
  diastolic: number; // mmHg
  spo2: number; // %
  respiratoryRate: number; // rpm
  coreTemperature: number; // °C
  glucose: number; // mg/dL
  cardiacOutput: number; // L/min
  intracranialPressure: number; // mmHg (non-invasive estimate)
}

const RANGES: Record<Exclude<keyof VitalSigns, "recordedAt">, [number, number]> = {
  heartRate: [20, 240],
  systolic: [50, 260],
  diastolic: [20, 160],
  spo2: [50, 100],
  respiratoryRate: [4, 60],
  coreTemperature: [30, 43],
  glucose: [20, 600],
  cardiacOutput: [1, 15],
  intracranialPressure: [0, 60],
};

/** Factory enforcing physiological plausibility (rejects sensor garbage, not disease). */
export function createVitalSigns(input: VitalSigns): VitalSigns {
  for (const [key, [min, max]] of Object.entries(RANGES) as [keyof typeof RANGES, [number, number]][]) {
    const v = input[key];
    if (!Number.isFinite(v) || v < min || v > max) {
      throw new DomainError(`Valor fisiológicamente imposible para ${key}: ${v}`, "INVALID_VITAL_SIGN");
    }
  }
  if (input.diastolic >= input.systolic) throw new DomainError("La diastólica debe ser menor que la sistólica", "INVALID_VITAL_SIGN");
  return { ...input };
}
