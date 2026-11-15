# ADR-0001 · Clean Architecture + vertical slices + DDD táctico

- **Estado:** aceptada
- **Fecha:** 2026-11-14

## Contexto

Un equipo de varias personas tiene que construir en 2 días una app con muchos dominios clínicos distintos (signos vitales, radiación, hueso, mente, nutrición) cuyas reglas cambian con la gravedad. Las reglas médicas son la parte más valiosa y la que más se va a discutir y ajustar. La persistencia puede ser Supabase o nada: la demo tiene que funcionar sin backend.

## Decisión

- **Clean Architecture:** cuatro capas (dominio, aplicación, infraestructura, presentación) con las dependencias apuntando al dominio.
- **Vertical slicing:** cada bounded context (`health-monitoring`, `clinical-diagnostics`, `mission-ops`) tiene sus cuatro capas dentro de `src/features/<slice>/`.
- **DDD táctico:** agregado raíz `AstronautTelemetry`, value objects (`GravityEnvironment`, `HealthStatus`, `BodyZone`) y un servicio de dominio puro (`ClinicalRulesService`) que concentra todas las reglas.
- **Composition root** único en `core/infrastructure/di/` (servidor y navegador).
- **Server Actions** como única frontera de escritura, con validación Zod (`runAction`).

## Consecuencias

**A favor**
- Las reglas clínicas se prueban y cambian sin tocar React ni la base de datos.
- Cambiar Supabase por memoria es una línea en el contenedor ([ADR-0003](0003-datos-simulados-y-modo-sin-backend.md)).
- Cada slice se puede trabajar en paralelo.

**En contra**
- Más archivos y más ceremonia por funcionalidad (DTO, caso de uso, action, controller, componente).
- Varios CU comparten el agregado y el servicio de reglas, que son puntos de conflicto al trabajar en paralelo.
- El agregado se guarda completo en cada `save`: simple, pero hace más escrituras de las necesarias.
