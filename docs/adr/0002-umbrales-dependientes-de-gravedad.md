# ADR-0002 · Umbrales clínicos dependientes de la gravedad

- **Estado:** aceptada
- **Fecha:** 2026-11-14

## Contexto

Un mismo valor no significa lo mismo en órbita que en la Tierra: en 0 g los fluidos suben a la cabeza, la presión en la parte alta del cuerpo y la PIC aumentan, y el esqueleto deja de cargar peso. El desafío pide que la herramienta funcione en distintos entornos (nave, estación, rover, base en otro planeta o luna).

## Decisión

- El entorno es un value object `GravityEnvironment` con cuatro valores: `ZERO_G` (0 g), `LUNAR` (0,16 g), `MARTIAN` (0,38 g) y `EARTH` (1 g).
- Los umbrales que dependen de la gravedad se calculan con **fórmulas lineales** en función de la descarga `u = 1 − g` (ver [reglas clínicas](../04-reglas-clinicas.md)).
- La **rutina de ejercicio** se define por entorno como una lista de bloques; el objetivo diario es su suma.
- Todos los umbrales viven en `ClinicalRulesService`. Ningún componente ni caso de uso fija valores médicos.
- El entorno es **global de la misión** (tabla `mission_state`), no de cada astronauta.

## Alternativas descartadas

- **Tablas de umbrales por entorno escritas a mano:** más precisas, pero sin datos clínicos validados para la Luna y Marte serían igual de arbitrarias y más difíciles de explicar.
- **Gravedad por astronauta:** más realista para tripulaciones repartidas, pero innecesaria con un único actor.

## Consecuencias

- Cambiar de entorno recalcula colores, alertas y rutina en todas las pantallas con una sola acción.
- Las fórmulas son **aproximaciones para la demo** y no tienen validación clínica; se documentan como tales.
- Distinguir nave, rover y base requeriría un concepto nuevo (hábitat) aparte de la gravedad.
