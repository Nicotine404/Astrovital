/** Bone, muscle and fluid-shift state (RF-04). */
export interface Musculoskeletal {
  /** Bone mineral density change since launch, % (negative = loss). */
  boneDensityDeltaPct: number;
  muscleMassDeltaPct: number;
  /** Measured cephalad fluid shift, mmHg (head-to-foot pressure delta vs. Earth baseline). */
  cephalicFluidShiftMmHg: number;
  /** Measured spinal elongation since launch, cm. */
  spinalElongationCm: number;
  exerciseMinutesToday: number;
  exerciseTargetMinutes: number;
}
