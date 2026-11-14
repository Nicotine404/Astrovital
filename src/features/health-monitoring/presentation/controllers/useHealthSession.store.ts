"use client";

import { create } from "zustand";
import type { AnatomicalStructureId } from "../../domain/value-objects/anatomical-structure.vo";
import type { BodyZone } from "../../domain/value-objects/body-zone.vo";

import type { TwinLayer, TwinLayers, TwinViewPreset } from "../components/interactive-body/twin.types";

/**
 * Client-side UI session for the health-monitoring context: what the operator is looking at.
 * Clinical data never lives here: it comes from the server (Server Components + Actions).
 */
interface HealthSessionState {
  selectedAstronautId: string | null;
  /** null = follow the astronaut's most relevant finding. */
  selectedStructure: AnatomicalStructureId | null;
  activeZone: BodyZone | null;
  focused: boolean;
  autoRotate: boolean;
  layers: TwinLayers;
  view: { preset: TwinViewPreset; n: number };
  trendsZone: BodyZone | null;
  crisisOpen: boolean;

  selectAstronaut: (id: string) => void;
  selectStructure: (id: AnatomicalStructureId, opts?: { focus?: boolean }) => void;
  setActiveZone: (zone: BodyZone | null) => void;
  setFocused: (focused: boolean) => void;
  setAutoRotate: (on: boolean) => void;
  toggleLayer: (layer: TwinLayer) => void;
  goToView: (preset: TwinViewPreset) => void;
  openTrends: (zone: BodyZone) => void;
  closeTrends: () => void;
  setCrisisOpen: (open: boolean) => void;
}

export const useHealthSessionStore = create<HealthSessionState>()((set) => ({
  selectedAstronautId: null,
  selectedStructure: null,
  activeZone: null,
  focused: false,
  autoRotate: true,
  layers: { skin: true, organs: true, bones: true, vessels: true },
  view: { preset: "front", n: 0 },
  trendsZone: null,
  crisisOpen: false,

  selectAstronaut: (id) => set({ selectedAstronautId: id, selectedStructure: null, focused: false }),
  selectStructure: (id, opts) => set({ selectedStructure: id, focused: opts?.focus ?? true, autoRotate: false }),
  setActiveZone: (zone) => set((s) => ({ activeZone: zone, focused: zone ? false : s.focused, autoRotate: zone ? false : s.autoRotate })),
  setFocused: (focused) => set({ focused }),
  setAutoRotate: (autoRotate) => set({ autoRotate }),
  toggleLayer: (layer) => set((s) => ({ layers: { ...s.layers, [layer]: !s.layers[layer] } })),
  goToView: (preset) =>
    set((s) => ({ view: { preset, n: s.view.n + 1 }, autoRotate: false, ...(preset === "reset" ? { focused: false, activeZone: null } : {}) })),
  openTrends: (zone) => set({ trendsZone: zone }),
  closeTrends: () => set({ trendsZone: null }),
  setCrisisOpen: (crisisOpen) => set({ crisisOpen }),
}));
