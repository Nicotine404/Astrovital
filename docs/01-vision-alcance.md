# Visión y alcance

## El desafío

AstroVital es la propuesta del equipo para el reto **"Create Health Monitoring Software for Astronauts on Space Missions"** de la **NASA Space Apps Challenge 2026**, desarrollada en una hackathon de 2 días.

El enunciado oficial pide *una herramienta visual que ayude a los astronautas a evaluar su propia salud durante misiones espaciales y que oriente sobre tratamientos y mejoras de salud*.

## El problema

En misiones largas (Luna, Marte) la tripulación está expuesta a los **cinco peligros** que mapea el Human Research Program de NASA:

| Peligro | Efecto en la salud | Dónde lo cubre AstroVital |
|---|---|---|
| Radiación espacial | Cáncer, daño celular, inmunodepresión | CU-03 Radiación CANS |
| Aislamiento y confinamiento | Estrés, mal sueño, ánimo bajo | CU-06 Salud mental |
| Distancia de la Tierra | Sin evacuación ni consulta inmediata (retardo de comunicación) | Evaluación autónoma en el dispositivo |
| Campos de gravedad alterados | Pérdida ósea y muscular, desplazamiento de fluidos, SANS | CU-04 Gravedad, CU-05 Musculoesquelético |
| Entorno cerrado y hostil | Cambios inmunes, nutrición insuficiente | CU-07 Nutrición, CU-02 Signos vitales |

El astronauta **no es médico**: necesita saber qué medir, cómo medirlo, qué significa el resultado y qué hacer.

## La solución

Un panel de salud que:

1. **Recoge indicadores** (presión, frecuencia cardíaca, glucosa, temperatura, sueño, ánimo, radiación, nutrición, ejercicio, síntomas) por entrada manual, sensores (simulados) o imágenes.
2. **Los evalúa con reglas clínicas que cambian según la gravedad** del entorno (0 g, Luna, Marte, Tierra).
3. **Los muestra con semáforo y gráficas**: un gemelo digital 3D del cuerpo donde cada zona se puede clicar, tendencias de 28 días y tarjetas por sistema.
4. **Dice qué hacer**: alertas con acción concreta (refugio, chequeo inmune, rutina de ejercicio, repetir la medición, avisar a los médicos de vuelo).

## Actor

**El astronauta**, que evalúa su propia salud. Ver [ADR-0004](adr/0004-actor-del-sistema.md).

## Alcance

**Dentro del alcance** (ver [casos de uso](02-casos-de-uso.md)):

- CU-01 Visualizar estado anatómico y evolución biométrica
- CU-02 Consultar y registrar signos vitales
- CU-03 Consultar y simular exposición a radiación (CANS)
- CU-04 Gestionar el entorno gravitacional
- CU-05 Gestionar control musculoesquelético y de fluidos
- CU-06 Gestionar salud mental y sueño
- CU-07 Gestionar ingesta nutricional

**Extras implementados, fuera de los CU** (aportan a la demo):

- Diagnóstico asistido por IA sobre archivos clínicos (imágenes, audio, PDF): **simulado**.
- Botiquín y soporte vital de cabina (ECLSS): datos de demostración.
- Vista de tripulación (varios astronautas).

**Fuera del alcance:**

- Integración con sensores o dispositivos reales.
- Uso clínico real: los umbrales son aproximaciones para la demo, **no están validados clínicamente**.
- Autenticación de usuarios.

## Supuestos

- Los datos de telemetría son **sintéticos** (seeds deterministas), con rangos plausibles.
- Sin variables de entorno de Supabase, la app funciona igual con adaptadores en memoria ([ADR-0003](adr/0003-datos-simulados-y-modo-sin-backend.md)).
- La jornada de vigilia es de 07:00 a 23:00 UTC (hora de misión): la nutrición y el ejercicio se evalúan contra el ritmo del día.

## Recursos utilizados

| Recurso | Fuente | Uso en AstroVital |
|---|---|---|
| 5 Hazards of Human Spaceflight · Risks of Human Spaceflight · Ongoing HRP Research | NASA | **Conceptual:** dominios clínicos, indicadores y riesgos |
| Monitoring radiation for astronaut health | Canadian Space Agency | **Conceptual:** detector de neutrones CANS (CU-03) |
| NASA-STD-3001 (límite de dosis de carrera de 600 mSv) | NASA | **Conceptual:** límite de radiación |
| **BodyParts3D** | Database Center for Life Science (DBCLS), licencia **CC BY-SA 2.1 JP** | **Uso directo:** modelo anatómico del gemelo digital 3D. Ver [`public/models/README.md`](../public/models/README.md) |
| About OSDR · NASA 3D Resources · NASA SVS · 3D Body Scanning · NIAC Spacesuit Digital Thread · 3D Bioprinting · VOKA · Sketchfab AVL | NASA y terceros | Referencia; **no se usan datos** de estas fuentes |

**No se usan datos reales de NASA**: las fuentes de NASA y de la CSA sirven como conocimiento de dominio. Para usar datos reales, el siguiente paso sería **OSDR** (Open Science Data Repository).

## Glosario

| Término | Significado |
|---|---|
| **ARED** | Advanced Resistive Exercise Device: máquina de resistencia de la ISS |
| **CANS** | Detector de neutrones usado para la dosimetría |
| **CEVIS** | Cicloergómetro de la ISS |
| **ECLSS** | Environmental Control and Life Support System: soporte vital de cabina |
| **EVA** | Actividad extravehicular (paseo espacial) |
| **Fluid shift** | Desplazamiento de fluidos hacia la cabeza en gravedad reducida |
| **GCR** | Galactic Cosmic Rays: radiación de fondo constante |
| **HRP** | Human Research Program de NASA |
| **LBNP** | Lower Body Negative Pressure: contramedida para el fluid shift |
| **PIC** | Presión intracraneal |
| **SANS** | Spaceflight Associated Neuro-ocular Syndrome: alteraciones visuales por el fluid shift |
| **SPE** | Solar Particle Event: tormenta solar, pico de radiación |
