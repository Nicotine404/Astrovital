# ADR-0004 · El actor es el astronauta

- **Estado:** aceptada
- **Fecha:** 2026-11-14

## Contexto

La especificación del equipo define un **actor único: el astronauta**. La primera versión de la app, en cambio, está pensada para un **oficial médico** que vigila a una tripulación: selector de tripulante, alta y baja de tripulantes, `/crew` y textos como "N tripulantes requieren atención".

El enunciado oficial del desafío lo deja claro: la herramienta tiene que ayudar a los astronautas a **evaluar su propia salud** (*"assess their own health"*, *"spotting these changes in themselves"*) y *"no asumir que los astronautas saben todo"* sobre cómo evaluarse.

## Decisión

- El actor principal es **el astronauta que se autoevalúa**. Los casos de uso CU-01 a CU-07 se escriben desde su punto de vista.
- La **vista de tripulación** se mantiene como funcionalidad **secundaria**: es útil cuando un compañero no puede usar la app (el enunciado menciona pedir atención a la tripulación), pero no guía el diseño.
- Las alertas se redactan como **instrucciones para quien las lee** ("repite la medición", "ve al refugio", "avisa a los médicos de vuelo"), con guía de cómo medir.

## Consecuencias

- Queda trabajo de UI para reencuadrar textos y navegación al astronauta: hoy la primera pantalla resume la tripulación.
- El modelo de datos no cambia: ya existe un agregado por astronauta.
- La gravedad sigue siendo global ([ADR-0002](0002-umbrales-dependientes-de-gravedad.md)), coherente con un solo actor en un solo hábitat.
