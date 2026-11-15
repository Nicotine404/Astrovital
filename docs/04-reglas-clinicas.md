# Reglas clínicas

Todas las reglas viven en un único lugar: `ClinicalRulesService` ([`clinical-rules.domain-service.ts`](../src/features/health-monitoring/domain/services/clinical-rules.domain-service.ts)). Ninguna otra parte del sistema define umbrales médicos.

> ⚠️ **Aproximaciones para la demo, no validadas clínicamente.** Los órdenes de magnitud siguen la literatura del HRP de NASA (ver [visión](01-vision-alcance.md#recursos-utilizados)), pero las fórmulas lineales y los cortes exactos son decisiones de diseño del equipo ([ADR-0002](adr/0002-umbrales-dependientes-de-gravedad.md)).

## Semáforo

Cada indicador se clasifica en **NOMINAL**, **PRECAUCIÓN** (`WARNING`) o **CRÍTICO**. Un grupo (zona, sistema, astronauta) toma **el peor estado** de sus partes.

El **índice de salud** (0–100) parte de 100 y resta 9 por cada sistema en crítico y 3 por cada uno en precaución, más 5 / 1,5 por cada estructura anatómica en crítico / precaución.

## Umbrales que dependen de la gravedad

Se define la **descarga** `u = 1 − g`: la fracción del peso terrestre que el esqueleto y el sistema cardiovascular dejan de recibir.

| Indicador | Fórmula | 0 g (ISS) | 0.16 g (Luna) | 0.38 g (Marte) | 1 g (Tierra) |
|---|---|---|---|---|---|
| Sistólica · precaución | `140 − 10·u` | 130 | 132 | 134 | 140 mmHg |
| Sistólica · crítico | precaución + 20 | 150 | 152 | 154 | 160 mmHg |
| PIC · precaución | `15 + 5·g` | 15 | 15,8 | 16,9 | 20 mmHg |
| PIC · crítico | precaución + 4 | 19 | 19,8 | 20,9 | 24 mmHg |
| Pérdida ósea esperada | `1,5·u` | 1,5 | 1,26 | 0,93 | 0 %/mes |
| Fluid shift esperado (± 6) | `24·u` | 24 | 20 | 15 | 0 mmHg |
| Elongación espinal esperada | `4,5·u` | 4,5 | 3,8 | 2,8 | 0 cm |
| **Rutina de ejercicio** | suma de bloques | **150** | **120** | **90** | **60 min** |

**Por qué:** en gravedad reducida los fluidos suben a la cabeza, así que la presión en la parte alta del cuerpo y la PIC se vigilan antes (umbrales más bajos), y el riesgo de SANS crece. El esqueleto deja de cargar peso, así que la pérdida ósea esperada y el ejercicio necesario crecen con `u`.

### Rutina de contramedidas por entorno

| Entorno | Bloques |
|---|---|
| 0 g | Resistencia ARED 60 · Cinta T2 con arnés 45 · Cicloergómetro CEVIS 45 |
| Luna | Resistencia ARED 50 · Cinta con arnés 40 · Cicloergómetro 30 |
| Marte | Resistencia con carga 45 · Carrera en el hábitat 30 · Cicloergómetro 15 |
| Tierra | Reacondicionamiento post-vuelo 30 · Caminata 30 |

Referencia: en la ISS se dedican unas 2,5 h diarias al ejercicio con ARED, la cinta T2 y CEVIS.

## Signos vitales (CU-02)

| Indicador | Precaución | Crítico |
|---|---|---|
| Frecuencia cardíaca | ≥ 100 o ≤ 45 lpm | ≥ 120 o ≤ 38 lpm |
| Presión sistólica | ≥ umbral del entorno o ≤ 90 | ≥ umbral crítico o ≤ 80 mmHg |
| Presión diastólica | ≥ 90 mmHg | ≥ 110 mmHg |
| SpO₂ | ≤ 94,9 % | ≤ 89,9 % |
| Frecuencia respiratoria | ≥ 24 o ≤ 9 rpm | ≥ 30 o ≤ 6 rpm |
| Temperatura central | ≥ 37,8 o ≤ 35,5 °C | ≥ 39 o ≤ 35 °C |
| Glucosa | ≥ 140 o ≤ 70 mg/dL | ≥ 250 o ≤ 54 mg/dL |
| PIC | ≥ umbral del entorno | ≥ umbral crítico |

Además, al registrar se rechazan los **valores fisiológicamente imposibles** (por ejemplo, frecuencia cardíaca fuera de 20–240) y una diastólica ≥ sistólica.

## Musculoesquelético y fluidos (CU-05)

| Indicador | Precaución | Crítico |
|---|---|---|
| Densidad ósea proyectada a 30 días (actual − pérdida esperada) | ≤ −1,5 % | ≤ −3 % |
| Fluid shift: desviación respecto al esperado | > 6 mmHg | ≥ 12 mmHg |
| Ejercicio: minutos hechos / minutos esperados a esta hora | ≤ 60 % | ≤ 25 % |
| Visión borrosa (0–3) | ≥ 1 | 3, o ≥ 2 con fluid shift fuera de rango |
| Mareo / desequilibrio (0–3) | ≥ 2 | 3 |

- El ejercicio solo se evalúa cuando `u > 0`.
- El mareo leve (1) es esperable al adaptarse a una gravedad nueva y no alerta.
- La visión afecta a los **ojos** y el mareo al **cerebro**; los dos suben la zona **Neurológica**.

## Radiación (CU-03)

| Indicador | Precaución | Crítico |
|---|---|---|
| Tasa de dosis | ≥ 1 mSv/día | ≥ 5 mSv/día |
| Flujo de neutrones (CANS) | ≥ 2,5 n·cm⁻²·s⁻¹ | ≥ 8 n·cm⁻²·s⁻¹ |
| Dosis acumulada / límite de carrera (600 mSv) | ≥ 50 % | ≥ 80 % |

- **Refugio obligatorio** si la tasa o el flujo están en crítico, o si la lectura es de un SPE con tasa fuera de nominal.
- **Chequeo inmunológico** (hemograma y linfocitos) si hay refugio o si la dosis acumulada está en crítico. En ese caso la zona **Inmune** sube al menos a precaución.
- Dosis de cada lectura = tasa × horas / 24. Fracción por neutrones = `min(0,6; 0,04 × flujo)` (modelo simplificado).

## Salud mental (CU-06)

| Indicador (último check-in del día) | Precaución | Crítico |
|---|---|---|
| Sueño | < 6 h | ≤ 4,5 h |
| Estrés (1–10) | ≥ 7 | ≥ 9 |
| Ánimo (1–10) | ≤ 4 | ≤ 2 |
| **Tendencia:** días seguidos con sueño < 6 h, ánimo ≤ 4 o estrés ≥ 8 | ≥ 3 días | ≥ 5 días |

Con varios check-ins en el mismo día (UTC), cuenta el último.

## Nutrición (CU-07)

| Nutriente | Objetivo diario | Límite superior |
|---|---|---|
| Energía | 2500 kcal | — |
| Agua | 2500 mL | — |
| Calcio | 1000 mg | 2000 mg (riesgo de litiasis renal) |
| Vitamina D | 800 UI | 4000 UI |
| Proteínas | 100 g | — |

La ingesta se compara con el **ritmo del día**, no con el total: `avance / ritmo`, donde `ritmo` es la fracción transcurrida de la jornada de vigilia (07:00–23:00 UTC, mínimo 0,1). Precaución si `avance / ritmo ≤ 0,6`; crítico si `≤ 0,3`. Superar un límite superior da precaución.

## Zonas del cuerpo

| Zona | Toma el peor estado de |
|---|---|
| Cardiopulmonar | Corazón, vasos, pulmones · frecuencia cardíaca, presión, SpO₂ |
| Neurológico | Cerebro, ojos · PIC, visión, mareo |
| Inmune y metabólico | Páncreas y estructuras de la zona · glucosa, temperatura, chequeo inmune pendiente |
| Músculo-esquelético | Fémur, pelvis, tibia, calcáneo · densidad ósea, fluid shift, ejercicio, síntomas |
