import type {
  ClinicalFile,
  CrewMember,
  Diagnosis,
  DosePoint,
  EclssReading,
  MedkitItem,
  MissionEnvironment,
  OrganAssessment,
  OrganId,
  OrganInfo,
} from "./types";

export const MISSION = {
  name: "Ares Transit IV",
  sol: 284,
  missionDay: 412,
  utc: "09:42",
};

export const ENVIRONMENTS: MissionEnvironment[] = [
  { id: "transit", name: "Nave de tránsito", short: "Tránsito", gravity: 0.38, earthDelay: "14m 22s", link: "DSN · Canberra" },
  { id: "orbital", name: "Estación orbital", short: "Orbital", gravity: 0, earthDelay: "13m 48s", link: "Relay Phobos" },
  { id: "rover", name: "Rover presurizado", short: "Rover", gravity: 0.38, earthDelay: "14m 55s", link: "UHF · Relay orbital" },
  { id: "base", name: "Base de superficie", short: "Base", gravity: 0.38, earthDelay: "14m 10s", link: "DSN directo" },
];

export const ORGANS: OrganInfo[] = [
  { id: "brain", name: "Cerebro / SANS", system: "Neuro-ocular", anchor: [0, 1.662, 0.005] },
  { id: "inner-ear", name: "Oído interno", system: "Vestibular", anchor: [0.068, 1.622, 0.0] },
  { id: "thyroid", name: "Tiroides", system: "Endocrino", anchor: [0, 1.462, 0.03] },
  { id: "lungs", name: "Pulmones", system: "Respiratorio", anchor: [-0.072, 1.31, 0.03] },
  { id: "heart", name: "Corazón", system: "Cardiovascular", anchor: [0.028, 1.265, 0.06] },
  { id: "liver", name: "Hígado", system: "Hepático", anchor: [-0.05, 1.175, 0.05] },
  { id: "stomach", name: "Estómago", system: "Digestivo", anchor: [0.06, 1.16, 0.055] },
  { id: "kidneys", name: "Riñones", system: "Renal", anchor: [0.054, 1.085, -0.05] },
  { id: "intestine", name: "Microbioma", system: "Gastrointestinal", anchor: [0, 1.0, 0.06] },
  { id: "wrist", name: "Sensor de muñeca", system: "Telemetría SUIT", anchor: [0.425, 1.125, 0.115] },
  { id: "femur", name: "Fémur", system: "Músculo-esquelético", anchor: [0.126, 0.68, -0.008] },
  { id: "calcaneus", name: "Calcáneo", system: "Fluid shift podálico", anchor: [0.226, 0.035, -0.062] },
];

export const ORGAN_BY_ID = Object.fromEntries(ORGANS.map((o) => [o.id, o])) as Record<OrganId, OrganInfo>;

const BASELINE: Record<OrganId, OrganAssessment> = {
  brain: {
    organId: "brain",
    status: "nominal",
    title: "Presión neuro-ocular estable",
    summary:
      "Sin signos de edema papilar. El desplazamiento cefálico de fluidos se mantiene compensado y la vaina del nervio óptico no muestra congestión.",
    metrics: [
      { label: "Edema de disco", value: "+2", unit: "µm", hint: "OCT macular" },
      { label: "Agudeza visual", value: "20/20", hint: "Snellen cabina" },
      { label: "PIC estimada", value: "13.2", unit: "mmHg", hint: "No invasiva" },
    ],
    action: "Programar OCT de control",
  },
  "inner-ear": {
    organId: "inner-ear",
    status: "nominal",
    title: "Sistema vestibular habituado",
    summary:
      "Desacoplamiento otolítico compensado tras el periodo de habituación. Sin nistagmo espontáneo reportado en los últimos 7 soles.",
    metrics: [
      { label: "Nistagmo", value: "0.1", unit: "°/s" },
      { label: "Romberg", value: "Normal" },
      { label: "Mareo (MSSQ)", value: "4", unit: "/30" },
    ],
    action: "Calibrar prueba de nistagmo",
  },
  thyroid: {
    organId: "thyroid",
    status: "nominal",
    title: "Homeostasis metabólica",
    summary:
      "TSH y T4 libre balanceadas. Tasa metabólica basal ajustada al gasto muscular reducido en gravedad parcial.",
    metrics: [
      { label: "TSH", value: "1.8", unit: "mUI/L" },
      { label: "T4 libre", value: "1.2", unit: "ng/dL" },
      { label: "TMB", value: "1680", unit: "kcal" },
    ],
    action: "Analizar perfil hormonal",
  },
  lungs: {
    organId: "lungs",
    status: "nominal",
    title: "Intercambio gaseoso óptimo",
    summary:
      "Relación ventilación-perfusión homogénea, sin zonas de atelectasia dependientes de la gravedad. Saturación tisular estable.",
    metrics: [
      { label: "SpO₂", value: "98.4", unit: "%" },
      { label: "Frec. resp.", value: "14", unit: "rpm" },
      { label: "EtCO₂", value: "38", unit: "mmHg" },
    ],
    action: "Espirometría rápida",
  },
  heart: {
    organId: "heart",
    status: "nominal",
    title: "Ritmo sinusal, gasto conservado",
    summary:
      "Leve reducción adaptativa de masa ventricular izquierda por descarga hidrostática. Sin arritmias ventriculares en las últimas 72 h.",
    metrics: [
      { label: "Frec. cardíaca", value: "64", unit: "lpm" },
      { label: "Fracción eyección", value: "62", unit: "%" },
      { label: "Gasto cardíaco", value: "4.8", unit: "L/min" },
    ],
    action: "Sincronizar ECG de 12 derivaciones",
  },
  liver: {
    organId: "liver",
    status: "nominal",
    title: "Función hepática normal",
    summary:
      "Metabolismo CYP450 dentro de rango. Transaminasas normales, sin toxicidad farmacológica acumulada.",
    metrics: [
      { label: "ALT", value: "24", unit: "U/L" },
      { label: "AST", value: "21", unit: "U/L" },
      { label: "Bilirrubina", value: "0.8", unit: "mg/dL" },
    ],
    action: "Revisar farmacocinética",
  },
  stomach: {
    organId: "stomach",
    status: "nominal",
    title: "Motilidad gástrica regular",
    summary: "Vaciamiento gástrico dentro de lo esperado para gravedad parcial. Sin reflujo sintomático.",
    metrics: [
      { label: "Vaciamiento", value: "92", unit: "min" },
      { label: "pH", value: "2.1" },
      { label: "Náusea", value: "0", unit: "/10" },
    ],
    action: "Registrar ingesta",
  },
  kidneys: {
    organId: "kidneys",
    status: "nominal",
    title: "Balance hídrico estable",
    summary:
      "Hipercalciuria leve secundaria a resorción ósea, controlada con hidratación alcalinizante. Filtrado glomerular conservado.",
    metrics: [
      { label: "eGFR", value: "105", unit: "mL/min" },
      { label: "pH urinario", value: "6.8" },
      { label: "Densidad", value: "1.018" },
    ],
    action: "Monitorizar balance hídrico",
  },
  intestine: {
    organId: "intestine",
    status: "nominal",
    title: "Microbioma equilibrado",
    summary: "Tránsito colónico preservado con dieta de fibra formulada. Sin disbiosis significativa en la última muestra.",
    metrics: [
      { label: "Diversidad", value: "3.9", unit: "H′" },
      { label: "Carga bact.", value: "8.4", unit: "×10⁹" },
      { label: "Absorción", value: "97", unit: "%" },
    ],
    action: "Registrar absorción nutricional",
  },
  wrist: {
    organId: "wrist",
    status: "nominal",
    title: "Enlace UWB activo",
    summary:
      "Enlace de baja latencia a 120 Hz con el traje. Respuesta galvánica de piel y temperatura periférica en rango.",
    metrics: [
      { label: "Temp. piel", value: "34.2", unit: "°C" },
      { label: "Muestreo", value: "120", unit: "Hz" },
      { label: "GSR", value: "0.4", unit: "kΩ" },
    ],
    action: "Recalibrar biomapeo del traje",
  },
  femur: {
    organId: "femur",
    status: "caution",
    title: "Vigilancia de resorción ósea",
    summary:
      "Desmineralización trabecular de fémur proximal de −1.2 %, dentro del margen tolerado. Se recomienda carga resistiva diaria.",
    metrics: [
      { label: "Δ densidad", value: "−1.2", unit: "%" },
      { label: "T-score", value: "−0.4" },
      { label: "DMO", value: "0.96", unit: "g/cm²" },
    ],
    action: "Programar sesión de carga",
  },
  calcaneus: {
    organId: "calcaneus",
    status: "nominal",
    title: "Contramedidas de fluid shift listas",
    summary:
      "Reducción de volumen tisular en pantorrillas por desplazamiento cefálico. Thigh cuffs y LBNP disponibles para restablecer el gradiente.",
    metrics: [
      { label: "LBNP", value: "−35", unit: "mmHg" },
      { label: "Perím. gemelo", value: "32.4", unit: "cm" },
      { label: "Adherencia", value: "98", unit: "%" },
    ],
    action: "Activar thigh cuffs",
  },
};

function assessments(overrides: Partial<Record<OrganId, Partial<OrganAssessment>>> = {}) {
  const out = {} as Record<OrganId, OrganAssessment>;
  for (const id of Object.keys(BASELINE) as OrganId[]) {
    out[id] = { ...BASELINE[id], ...(overrides[id] ?? {}) } as OrganAssessment;
  }
  return out;
}

export const CREW: CrewMember[] = [
  {
    id: "rostova",
    name: "Cdr. Elena Rostova",
    shortName: "E. Rostova",
    initials: "ER",
    role: "Comandante de misión",
    suitId: "SUIT-01",
    bloodType: "A+",
    status: "caution",
    healthIndex: 94.2,
    heightCm: 172,
    focusOrgan: "brain",
    note: "Protocolo LBNP recomendado",
    vitals: {
      heartRate: 64,
      systolic: 118,
      diastolic: 74,
      spo2: 98.4,
      cardiacOutput: 4.8,
      boneDensityDelta: -1.2,
      radiationMSv: 142,
      icp: 19.5,
      respRate: 14,
      skinTemp: 34.2,
    },
    assessments: assessments({
      brain: {
        status: "caution",
        title: "SANS grado 1 en curso",
        summary:
          "El desplazamiento cefálico continuo de fluidos genera estasis venosa yugular, aplanamiento del polo posterior del globo ocular y edema papilar leve.",
        metrics: [
          { label: "Edema de disco", value: "+12", unit: "µm", hint: "OCT macular" },
          { label: "Agudeza visual", value: "20/25", hint: "Snellen cabina" },
          { label: "PIC estimada", value: "19.5", unit: "mmHg", hint: "No invasiva" },
        ],
        action: "Iniciar protocolo LBNP",
      },
    }),
  },
  {
    id: "thorne",
    name: "Marcus Thorne",
    shortName: "M. Thorne",
    initials: "MT",
    role: "Piloto de tránsito",
    suitId: "SUIT-02",
    bloodType: "O−",
    status: "nominal",
    healthIndex: 99.1,
    heightCm: 184,
    focusOrgan: "heart",
    note: "Estabilidad cognitiva 99 %",
    vitals: {
      heartRate: 58,
      systolic: 122,
      diastolic: 78,
      spo2: 99.0,
      cardiacOutput: 5.1,
      boneDensityDelta: -0.6,
      radiationMSv: 138,
      icp: 13.2,
      respRate: 12,
      skinTemp: 33.9,
    },
    assessments: assessments({
      heart: {
        title: "Alta tolerancia hemodinámica",
        summary:
          "Bradicardia de origen deportivo. Función microvascular estable sin fatiga miocárdica ni desaturación en aceleraciones transitorias.",
        metrics: [
          { label: "Frec. cardíaca", value: "58", unit: "lpm" },
          { label: "Fracción eyección", value: "65", unit: "%" },
          { label: "Gasto cardíaco", value: "5.1", unit: "L/min" },
        ],
        action: "Calibrar perfil G-load",
      },
      femur: { status: "nominal", metrics: [{ label: "Δ densidad", value: "−0.6", unit: "%" }, { label: "T-score", value: "0.1" }, { label: "DMO", value: "1.02", unit: "g/cm²" }] },
    }),
  },
  {
    id: "khan",
    name: "Dra. Aisha Khan",
    shortName: "A. Khan",
    initials: "AK",
    role: "Oficial médico",
    suitId: "SUIT-03",
    bloodType: "B+",
    status: "nominal",
    healthIndex: 97.8,
    heightCm: 165,
    focusOrgan: "thyroid",
    note: "Ritmo circadiano estable",
    vitals: {
      heartRate: 71,
      systolic: 115,
      diastolic: 72,
      spo2: 98.2,
      cardiacOutput: 4.6,
      boneDensityDelta: -0.9,
      radiationMSv: 140,
      icp: 14.1,
      respRate: 15,
      skinTemp: 34.5,
    },
    assessments: assessments({
      thyroid: {
        title: "Vigilancia metabólica y circadiana",
        summary:
          "Patrón de sueño estable en cabina 03. Sin desajuste de cortisol salival ni estrés neurosensorial en el sol 284.",
        metrics: [
          { label: "TSH", value: "2.1", unit: "mUI/L" },
          { label: "Cortisol", value: "11.4", unit: "nmol/L" },
          { label: "Sueño", value: "7.2", unit: "h" },
        ],
        action: "Registrar análisis biomédico",
      },
      femur: { status: "nominal", metrics: [{ label: "Δ densidad", value: "−0.9", unit: "%" }, { label: "T-score", value: "−0.2" }, { label: "DMO", value: "0.98", unit: "g/cm²" }] },
    }),
  },
  {
    id: "lee",
    name: "Kenji Lee",
    shortName: "K. Lee",
    initials: "KL",
    role: "Ingeniero de sistemas",
    suitId: "SUIT-04",
    bloodType: "AB+",
    status: "nominal",
    healthIndex: 98.9,
    heightCm: 178,
    focusOrgan: "femur",
    note: "Fatiga circadiana baja",
    vitals: {
      heartRate: 62,
      systolic: 120,
      diastolic: 75,
      spo2: 98.8,
      cardiacOutput: 4.9,
      boneDensityDelta: -0.4,
      radiationMSv: 145,
      icp: 12.8,
      respRate: 13,
      skinTemp: 34.0,
    },
    assessments: assessments({
      femur: {
        status: "nominal",
        title: "Densidad ósea preservada",
        summary:
          "Carga resistiva cumplida al 100 %. Calcificación dentro de parámetros óptimos, sin signos de osteopenia aguda.",
        metrics: [
          { label: "Δ densidad", value: "−0.4", unit: "%" },
          { label: "T-score", value: "0.3" },
          { label: "DMO", value: "1.05", unit: "g/cm²" },
        ],
        action: "Protocolo de descarga muscular",
      },
    }),
  },
];

export const CLINICAL_FILES: ClinicalFile[] = [
  {
    id: "f1",
    name: "ECG_Holter_S284.pdf",
    kind: "pdf",
    sizeMB: 1.4,
    capturedAt: "06:15",
    crewId: "rostova",
    findings:
      "Holter 24 h sin alteraciones del segmento ST ni arritmias ventriculares. PR 148 ms, QRS 82 ms, QTc 410 ms.",
    confidence: 99.2,
    model: "OCR + extracción clínica",
    latencyMs: 18,
  },
  {
    id: "f2",
    name: "Fonocardio_Rostova.wav",
    kind: "audio",
    sizeMB: 3.8,
    capturedAt: "07:40",
    crewId: "rostova",
    findings:
      "R1 y R2 rítmicos de intensidad normal. Sin soplos, chasquidos ni tercer ruido. Variabilidad RR compatible con descondicionamiento.",
    confidence: 98.7,
    model: "CNN espectral",
    latencyMs: 9,
  },
  {
    id: "f3",
    name: "Eco_Apical_4C.mp4",
    kind: "video",
    sizeMB: 18.2,
    capturedAt: "08:30",
    crewId: "rostova",
    findings:
      "Ventana apical 4 cámaras: FEVI 62 %, sin derrame pericárdico. Remodelado esférico leve típico de microgravedad.",
    confidence: 96.9,
    model: "Segmentación endocárdica",
    latencyMs: 41,
  },
  {
    id: "f4",
    name: "OCT_Retina_OD.dcm",
    kind: "dicom",
    sizeMB: 24.6,
    capturedAt: "09:12",
    crewId: "rostova",
    findings:
      "Engrosamiento de la capa de fibras nerviosas +12 µm y micro-pliegues coroideos leves, compatibles con SANS grado 1.",
    confidence: 97.4,
    model: "Reconstrucción volumétrica",
    latencyMs: 22,
  },
];

export const DIAGNOSES: Diagnosis[] = [
  {
    id: "d1",
    crewId: "rostova",
    title: "Síndrome neuro-ocular asociado al vuelo (SANS)",
    status: "caution",
    probability: 94.6,
    summary:
      "Desplazamiento cefálico de fluidos con alteración morfológica del nervio óptico, correlacionado entre OCT, PIC estimada y agudeza visual.",
    evidence: [
      { label: "OCT retinal", value: "Edema +12 µm" },
      { label: "PIC estimada", value: "19.5 mmHg" },
      { label: "Agudeza visual", value: "20/25" },
    ],
    recommendation: "LBNP −35 mmHg durante 45 min, dos sesiones diarias. Repetir OCT en 72 h.",
    differentials: [
      { label: "SANS grado 1", probability: 94.6 },
      { label: "Hipertensión intracraneal idiopática", probability: 3.1 },
      { label: "Papiledema por hipercapnia", probability: 2.3 },
    ],
  },
  {
    id: "d2",
    crewId: "rostova",
    title: "Adaptación cardiovascular a gravedad parcial",
    status: "nominal",
    probability: 98.1,
    summary:
      "Remodelado adaptativo sin hipertrofia patológica ni taponamiento. ECG derivación II sin alteración del segmento ST.",
    evidence: [
      { label: "FEVI", value: "62 %" },
      { label: "Gasto cardíaco", value: "4.8 L/min" },
      { label: "Arritmias 72 h", value: "0 eventos" },
    ],
    recommendation: "Mantener ejercicio aeróbico de 30 min diarios. Sin intervención necesaria.",
    differentials: [
      { label: "Adaptación fisiológica", probability: 98.1 },
      { label: "Miocardiopatía incipiente", probability: 1.2 },
      { label: "Derrame pericárdico", probability: 0.7 },
    ],
  },
  {
    id: "d3",
    crewId: "rostova",
    title: "Pérdida de densidad ósea trabecular",
    status: "caution",
    probability: 88.3,
    summary: "Resorción proximal de fémur −1.2 % acumulada desde el lanzamiento, dentro del margen tolerado por protocolo.",
    evidence: [
      { label: "DMO fémur", value: "0.96 g/cm²" },
      { label: "Calciuria", value: "Elevada leve" },
      { label: "Adherencia ARED", value: "92 %" },
    ],
    recommendation: "Aumentar carga resistiva a 6 sesiones semanales y revisar aporte de vitamina D.",
    differentials: [
      { label: "Desuso por gravedad parcial", probability: 88.3 },
      { label: "Déficit de vitamina D", probability: 9.4 },
      { label: "Hiperparatiroidismo", probability: 2.3 },
    ],
  },
];

export const MEDKIT: MedkitItem[] = [
  { id: "m1", locker: "A-1", name: "Ácido acetilsalicílico 300 mg", category: "Cardiovascular", stock: 48, capacity: 60, unit: "dosis", expires: "Sol 910", note: "Liberación por UWB" },
  { id: "m2", locker: "A-2", name: "Oxígeno médico 100 %", category: "Respiratorio", stock: 280, capacity: 300, unit: "bar", expires: "—", note: "Regulador 15 L/min" },
  { id: "m3", locker: "A-3", name: "Epinefrina autoinyectable", category: "Emergencia", stock: 6, capacity: 8, unit: "uds", expires: "Sol 640", note: "Anafilaxia" },
  { id: "m4", locker: "B-1", name: "Prometazina 25 mg", category: "Vestibular", stock: 12, capacity: 40, unit: "dosis", expires: "Sol 520", note: "Stock bajo" },
  { id: "m5", locker: "B-2", name: "Citrato potásico", category: "Renal", stock: 84, capacity: 120, unit: "dosis", expires: "Sol 1020", note: "Profilaxis litiasis" },
  { id: "m6", locker: "B-4", name: "Dispositivo LBNP", category: "Contramedida", stock: 1, capacity: 1, unit: "ud", expires: "—", note: "Calibrado a −35 mmHg" },
  { id: "m7", locker: "C-1", name: "Sutura absorbible 4-0", category: "Cirugía menor", stock: 18, capacity: 24, unit: "uds", expires: "Sol 1400", note: "" },
  { id: "m8", locker: "C-3", name: "Ecógrafo portátil", category: "Diagnóstico", stock: 1, capacity: 1, unit: "ud", expires: "—", note: "Sonda sectorial 2–5 MHz" },
];

export const DOSE_HISTORY: DosePoint[] = Array.from({ length: 29 }, (_, i) => {
  const sol = i * 10;
  const spike = sol === 150 ? 2.4 : 0;
  const daily = 0.41 + Math.sin(i * 0.7) * 0.04 + spike;
  return { sol, daily: Number(daily.toFixed(2)), cumulative: 0 };
}).map((p, i, arr) => {
  const cumulative = arr.slice(0, i + 1).reduce((s, x) => s + x.daily * 10, 0);
  return { ...p, cumulative: Number(cumulative.toFixed(1)) };
});

export const ECLSS: EclssReading[] = [
  { id: "pressure", label: "Presión de cabina", value: 101.3, unit: "kPa", min: 90, max: 110, nominalLow: 97, nominalHigh: 103, note: "Equivalente a nivel del mar", history: [101.2, 101.3, 101.3, 101.4, 101.3, 101.2, 101.3, 101.3, 101.4, 101.3, 101.3, 101.3] },
  { id: "o2", label: "Oxígeno (pO₂)", value: 20.9, unit: "%", min: 17, max: 25, nominalLow: 19.5, nominalHigh: 23.5, note: "Mezcla N₂/O₂ balanceada", history: [20.8, 20.9, 21.0, 20.9, 20.9, 20.8, 20.9, 21.0, 20.9, 20.9, 20.8, 20.9] },
  { id: "co2", label: "Dióxido de carbono (pCO₂)", value: 2.1, unit: "mmHg", min: 0, max: 8, nominalLow: 0, nominalHigh: 4, note: "Depurador de aminas activo", history: [2.4, 2.3, 2.2, 2.3, 2.1, 2.0, 2.2, 2.3, 2.2, 2.1, 2.1, 2.1] },
  { id: "temp", label: "Temperatura", value: 21.4, unit: "°C", min: 15, max: 30, nominalLow: 18, nominalHigh: 27, note: "Lazo térmico activo", history: [21.1, 21.2, 21.4, 21.5, 21.4, 21.3, 21.4, 21.5, 21.4, 21.3, 21.4, 21.4] },
  { id: "rh", label: "Humedad relativa", value: 44, unit: "%", min: 0, max: 100, nominalLow: 25, nominalHigh: 70, note: "Condensador CHX nominal", history: [45, 44, 44, 43, 44, 45, 44, 44, 43, 44, 44, 44] },
  { id: "h2o", label: "Recuperación de agua", value: 93.8, unit: "%", min: 70, max: 100, nominalLow: 90, nominalHigh: 100, note: "WRS · ciclo 41", history: [93.2, 93.4, 93.5, 93.6, 93.7, 93.6, 93.8, 93.9, 93.8, 93.7, 93.8, 93.8] },
];
