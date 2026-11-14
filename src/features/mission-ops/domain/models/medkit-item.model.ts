import { DomainError } from "@/features/health-monitoring/domain/errors/domain.error";

export interface MedkitItem {
  readonly id: string;
  readonly locker: string;
  readonly name: string;
  readonly category: string;
  readonly stock: number;
  readonly capacity: number;
  readonly unit: string;
  /** Expiry in mission sols ("Sol 910") or "—" for non-perishables. */
  readonly expires: string;
  readonly note: string;
}

export function createMedkitItem(input: MedkitItem): MedkitItem {
  if (!(input.capacity > 0)) throw new DomainError(`Capacidad inválida para ${input.name}`);
  if (!(input.stock >= 0) || input.stock > input.capacity) throw new DomainError(`Existencias fuera de rango para ${input.name}`);
  return input;
}
