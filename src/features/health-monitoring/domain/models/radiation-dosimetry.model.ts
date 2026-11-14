import { DomainError } from "../errors/domain.error";

export type RadiationSource = "GCR" | "SPE";

/** A dosimeter + CANS neutron spectrometer reading (RF-02). */
export interface RadiationReading {
  recordedAt: string;
  source: RadiationSource;
  /** Total effective dose rate, mSv/day. */
  doseRateMsvDay: number;
  /** Neutron flux measured by CANS, n·cm⁻²·s⁻¹. */
  neutronFlux: number;
  /** Exposure duration for this reading, hours. */
  durationHours: number;
}

export interface RadiationDosimetry {
  cumulativeMsv: number;
  neutronCumulativeMsv: number;
  careerLimitMsv: number;
  readings: RadiationReading[];
}

/** Neutrons contribute this share of the effective dose per unit flux (simplified quality model). */
const NEUTRON_SHARE_PER_FLUX = 0.04;
const MAX_READINGS = 60;

export function latestReading(d: RadiationDosimetry): RadiationReading | undefined {
  return d.readings[d.readings.length - 1];
}

/** Accumulates an exposure into the dosimetry record (pure, returns a new value). */
export function accumulateExposure(d: RadiationDosimetry, reading: RadiationReading): RadiationDosimetry {
  if (reading.doseRateMsvDay < 0 || reading.neutronFlux < 0 || reading.durationHours <= 0) {
    throw new DomainError("Lectura de radiación inválida", "INVALID_RADIATION_READING");
  }
  const dose = (reading.doseRateMsvDay * reading.durationHours) / 24;
  const neutronShare = Math.min(0.6, reading.neutronFlux * NEUTRON_SHARE_PER_FLUX);
  return {
    ...d,
    cumulativeMsv: round(d.cumulativeMsv + dose),
    neutronCumulativeMsv: round(d.neutronCumulativeMsv + dose * neutronShare),
    readings: [...d.readings, reading].slice(-MAX_READINGS),
  };
}

const round = (v: number) => Math.round(v * 100) / 100;
