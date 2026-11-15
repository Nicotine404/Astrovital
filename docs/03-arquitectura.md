# Arquitectura

AstroVital combina **Clean Architecture**, **vertical slicing por feature** y **DDD táctico** sobre **Next.js 15 (App Router)** y **TypeScript estricto** ([ADR-0001](adr/0001-clean-architecture-vertical-slices-ddd.md)). El dominio clínico es TypeScript puro: no conoce React, Next ni Supabase.

## Stack

| Categoría | Tecnología | Rol |
|---|---|---|
| Framework | Next.js 15 (App Router) + React 19 + TypeScript estricto | Server Components, Server Actions |
| UI | shadcn/ui (Radix + Tailwind CSS v4) en `core/presentation/ui` | Primitivas accesibles |
| 3D | three.js + @react-three/fiber + drei | Gemelo digital (modelo BodyParts3D) |
| Gráficas | Recharts vía `ui/chart.tsx` | Tendencias |
| Estado cliente | Zustand (solo estado de UI) + `useOptimistic` / `useTransition` | Controllers |
| Validación | Zod | DTOs e inputs de Server Actions |
| Backend | Supabase (`@supabase/ssr`): PostgreSQL, RLS, Realtime | Opcional: sin variables de entorno se usan adaptadores en memoria |
| Notificaciones | sonner | Toasts de alerta |

## Contexto (C4 nivel 1)

```mermaid
flowchart LR
  astro((Astronauta))
  app[AstroVital<br/>panel de salud en el dispositivo]
  sensors[Sensores biomédicos<br/>y dosímetro CANS<br/><i>simulados</i>]
  db[(Supabase<br/>PostgreSQL + Realtime<br/><i>opcional</i>)]
  ground[Médicos de vuelo<br/>en Tierra]

  astro -- consulta, registra mediciones,<br/>cambia el entorno --> app
  sensors -- lecturas --> app
  app -- persiste y recibe<br/>signos vitales en vivo --> db
  app -. recomienda avisar<br/>con retardo de comunicación .-> ground
```

## Contenedores (C4 nivel 2)

```mermaid
flowchart TB
  subgraph browser[Navegador]
    views[Views + componentes puros<br/>shadcn/ui · gemelo 3D]
    ctrl[Controllers<br/>hooks · useOptimistic · Zustand]
    cc[container.client.ts<br/>solo Realtime]
  end
  subgraph server[Servidor Next.js]
    rsc[Server Components<br/>app/dashboard/*]
    act[Server Actions<br/>'use server' + Zod]
    sc[container.ts<br/>composition root]
    uc[Use cases + reglas de dominio]
    adp[Adaptadores<br/>Supabase o en memoria]
  end
  pg[(Supabase PostgreSQL)]
  rt[[Supabase Realtime]]

  views <--> ctrl
  ctrl -- invoca --> act
  rsc -- render inicial --> views
  rsc & act --> sc --> uc --> adp
  adp --> pg
  cc -- postgres_changes<br/>vital_signs --> rt
  rt --> ctrl
```

## Capas y regla de dependencia

Las dependencias apuntan siempre hacia el dominio.

```mermaid
flowchart TB
  P[Presentación<br/>actions · controllers · components · views]
  A[Aplicación<br/>use cases · puertos · DTOs]
  D[Dominio<br/>modelos · value objects · reglas clínicas]
  I[Infraestructura<br/>adaptadores · mappers · seeds · realtime]
  P --> A --> D
  I -- implementa puertos de --> A
  I --> D
```

| Capa | Puede importar | Nunca importa |
|---|---|---|
| `domain/` | Solo TypeScript estándar | React, Next, Supabase, UI |
| `application/` | `domain/` | Infraestructura, React, Next |
| `infrastructure/` | `application/` (puertos), `domain/` | Presentación |
| `presentation/` | `application/` (DTOs), `domain/` (tipos), `core/presentation` | Adaptadores concretos (se resuelven en el contenedor DI) |

## Bounded contexts (slices)

| Slice | Responsabilidad | Casos de uso |
|---|---|---|
| `health-monitoring` | **Núcleo.** Telemetría biomédica, reglas clínicas, gravedad, radiación, musculoesquelético, mente, nutrición | CU-01 a CU-07 |
| `clinical-diagnostics` | Diagnósticos e hipótesis a partir de archivos clínicos (imagen, audio, PDF, DICOM). **Analizador simulado** | Extra |
| `mission-ops` | Botiquín y lecturas de soporte vital de cabina (ECLSS) | Extra |

El agregado raíz del núcleo es `AstronautTelemetry`: todo el estado biomédico de un astronauta. Se modifica solo a través de sus métodos (`recordVitals`, `logRadiation`, `logExercise`, `reportSymptoms`, `logMentalCheckin`, `logNutrition`, `setExerciseTarget`) y se guarda completo.

```mermaid
classDiagram
  class AstronautTelemetry {
    <<aggregate root>>
    +astronaut: Astronaut
    +recordVitals()
    +logRadiation()
    +logExercise()
    +reportSymptoms()
    +logMentalCheckin()
    +logNutrition()
    +setExerciseTarget()
    +toSnapshot()
  }
  AstronautTelemetry *-- VitalSigns
  AstronautTelemetry *-- RadiationDosimetry
  AstronautTelemetry *-- Musculoskeletal
  AstronautTelemetry *-- "0..30" MentalCheckin
  AstronautTelemetry *-- NutritionLog
  AstronautTelemetry *-- "*" OrganAssessment
  class GravityEnvironment {
    <<value object>>
    ZERO_G · LUNAR · MARTIAN · EARTH
    +unloading = 1 - g
  }
  class ClinicalRulesService {
    <<domain service>>
    +thresholdsFor(env)
    +countermeasuresFor(env)
    +evaluate(telemetry, env, dayFraction)
  }
  ClinicalRulesService ..> AstronautTelemetry : evalúa
  ClinicalRulesService ..> GravityEnvironment : usa
```

## Estructura de directorios

```text
src/
├── app/(dashboard)/                 Rutas: / · /crew · /diagnostics · /medkit · /radiation · /wellbeing · /environment
│   ├── layout.tsx                   Carga el resumen (SSR) y monta MissionDashboardLayout
│   └── */page.tsx                   Server Components: piden datos al contenedor DI
├── core/
│   ├── infrastructure/
│   │   ├── di/container.ts          Composition root del servidor (único lugar con `new`)
│   │   ├── di/container.client.ts   Composition root del navegador (solo Realtime)
│   │   ├── supabase/                Cliente SSR (cookies) y cliente de navegador
│   │   └── clock/                   Reloj del sistema (ClockPort)
│   ├── presentation/
│   │   ├── ui/                      Primitivas shadcn/ui
│   │   ├── layouts/mission-dashboard/
│   │   └── shared/                  StatusBadge, Sparkline, PageHeader, EcgTrace…
│   └── utils/                       cn.ts, action-result.ts (runAction: Zod + mapeo de errores)
└── features/
    ├── health-monitoring/
    │   ├── domain/                  models · value-objects · services/clinical-rules · errors
    │   ├── application/             ports/out · dto (Zod) · use-cases
    │   ├── infrastructure/          persistence (adaptadores, mapper, seeds) · realtime · anatomy
    │   └── presentation/            actions · controllers · components · views
    ├── clinical-diagnostics/        Misma estructura de 4 capas
    └── mission-ops/                 Misma estructura de 4 capas
supabase/
├── migrations/                      0001_init.sql · 0002_cu_gaps.sql
└── seed.sql                         Generado con scripts/generate-supabase-seed.ts
```

**Diferencias con la especificación original:**
- La silueta del cuerpo es un **gemelo 3D** (three.js + BodyParts3D), no un SVG.
- Se agregó una carpeta `presentation/views/` que compone componentes y controllers por página.
- `MetricTrendChart` vive en `features/health-monitoring/presentation/components/trends/`, no en `core/`.

## Flujos clave

### Cambio de entorno gravitacional (CU-04)

Recorre todas las capas: es el flujo de referencia.

```mermaid
sequenceDiagram
  actor A as Astronauta
  participant V as GravityEnvironmentBar
  participant C as useGravityController
  participant SA as changeGravityEnvironmentAction
  participant UC as ChangeGravityEnvironmentUseCase
  participant R as ClinicalRulesService
  participant Repo as TelemetryRepositoryPort

  A->>V: elige 0 g
  V->>C: onChange("ZERO_G")
  C->>C: useOptimistic: muestra 0 g ya
  C->>SA: { environmentId: "ZERO_G" }
  SA->>SA: valida con Zod
  SA->>UC: execute(dto)
  UC->>Repo: saveEnvironment(0 g)
  UC->>Repo: findAll()
  loop cada astronauta
    UC->>R: thresholdsFor(0 g) → rutina 150 min
    UC->>UC: setExerciseTarget(150)
    UC->>R: recalibrateAssessments()
    UC->>Repo: save(telemetry)
  end
  SA->>SA: revalidatePath("/", "layout")
  SA-->>C: { ok: true, data: entorno }
  C-->>A: toast "Umbrales y rutina recalculados"
  Note over V,Repo: El layout se vuelve a renderizar en el servidor<br/>y todas las páginas ven los nuevos colores
```

### Tormenta solar y refugio (CU-03)

```mermaid
sequenceDiagram
  actor A as Astronauta
  participant C as useRadiationController
  participant UC as LogRadiationExposureUseCase
  participant R as ClinicalRulesService
  A->>C: Simular evento SPE
  C->>UC: SPE · 6.4 mSv/día · flujo 9.2 · 3 h (toda la tripulación)
  UC->>UC: accumulateExposure() en cada dosímetro
  UC->>R: evaluateRadiation()
  R-->>UC: shelterRequired · immuneCheckRequired
  UC-->>C: { shelterRequired: true }
  C-->>A: alerta roja: refugio + chequeo inmunológico al salir
```

## Reglas de implementación

1. **Dominio puro:** `features/**/domain/**` no importa `react`, `next`, `@supabase/*` ni librerías de UI.
2. **Vista separada de datos:** los componentes (`presentation/components/**`) reciben datos por props y emiten callbacks. No hacen fetching ni llaman a Server Actions. La orquestación (carga, `useOptimistic`, errores, Realtime) vive en `presentation/controllers/**`.
3. **shadcn/ui:** toda primitiva visual se importa de `@/core/presentation/ui/*`.
4. **Supabase dual:** Server Components y Server Actions usan el cliente SSR a través de `container.ts`; los controllers que necesitan Realtime usan `container.client.ts`.
5. **Mappers:** la conversión `snake_case` ↔ `camelCase` ocurre solo en `infrastructure/persistence/mappers/*.mapper.ts`.
6. **Inyección de dependencias:** nunca `new *Adapter()` ni `new *UseCase()` fuera de `core/infrastructure/di/`.
7. **Server Actions como única frontera de escritura:** toda mutación pasa por `runAction(schema, input, fn)`, que valida con Zod y convierte los `DomainError` en mensajes para la UI.

## Cómo añadir una funcionalidad

1. Dominio: modelo o regla nueva en `domain/` (TypeScript puro).
2. Aplicación: DTO con Zod y caso de uso que use los puertos.
3. Infraestructura: columnas nuevas en una migración `supabase/migrations/000N_*.sql`, y actualizar mapper y seed (los dos adaptadores comparten el mapper).
4. Registrar el caso de uso en `core/infrastructure/di/container.ts`.
5. Presentación: Server Action → controller → componente puro.
6. Verificar: `npm run typecheck` y `npm run lint`.
