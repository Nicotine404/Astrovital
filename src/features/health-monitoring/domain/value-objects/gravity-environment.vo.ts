import { DomainError } from "../errors/domain.error";

export const GRAVITY_ENVIRONMENT_IDS = ["ZERO_G", "LUNAR", "MARTIAN", "EARTH"] as const;
export type GravityEnvironmentId = (typeof GRAVITY_ENVIRONMENT_IDS)[number];

interface Definition {
  g: number;
  label: string;
  location: string;
  /** One-way light-time delay to Earth mission control, seconds (representative). */
  commDelaySeconds: number;
}

const DEFINITIONS: Record<GravityEnvironmentId, Definition> = {
  ZERO_G: { g: 0, label: "0 g", location: "Órbita (ISS)", commDelaySeconds: 0.5 },
  LUNAR: { g: 0.16, label: "0.16 g", location: "Luna", commDelaySeconds: 1.3 },
  MARTIAN: { g: 0.38, label: "0.38 g", location: "Marte", commDelaySeconds: 862 },
  EARTH: { g: 1, label: "1 g", location: "Tierra", commDelaySeconds: 0 },
};

/** Value object: operational gravity environment (0 g ISS, 0.16 g Moon, 0.38 g Mars, 1 g Earth). */
export class GravityEnvironment {
  private constructor(
    readonly id: GravityEnvironmentId,
    readonly g: number,
    readonly label: string,
    readonly location: string,
    readonly commDelaySeconds: number
  ) {}

  static readonly ALL: readonly GravityEnvironment[] = GRAVITY_ENVIRONMENT_IDS.map((id) => GravityEnvironment.from(id));

  static from(id: string): GravityEnvironment {
    if (!(GRAVITY_ENVIRONMENT_IDS as readonly string[]).includes(id)) {
      throw new DomainError(`Entorno gravitacional desconocido: ${id}`, "INVALID_GRAVITY");
    }
    const d = DEFINITIONS[id as GravityEnvironmentId];
    return new GravityEnvironment(id as GravityEnvironmentId, d.g, d.label, d.location, d.commDelaySeconds);
  }

  /** Fraction of Earth loading the skeleton and cardiovascular system no longer receive (0..1). */
  get unloading(): number {
    return 1 - this.g;
  }

  get isMicrogravity(): boolean {
    return this.g === 0;
  }

  formatCommDelay(): string {
    const s = this.commDelaySeconds;
    if (s === 0) return "0 s";
    if (s < 60) return `${s.toFixed(1)} s`;
    return `${Math.floor(s / 60)}m ${String(Math.round(s % 60)).padStart(2, "0")}s`;
  }

  equals(other: GravityEnvironment): boolean {
    return other.id === this.id;
  }
}
