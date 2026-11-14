import { DomainError } from "@/features/health-monitoring/domain/errors/domain.error";

/** One Environmental Control and Life Support System channel with its nominal band. */
export interface EclssReading {
  readonly id: string;
  readonly label: string;
  readonly value: number;
  readonly unit: string;
  readonly min: number;
  readonly max: number;
  readonly nominalLow: number;
  readonly nominalHigh: number;
  readonly note: string;
  /** Hourly samples, oldest first. */
  readonly history: readonly number[];
}

export function createEclssReading(input: EclssReading): EclssReading {
  if (!(input.min < input.max) || !(input.nominalLow <= input.nominalHigh)) throw new DomainError(`Rangos inválidos para ${input.label}`);
  return input;
}
