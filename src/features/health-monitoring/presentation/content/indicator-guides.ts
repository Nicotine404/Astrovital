/**
 * Plain-language guides for each indicator: what it is, how to measure it on board, why it
 * matters in space and what to do when it is out of range. Astronauts are not clinicians.
 */
export interface IndicatorGuide {
  title: string;
  what: string;
  howTo: string;
  whySpace: string;
  actIf: string;
}

export type GuideId =
  | "heartRate"
  | "bloodPressure"
  | "spo2"
  | "cardiacOutput"
  | "intracranialPressure"
  | "temperature"
  | "glucose"
  | "boneFluids"
  | "symptoms"
  | "radiation"
  | "mental"
  | "nutrition";

export const INDICATOR_GUIDES: Record<GuideId, IndicatorGuide> = {
  heartRate: {
    title: "Frecuencia cardíaca",
    what: "Cuántas veces late tu corazón por minuto.",
    howTo: "Siéntate o fíjate al asiento 5 minutos. Cuenta el pulso en la muñeca durante 30 s y multiplica por 2, o lee el parche ECG.",
    whySpace: "Sin gravedad el corazón trabaja menos y se debilita; al volver a la gravedad puede acelerarse para compensar.",
    actIf: "Por encima de 100 o por debajo de 45 lpm en reposo: repite en 10 min. Si sigue igual o tienes mareo o dolor en el pecho, avisa a un compañero.",
  },
  bloodPressure: {
    title: "Presión arterial",
    what: "La fuerza de la sangre contra las arterias: sistólica (al latir) y diastólica (entre latidos).",
    howTo: "Manguito en el brazo izquierdo a la altura del corazón, sentado y sujeto. No hables ni te muevas durante la medición.",
    whySpace: "En gravedad reducida los fluidos suben a la cabeza, así que la presión en la parte alta del cuerpo sube. Por eso el umbral cambia según dónde estés.",
    actIf: "Por encima del umbral del entorno: repite en 30 min. En crítico, pide a un compañero que te la tome y envía la lectura a los médicos de vuelo.",
  },
  spo2: {
    title: "Saturación de oxígeno (SpO₂)",
    what: "El porcentaje de tu sangre que transporta oxígeno.",
    howTo: "Pulsioxímetro en el dedo índice, con la mano quieta y caliente. Espera a que el número se estabilice.",
    whySpace: "Una caída puede indicar un problema de la atmósfera de la cabina o de los pulmones.",
    actIf: "Por debajo del 95 %: revisa el soporte vital de la cabina y repite. Por debajo del 90 %: oxígeno suplementario y aviso inmediato.",
  },
  cardiacOutput: {
    title: "Gasto cardíaco",
    what: "Litros de sangre que bombea el corazón por minuto.",
    howTo: "Lectura del chaleco de bioimpedancia, en reposo.",
    whySpace: "Ayuda a ver si el corazón se está adaptando a la gravedad o perdiendo fuerza.",
    actIf: "Fuera de 4–8 L/min de forma sostenida: compártelo en el próximo reporte a los médicos de vuelo.",
  },
  intracranialPressure: {
    title: "Presión intracraneal (PIC)",
    what: "La presión del líquido dentro del cráneo. Aquí es una estimación no invasiva.",
    howTo: "Sensor ocular por ultrasonido del nervio óptico, con los ojos cerrados y quieto.",
    whySpace: "El desplazamiento de fluidos hacia la cabeza sube la PIC y puede causar SANS: cambios en el ojo y visión borrosa.",
    actIf: "Sobre el umbral: reporta tu visión. En crítico, prueba de agudeza visual y aviso a los médicos de vuelo. El protocolo LBNP ayuda a bajar los fluidos.",
  },
  temperature: {
    title: "Temperatura central",
    what: "La temperatura interna del cuerpo.",
    howTo: "Termómetro timpánico. Espera 15 minutos después de hacer ejercicio o comer.",
    whySpace: "En el espacio el sistema inmune se debilita; la fiebre puede ser la primera señal de una infección.",
    actIf: "Por encima de 37,8 °C: descansa, hidrátate y repite en 1 h. Por encima de 39 °C: avisa a un compañero.",
  },
  glucose: {
    title: "Glucosa en sangre",
    what: "La cantidad de azúcar en la sangre (mg/dL).",
    howTo: "Glucómetro capilar: lava y seca el dedo, punciona el lateral y usa la segunda gota. Anota si estás en ayunas.",
    whySpace: "La inactividad y el estrés del vuelo alteran cómo el cuerpo usa la insulina.",
    actIf: "Por debajo de 70: come algo con azúcar y repite en 15 min. Por encima de 140 en ayunas: repite y revisa tu dieta del día.",
  },
  boneFluids: {
    title: "Hueso, músculo y fluidos",
    what: "Cuánta masa ósea y muscular pierdes y cuánto líquido se desplaza hacia la cabeza.",
    howTo: "La densidad ósea y la masa muscular salen de escaneos periódicos. El desplazamiento de fluidos lo estima el traje.",
    whySpace: "Sin peso que cargar, el esqueleto pierde hasta un 1,5 % de masa al mes en órbita. El ejercicio diario es la principal defensa.",
    actIf: "Si la proyección baja del −1,5 %, cumple la rutina completa y revisa tu calcio y vitamina D.",
  },
  symptoms: {
    title: "Visión y equilibrio",
    what: "Síntomas que dan pistas del desplazamiento de fluidos (visión) y de la adaptación a la gravedad (equilibrio).",
    howTo: "Visión: lee una línea de texto a 40 cm tapando un ojo y luego el otro. Equilibrio: de pie, con los ojos cerrados, 30 s.",
    whySpace: "La visión borrosa puede ser SANS. El mareo es normal unos días al cambiar de gravedad, pero no debe empeorar.",
    actIf: "Visión moderada o severa: aviso a los médicos de vuelo. Mareo severo: no hagas EVA ni tareas en altura y pide ayuda.",
  },
  radiation: {
    title: "Radiación y neutrones (CANS)",
    what: "La dosis de radiación que recibes (mSv) y el flujo de neutrones que mide el detector CANS.",
    howTo: "El dosímetro del traje y el detector del hábitat miden solos. Revisa la tasa del día y tu dosis acumulada.",
    whySpace: "Fuera de la Tierra no hay atmósfera ni campo magnético que proteja. Una tormenta solar puede dar en horas la dosis de meses.",
    actIf: "Alerta de tormenta solar: ve al refugio de tu hábitat de inmediato. Al salir, chequeo inmunológico.",
  },
  mental: {
    title: "Sueño, estrés y ánimo",
    what: "Cómo duermes y cómo te sientes cada día.",
    howTo: "Responde el check-in una vez al día, a la misma hora, con sinceridad: es confidencial.",
    whySpace: "El aislamiento, el ruido y la luz artificial alteran el sueño, y el sueño malo afecta el ánimo y el rendimiento.",
    actIf: "Tres días seguidos durmiendo menos de 6 h o con ánimo bajo: ajusta horarios y luz. Cinco días: habla con el psicólogo de vuelo.",
  },
  nutrition: {
    title: "Nutrición e hidratación",
    what: "Lo que comes y bebes frente a lo que tu cuerpo necesita en el día.",
    howTo: "Registra cada comida y bebida con los botones rápidos en cuanto la consumas.",
    whySpace: "El calcio, la vitamina D y la proteína frenan la pérdida de hueso y músculo; el agua evita cálculos renales.",
    actIf: "Si una barra está en ámbar o rojo, vas atrasado para esta hora del día: consume lo que falte en la próxima comida.",
  },
};
