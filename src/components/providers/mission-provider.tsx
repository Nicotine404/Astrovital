"use client";

import * as React from "react";
import { CREW, ENVIRONMENTS } from "@/lib/data/mock";
import type { CrewMember, EnvironmentId, MissionEnvironment, OrganId } from "@/lib/data/types";

interface MissionContextValue {
  crew: CrewMember[];
  setCrew: React.Dispatch<React.SetStateAction<CrewMember[]>>;
  selectedCrew: CrewMember;
  selectCrew: (id: string) => void;
  selectedOrgan: OrganId;
  selectOrgan: (id: OrganId) => void;
  environment: MissionEnvironment;
  setEnvironment: (id: EnvironmentId) => void;
  crisisOpen: boolean;
  setCrisisOpen: (open: boolean) => void;
}

const MissionContext = React.createContext<MissionContextValue | null>(null);

export function MissionProvider({ children }: { children: React.ReactNode }) {
  const [crew, setCrew] = React.useState<CrewMember[]>(CREW);
  const [crewId, setCrewId] = React.useState(CREW[0].id);
  const [selectedOrgan, setSelectedOrgan] = React.useState<OrganId>(CREW[0].focusOrgan);
  const [envId, setEnvId] = React.useState<EnvironmentId>("transit");
  const [crisisOpen, setCrisisOpen] = React.useState(false);

  const selectedCrew = crew.find((c) => c.id === crewId) ?? crew[0] ?? CREW[0];

  const selectCrew = React.useCallback(
    (id: string) => {
      setCrewId(id);
      const member = crew.find((c) => c.id === id);
      if (member) setSelectedOrgan(member.focusOrgan);
    },
    [crew]
  );

  const value: MissionContextValue = {
    crew,
    setCrew,
    selectedCrew,
    selectCrew,
    selectedOrgan,
    selectOrgan: setSelectedOrgan,
    environment: ENVIRONMENTS.find((e) => e.id === envId)!,
    setEnvironment: setEnvId,
    crisisOpen,
    setCrisisOpen,
  };

  return <MissionContext.Provider value={value}>{children}</MissionContext.Provider>;
}

export function useMission() {
  const ctx = React.useContext(MissionContext);
  if (!ctx) throw new Error("useMission must be used inside <MissionProvider>");
  return ctx;
}
