# Documentación de AstroVital

Leer en este orden (≈ 12 min en total):

| # | Documento | Responde |
|---|---|---|
| 1 | [Visión y alcance](01-vision-alcance.md) | ¿Qué es, para quién y qué problema resuelve? ¿Qué recursos usa? |
| 2 | [Casos de uso](02-casos-de-uso.md) | ¿Qué hace? CU-01…CU-07 con criterios de aceptación |
| 3 | [Arquitectura](03-arquitectura.md) | ¿Cómo está construido? Capas, slices, diagramas y flujos |
| 4 | [Reglas clínicas](04-reglas-clinicas.md) | ¿De dónde salen los umbrales y las alertas? |
| — | [Decisiones (ADR)](adr/) | ¿Por qué se hizo así? |

Los diagramas están en [Mermaid](https://mermaid.js.org/) y GitHub los muestra directamente.

## Decisiones registradas

- [ADR-0001](adr/0001-clean-architecture-vertical-slices-ddd.md) · Clean Architecture + vertical slices + DDD táctico
- [ADR-0002](adr/0002-umbrales-dependientes-de-gravedad.md) · Umbrales clínicos dependientes de la gravedad
- [ADR-0003](adr/0003-datos-simulados-y-modo-sin-backend.md) · Datos simulados y modo sin backend
- [ADR-0004](adr/0004-actor-del-sistema.md) · El actor es el astronauta
