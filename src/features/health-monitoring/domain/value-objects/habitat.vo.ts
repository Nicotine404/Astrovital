import { DomainError } from "../errors/domain.error";
import { GravityEnvironment, type GravityEnvironmentId } from "./gravity-environment.vo";

export const HABITAT_IDS = ["SPACECRAFT", "ISS", "LUNAR_BASE", "LUNAR_ROVER", "MARS_BASE", "MARS_ROVER", "EARTH"] as const;
export type HabitatId = (typeof HABITAT_IDS)[number];

interface Definition {
  label: string;
  gravity: GravityEnvironmentId;
  /** Multiplier applied to the external radiation (1 = unshielded vehicle reference). */
  shielding: number;
  /** Resistance device (ARED or equivalent) available on board. */
  hasResistanceDevice: boolean;
  /** Where to go during a solar particle event, as a destination ("al refugio…"). */
  shelter: string;
}

const DEFINITIONS: Record<HabitatId, Definition> = {
  SPACECRAFT: { label: "Nave en tránsito", gravity: "ZERO_G", shielding: 1, hasResistanceDevice: true, shelter: "al refugio de agua de la nave (tanques alrededor de la litera)" },
  ISS: { label: "Estación espacial (ISS)", gravity: "ZERO_G", shielding: 0.7, hasResistanceDevice: true, shelter: "al módulo con más blindaje de la estación" },
  LUNAR_BASE: { label: "Base lunar", gravity: "LUNAR", shielding: 0.35, hasResistanceDevice: true, shelter: "al refugio bajo regolito de la base" },
  LUNAR_ROVER: { label: "Rover lunar presurizado", gravity: "LUNAR", shielding: 1.3, hasResistanceDevice: false, shelter: "al habitáculo blindado del rover o de vuelta a la base" },
  MARS_BASE: { label: "Base en Marte", gravity: "MARTIAN", shielding: 0.3, hasResistanceDevice: true, shelter: "al refugio bajo regolito de la base" },
  MARS_ROVER: { label: "Rover marciano presurizado", gravity: "MARTIAN", shielding: 1.1, hasResistanceDevice: false, shelter: "al habitáculo blindado del rover o de vuelta a la base" },
  EARTH: { label: "Tierra", gravity: "EARTH", shielding: 0.01, hasResistanceDevice: true, shelter: "a cubierto (en la Tierra la atmósfera ya protege)" },
};

/** Default place for each gravity (rows written before habitats existed). */
const DEFAULT_FOR_GRAVITY: Record<GravityEnvironmentId, HabitatId> = { ZERO_G: "ISS", LUNAR: "LUNAR_BASE", MARTIAN: "MARS_BASE", EARTH: "EARTH" };

/**
 * Value object: where the astronaut is (vehicle or base). The gravity follows from the place;
 * the place adds radiation shielding, available exercise equipment and the shelter location.
 */
export class Habitat {
  private constructor(
    readonly id: HabitatId,
    readonly label: string,
    readonly gravity: GravityEnvironment,
    readonly shielding: number,
    readonly hasResistanceDevice: boolean,
    readonly shelter: string
  ) {}

  static readonly ALL: readonly Habitat[] = HABITAT_IDS.map((id) => Habitat.from(id));

  static from(id: string): Habitat {
    if (!(HABITAT_IDS as readonly string[]).includes(id)) throw new DomainError(`Hábitat desconocido: ${id}`, "INVALID_HABITAT");
    const d = DEFINITIONS[id as HabitatId];
    return new Habitat(id as HabitatId, d.label, GravityEnvironment.from(d.gravity), d.shielding, d.hasResistanceDevice, d.shelter);
  }

  static defaultFor(gravity: GravityEnvironmentId): Habitat {
    return Habitat.from(DEFAULT_FOR_GRAVITY[gravity]);
  }

  /** Dose actually received inside this habitat for an external reading. */
  shield(value: number): number {
    return Math.round(value * this.shielding * 100) / 100;
  }
}
