import { ClinicalRulesService } from "../../domain/services/clinical-rules.domain-service";
import type { TelemetryRepositoryPort } from "../ports/out/telemetry-repository.port";
import type { TrendSeriesDto, VitalHistoryDto } from "../dto/vital-history.dto";
import type { VitalHistoryQueryDto } from "../dto/record-measurement.dto";

/** RF-01: historical trends for one body zone, with the current gravity's limits as reference lines. */
export class GetVitalHistoryUseCase {
  constructor(
    private readonly repository: TelemetryRepositoryPort,
    private readonly rules: ClinicalRulesService
  ) {}

  async execute({ astronautId, zone, limit }: VitalHistoryQueryDto): Promise<VitalHistoryDto> {
    const env = await this.repository.getEnvironment();
    const th = this.rules.thresholdsFor(env);
    const series: TrendSeriesDto[] = [];

    if (zone === "MUSCULOSKELETAL") {
      const msk = await this.repository.getMusculoskeletalHistory(astronautId, limit);
      series.push(
        { key: "bone", label: "Δ densidad ósea", unit: "%", warning: th.boneWarningPct, critical: th.boneCriticalPct, points: msk.map((m) => ({ t: m.recordedAt, value: m.boneDensityDeltaPct })) },
        { key: "fluid", label: "Fluid shift cefálico", unit: "mmHg", warning: th.expectedFluidShiftMmHg + th.fluidShiftToleranceMmHg, points: msk.map((m) => ({ t: m.recordedAt, value: m.cephalicFluidShiftMmHg })) },
        { key: "exercise", label: "Ejercicio diario", unit: "min", points: msk.map((m) => ({ t: m.recordedAt, value: m.exerciseMinutes })) }
      );
      return { astronautId, zone, series };
    }

    const vitals = await this.repository.getVitalHistory(astronautId, limit);
    const s = (key: string, label: string, unit: string, pick: (v: (typeof vitals)[number]) => number, warning?: number, critical?: number): TrendSeriesDto => ({
      key,
      label,
      unit,
      warning,
      critical,
      points: vitals.map((v) => ({ t: v.recordedAt, value: pick(v) })),
    });
    if (zone === "CARDIO") {
      series.push(
        s("hr", "Frecuencia cardíaca", "lpm", (v) => v.heartRate, 100, 120),
        s("sys", "Presión sistólica", "mmHg", (v) => v.systolic, th.systolicWarning, th.systolicCritical),
        s("spo2", "Saturación O₂", "%", (v) => v.spo2),
        s("co", "Gasto cardíaco", "L/min", (v) => v.cardiacOutput)
      );
    } else if (zone === "NEURO") {
      series.push(s("icp", "Presión intracraneal", "mmHg", (v) => v.intracranialPressure, th.icpWarning, th.icpCritical), s("hr", "Frecuencia cardíaca", "lpm", (v) => v.heartRate));
    } else {
      series.push(s("temp", "Temperatura central", "°C", (v) => v.coreTemperature, 37.8, 39), s("glucose", "Glucosa", "mg/dL", (v) => v.glucose, 140, 250), s("rr", "Frecuencia respiratoria", "rpm", (v) => v.respiratoryRate, 24, 30));
    }
    return { astronautId, zone, series };
  }
}
