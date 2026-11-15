"use client";

import { Award, BellRing, CheckCircle2, Circle, Flame, Users } from "lucide-react";
import { Button } from "@/core/presentation/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/presentation/ui/card";
import { Progress } from "@/core/presentation/ui/progress";
import { cn } from "@/core/utils/cn";
import type { DailyMission } from "../../../domain/services/daily-mission.domain-service";

/**
 * Mission of the day: five health tasks, XP, routine streak, badges and the crew's shared goal.
 * Pure: data and the "next reminder" handler arrive as props.
 */
export function DailyMissionCard({
  mission,
  crewCompleted,
  crewSize,
  onShowReminder,
  className,
}: {
  mission: DailyMission;
  crewCompleted: number;
  crewSize: number;
  onShowReminder: () => void;
  className?: string;
}) {
  const total = mission.tasks.length;
  return (
    <Card className={className}>
      <CardHeader className="border-b">
        <div className="space-y-1">
          <CardTitle>Misión del día</CardTitle>
          <p className="text-[13px] text-muted-foreground">
            {mission.completed}/{total} tareas · <span className="font-mono tabular">{mission.xp} XP</span>
          </p>
        </div>
        <span className="flex items-center gap-1 rounded-md border px-2 py-1 text-[12px]" title="Días seguidos con la rutina de ejercicio completa">
          <Flame className={cn("size-3.5", mission.routineStreakDays > 0 ? "text-caution" : "text-muted-foreground")} />
          <span className="font-mono tabular">{mission.routineStreakDays}</span> d
        </span>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <Progress value={(mission.completed / total) * 100} aria-label={`${mission.completed} de ${total} tareas`} />
        <ul className="space-y-1.5">
          {mission.tasks.map((t) => (
            <li key={t.id} className="flex items-center gap-2 text-[13px]">
              {t.done ? <CheckCircle2 className="size-4 text-nominal" /> : <Circle className="size-4 text-muted-foreground" />}
              <span className={cn(t.done && "text-muted-foreground line-through")}>{t.label}</span>
              <span className="ml-auto font-mono text-[11px] text-muted-foreground">+{t.xp}</span>
            </li>
          ))}
        </ul>

        {mission.reminders.length > 0 && (
          <div className="flex items-center justify-between gap-2 rounded-md border bg-muted/30 px-3 py-2">
            <p className="line-clamp-2 text-[12.5px]">{mission.reminders[0].message}</p>
            <Button size="sm" variant="ghost" onClick={onShowReminder} aria-label="Mostrar el siguiente recordatorio">
              <BellRing />
            </Button>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2">
          {mission.badges.map((b) => (
            <div key={b.id} className={cn("rounded-md border p-2 text-center", b.earned ? "border-caution/40 bg-caution/5" : "opacity-80")} title={b.description}>
              <Award className={cn("mx-auto size-5", b.earned ? "text-caution" : "text-muted-foreground")} />
              <p className="mt-1 text-[11.5px] leading-tight font-medium">{b.label}</p>
              <p className="font-mono text-[10.5px] text-muted-foreground tabular">
                {b.progress}/{b.goal}
              </p>
            </div>
          ))}
        </div>

        <p className="flex items-center gap-1.5 border-t pt-3 text-[12px] text-muted-foreground">
          <Users className="size-3.5" />
          Meta de tripulación: {crewCompleted} de {crewSize} completaron su misión hoy.
        </p>
      </CardContent>
    </Card>
  );
}
