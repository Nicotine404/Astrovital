import type { AstronautTelemetry } from "../models/astronaut-telemetry.model";
import type { MentalCheckin } from "../models/mental-health.model";
import type { TelemetryEvaluation } from "./clinical-rules.domain-service";

export type MissionTaskId = "vitals" | "routine" | "checkin" | "water" | "protein";

export interface MissionTask {
  id: MissionTaskId;
  label: string;
  done: boolean;
  xp: number;
}

export interface Reminder {
  id: MissionTaskId;
  message: string;
  /** "now": behind schedule or overdue. "later": still on time. */
  urgency: "now" | "later";
}

export interface Badge {
  id: string;
  label: string;
  description: string;
  progress: number;
  goal: number;
  earned: boolean;
}

export interface DailyMission {
  tasks: MissionTask[];
  completed: number;
  xp: number;
  routineStreakDays: number;
  reminders: Reminder[];
  badges: Badge[];
}

export interface ExerciseDay {
  recordedAt: string;
  exerciseMinutes: number;
}

const TASK_XP = 20;
const ALL_DONE_BONUS = 50;
const VITALS_OVERDUE_HOURS = 6;

const day = (iso: string) => iso.slice(0, 10);

/** Consecutive days, counting back from the newest, that satisfy `ok`. */
function streak<T>(oldestFirst: readonly T[], ok: (x: T) => boolean): number {
  let n = 0;
  for (let i = oldestFirst.length - 1; i >= 0 && ok(oldestFirst[i]); i--) n++;
  return n;
}

function lastCheckinPerDay(history: readonly MentalCheckin[]): MentalCheckin[] {
  const byDay = new Map<string, MentalCheckin>();
  for (const c of [...history].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt))) byDay.set(day(c.recordedAt), c);
  return [...byDay.values()];
}

/**
 * Pure "mission of the day": the five daily health tasks, reminders for what is pending and
 * cooperative gamification (XP, streaks, badges). It never changes clinical status.
 */
export class DailyMissionService {
  build(t: AstronautTelemetry, ev: TelemetryEvaluation, now: Date, exerciseHistory: readonly ExerciseDay[]): DailyMission {
    const today = day(now.toISOString());
    const msk = ev.musculoskeletal;
    const minutes = t.musculoskeletal.exerciseMinutesToday;
    const hoursSinceVitals = (now.getTime() - new Date(t.vitals.recordedAt).getTime()) / 3_600_000;
    const checkins = lastCheckinPerDay(t.mentalCheckins);

    const tasks: MissionTask[] = [
      { id: "vitals", label: "Medir signos vitales", done: day(t.vitals.recordedAt) === today, xp: TASK_XP },
      { id: "routine", label: `Rutina de ejercicio (${msk.exerciseTargetMinutes} min)`, done: minutes >= msk.exerciseTargetMinutes, xp: TASK_XP },
      { id: "checkin", label: "Check-in de sueño y ánimo", done: checkins.at(-1) ? day(checkins.at(-1)!.recordedAt) === today : false, xp: TASK_XP },
      { id: "water", label: "Hidratación al ritmo del día", done: ev.nutrition.statuses.waterMl === "NOMINAL", xp: TASK_XP },
      { id: "protein", label: "Proteína al ritmo del día", done: ev.nutrition.statuses.proteinG === "NOMINAL", xp: TASK_XP },
    ];
    const completed = tasks.filter((x) => x.done).length;
    const xp = completed * TASK_XP + (completed === tasks.length ? ALL_DONE_BONUS : 0);

    const reminders: Reminder[] = [];
    if (hoursSinceVitals >= VITALS_OVERDUE_HOURS)
      reminders.push({ id: "vitals", urgency: "now", message: `Hace ${Math.floor(hoursSinceVitals)} h que no registras tus signos vitales: toma presión, pulso y glucosa.` });
    else if (!tasks[0].done) reminders.push({ id: "vitals", urgency: "later", message: "Registra tus signos vitales de hoy." });
    if (!tasks[1].done) {
      let left = minutes;
      const next = msk.routine.find((b) => (left -= b.minutes) < 0) ?? msk.routine.at(-1);
      if (next) reminders.push({ id: "routine", urgency: msk.exercise === "NOMINAL" ? "later" : "now", message: `Te toca: ${next.label} (${next.minutes} min). Llevas ${minutes} de ${msk.exerciseTargetMinutes} min.` });
    }
    if (!tasks[2].done) reminders.push({ id: "checkin", urgency: "later", message: "Haz tu check-in de sueño, estrés y ánimo de hoy." });
    if (!tasks[3].done) reminders.push({ id: "water", urgency: "now", message: `Bebe agua: llevas ${Math.round(t.nutrition.waterMl)} de 2500 mL.` });
    if (!tasks[4].done) reminders.push({ id: "protein", urgency: "later", message: `Te falta proteína: llevas ${Math.round(t.nutrition.proteinG)} de 100 g.` });
    reminders.sort((a, b) => (a.urgency === b.urgency ? 0 : a.urgency === "now" ? -1 : 1));

    // Past days come from the history; today counts once the routine is complete.
    const past = exerciseHistory.filter((d) => day(d.recordedAt) < today);
    const routineStreakDays = (tasks[1].done ? 1 : 0) + streak(past, (d) => d.exerciseMinutes >= msk.exerciseTargetMinutes);
    const sleepStreak = streak(checkins, (c) => c.sleepHours >= 7);
    const checkinDays = checkins.length;

    const badge = (id: string, label: string, description: string, progress: number, goal: number): Badge => ({
      id,
      label,
      description,
      progress: Math.min(progress, goal),
      goal,
      earned: progress >= goal,
    });
    const badges = [
      badge("steel-bones", "Hueso de acero", "7 días seguidos con la rutina completa", routineStreakDays, 7),
      badge("orbital-sleep", "Sueño orbital", "7 noches seguidas durmiendo 7 h o más", sleepStreak, 7),
      badge("steady", "Constancia", "Check-in en 14 días distintos", checkinDays, 14),
    ];

    return { tasks, completed, xp, routineStreakDays, reminders, badges };
  }
}
