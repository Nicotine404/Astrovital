/** Mission identity shown in the shell. Launch date drives the mission-day counter. */
export const MISSION = {
  name: "Ares Transit IV",
  launchedAt: "2025-09-28T00:00:00Z",
} as const;

export const missionDay = (now: Date) => Math.max(1, Math.floor((now.getTime() - Date.parse(MISSION.launchedAt)) / 86_400_000) + 1);
