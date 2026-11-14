"use client";

import * as React from "react";
import { HealthStatus } from "../../domain/value-objects/health-status.vo";
import type { AnatomicalStructureId } from "../../domain/value-objects/anatomical-structure.vo";
import type { OrganAssessment } from "../../domain/models/organ-assessment.model";
import type { AstronautSummaryDto, DashboardSummaryDto } from "../../application/dto/dashboard-summary.dto";
import { useHealthSessionStore } from "./useHealthSession.store";

/** The finding the twin opens on: worst effective status, organs before bones. */
function defaultFocus(member: AstronautSummaryDto): AnatomicalStructureId {
  const ranked = [...member.assessments].sort((a, b) => HealthStatus.rank(b.status) - HealthStatus.rank(a.status));
  return ranked[0] && ranked[0].status !== "NOMINAL" ? ranked[0].structureId : "heart";
}

/** Resolves the server summary against the operator's UI session (selected astronaut / structure). */
export function useTelemetryController(summary: DashboardSummaryDto) {
  const selectedAstronautId = useHealthSessionStore((s) => s.selectedAstronautId);
  const selectedStructure = useHealthSessionStore((s) => s.selectedStructure);
  const selectAstronaut = useHealthSessionStore((s) => s.selectAstronaut);
  const selectStructure = useHealthSessionStore((s) => s.selectStructure);

  const selected = summary.crew.find((c) => c.astronaut.id === selectedAstronautId) ?? summary.crew[0];

  const assessmentsById = React.useMemo(
    () => Object.fromEntries((selected?.assessments ?? []).map((a) => [a.structureId, a])) as Partial<Record<AnatomicalStructureId, OrganAssessment>>,
    [selected]
  );
  const statuses = React.useMemo(
    () => Object.fromEntries((selected?.assessments ?? []).map((a) => [a.structureId, a.status])) as Partial<Record<AnatomicalStructureId, HealthStatus>>,
    [selected]
  );

  const structure = selectedStructure && assessmentsById[selectedStructure] ? selectedStructure : selected ? defaultFocus(selected) : "heart";
  const flagged = summary.crew.filter((c) => c.overall !== "NOMINAL");

  return {
    environment: summary.environment,
    environments: summary.environments,
    thresholds: summary.thresholds,
    crew: summary.crew,
    selected,
    selectAstronaut,
    structure,
    assessment: assessmentsById[structure],
    assessmentsById,
    statuses,
    selectStructure,
    flagged,
    generatedAt: summary.generatedAt,
  };
}
