import "server-only";
import { cache } from "react";
import { createSupabaseServerClient } from "@/core/infrastructure/supabase/supabase.server";
import { systemClock } from "@/core/infrastructure/clock/system-clock";

import { ClinicalRulesService } from "@/features/health-monitoring/domain/services/clinical-rules.domain-service";
import { DailyMissionService } from "@/features/health-monitoring/domain/services/daily-mission.domain-service";
import type { TelemetryRepositoryPort } from "@/features/health-monitoring/application/ports/out/telemetry-repository.port";
import { ChangeHabitatUseCase } from "@/features/health-monitoring/application/use-cases/change-habitat.use-case";
import { GetAstronautTelemetryUseCase } from "@/features/health-monitoring/application/use-cases/get-astronaut-telemetry.use-case";
import { GetVitalHistoryUseCase } from "@/features/health-monitoring/application/use-cases/get-vital-history.use-case";
import { LogPhysicalStatusUseCase } from "@/features/health-monitoring/application/use-cases/log-physical-status.use-case";
import { LogMentalCheckinUseCase } from "@/features/health-monitoring/application/use-cases/log-mental-checkin.use-case";
import { LogRadiationExposureUseCase } from "@/features/health-monitoring/application/use-cases/log-radiation-exposure.use-case";
import { RecordVitalSignsUseCase } from "@/features/health-monitoring/application/use-cases/record-vital-signs.use-case";
import { RegisterAstronautUseCase } from "@/features/health-monitoring/application/use-cases/register-astronaut.use-case";
import { UnlinkAstronautUseCase } from "@/features/health-monitoring/application/use-cases/unlink-astronaut.use-case";
import { ValidateDailyNutritionUseCase } from "@/features/health-monitoring/application/use-cases/validate-daily-nutrition.use-case";
import { InMemoryTelemetryAdapter } from "@/features/health-monitoring/infrastructure/persistence/in-memory-telemetry.adapter";
import { SupabaseTelemetryAdapter } from "@/features/health-monitoring/infrastructure/persistence/supabase-telemetry.adapter";

import type { DiagnosticsRepositoryPort } from "@/features/clinical-diagnostics/application/ports/out/diagnostics-repository.port";
import { AnalyzeClinicalFileUseCase } from "@/features/clinical-diagnostics/application/use-cases/analyze-clinical-file.use-case";
import { GetDiagnosticsUseCase } from "@/features/clinical-diagnostics/application/use-cases/get-diagnostics.use-case";
import { SimulatedClinicalAnalyzer } from "@/features/clinical-diagnostics/infrastructure/analysis/simulated-clinical-analyzer";
import { InMemoryDiagnosticsAdapter } from "@/features/clinical-diagnostics/infrastructure/persistence/in-memory-diagnostics.adapter";
import { SupabaseDiagnosticsAdapter } from "@/features/clinical-diagnostics/infrastructure/persistence/supabase-diagnostics.adapter";

import type { MissionOpsRepositoryPort } from "@/features/mission-ops/application/ports/out/mission-ops-repository.port";
import { GetCabinEnvironmentUseCase } from "@/features/mission-ops/application/use-cases/get-cabin-environment.use-case";
import { GetMedkitInventoryUseCase } from "@/features/mission-ops/application/use-cases/get-medkit-inventory.use-case";
import { InMemoryMissionOpsAdapter } from "@/features/mission-ops/infrastructure/persistence/in-memory-mission-ops.adapter";
import { SupabaseMissionOpsAdapter } from "@/features/mission-ops/infrastructure/persistence/supabase-mission-ops.adapter";

/**
 * Composition root for server code (Server Components, Server Actions, Route Handlers).
 * The only place where adapters and use cases are instantiated. With Supabase env vars set,
 * every port is bound to its Supabase adapter; otherwise to the in-memory adapters (seeded demo data).
 * Memoised per request through React `cache`.
 */
export const createServerContainer = cache(async () => {
  const clock = systemClock;
  const rules = new ClinicalRulesService();
  const db = await createSupabaseServerClient();

  const telemetry: TelemetryRepositoryPort = db ? new SupabaseTelemetryAdapter(db, clock) : new InMemoryTelemetryAdapter(clock);
  const diagnostics: DiagnosticsRepositoryPort = db ? new SupabaseDiagnosticsAdapter(db) : new InMemoryDiagnosticsAdapter(clock);
  const missionOps: MissionOpsRepositoryPort = db ? new SupabaseMissionOpsAdapter(db) : new InMemoryMissionOpsAdapter();
  const analyzer = new SimulatedClinicalAnalyzer();

  return {
    dataSource: db ? ("supabase" as const) : ("in-memory" as const),
    healthMonitoring: {
      getAstronautTelemetry: new GetAstronautTelemetryUseCase(telemetry, rules, new DailyMissionService(), clock),
      changeHabitat: new ChangeHabitatUseCase(telemetry, rules, clock),
      recordVitalSigns: new RecordVitalSignsUseCase(telemetry, rules, clock),
      logRadiationExposure: new LogRadiationExposureUseCase(telemetry, rules, clock),
      logMentalCheckin: new LogMentalCheckinUseCase(telemetry, rules, clock),
      logPhysicalStatus: new LogPhysicalStatusUseCase(telemetry, rules, clock),
      validateDailyNutrition: new ValidateDailyNutritionUseCase(telemetry, rules, clock),
      registerAstronaut: new RegisterAstronautUseCase(telemetry, rules, clock),
      unlinkAstronaut: new UnlinkAstronautUseCase(telemetry),
      getVitalHistory: new GetVitalHistoryUseCase(telemetry, rules),
    },
    clinicalDiagnostics: {
      getDiagnostics: new GetDiagnosticsUseCase(diagnostics),
      analyzeClinicalFile: new AnalyzeClinicalFileUseCase(diagnostics, analyzer, clock),
    },
    missionOps: {
      getMedkitInventory: new GetMedkitInventoryUseCase(missionOps),
      getCabinEnvironment: new GetCabinEnvironmentUseCase(missionOps),
    },
  };
});

export type ServerContainer = Awaited<ReturnType<typeof createServerContainer>>;
