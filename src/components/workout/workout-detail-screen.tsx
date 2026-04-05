"use client";

import { useQuery } from "@tanstack/react-query";
import { TopBar } from "@/components/layout/top-bar";
import { PageContainer } from "@/components/layout/page-container";
import { getWorkoutSessionDetail } from "@/actions/history";
import type { WorkoutSessionDetail } from "@/actions/history";
import { HistoryDetailSkeleton } from "@/components/skeletons/history-skeleton";
import { Clock, Dumbbell, Hash, FileText } from "lucide-react";

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-3 text-center">
      <Icon className="mx-auto h-4 w-4 text-muted-foreground" />
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function ExerciseBlock({
  exercise,
}: {
  exercise: WorkoutSessionDetail["exercises"][number];
}) {
  const completedSets = exercise.sets.filter((s) => s.completed);

  return (
    <div className="space-y-2">
      <h3 className="font-medium">{exercise.name}</h3>
      <div className="rounded-xl border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-xs text-muted-foreground">
              <th className="px-3 py-2 text-left font-medium">Set</th>
              {exercise.isUnilateral && (
                <th className="px-3 py-2 text-left font-medium">Side</th>
              )}
              <th className="px-3 py-2 text-right font-medium">Weight</th>
              <th className="px-3 py-2 text-right font-medium">Reps</th>
              {completedSets.some((s) => s.rir !== null) && (
                <th className="px-3 py-2 text-right font-medium">RIR</th>
              )}
            </tr>
          </thead>
          <tbody>
            {completedSets.map((set, i) => {
              const showRir = completedSets.some((s) => s.rir !== null);
              return (
                <tr key={i} className="border-b last:border-0">
                  <td className="px-3 py-2 tabular-nums">{set.setNumber}</td>
                  {exercise.isUnilateral && (
                    <td className="px-3 py-2">{set.side ?? "—"}</td>
                  )}
                  <td className="px-3 py-2 text-right tabular-nums">
                    {set.weight ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {set.reps ?? "—"}
                  </td>
                  {showRir && (
                    <td className="px-3 py-2 text-right tabular-nums">
                      {set.rir ?? "—"}
                    </td>
                  )}
                </tr>
              );
            })}
            {completedSets.length === 0 && (
              <tr>
                <td
                  colSpan={exercise.isUnilateral ? 4 : 3}
                  className="px-3 py-3 text-center text-muted-foreground"
                >
                  No completed sets
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function WorkoutDetailScreen({ sessionId }: { sessionId: string }) {
  const { data: session, isLoading } = useQuery<WorkoutSessionDetail | null>({
    queryKey: ["workout-session-detail", sessionId],
    queryFn: () => getWorkoutSessionDetail(sessionId),
  });

  const totalSets = session
    ? session.exercises.reduce(
        (sum, ex) => sum + ex.sets.filter((s) => s.completed).length,
        0
      )
    : 0;

  const totalVolume = session
    ? session.exercises.reduce(
        (sum, ex) =>
          sum +
          ex.sets
            .filter((s) => s.completed)
            .reduce((v, s) => v + (s.weight ?? 0) * (s.reps ?? 0), 0),
        0
      )
    : 0;

  return (
    <>
      <TopBar
        title={session?.workoutTypeName ?? "Workout Details"}
        showBack
      />
      <PageContainer className="py-4 space-y-6">
        {isLoading ? (
          <HistoryDetailSkeleton />
        ) : !session ? (
          <div className="py-12 text-center">
            <Dumbbell className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-muted-foreground">Workout not found.</p>
          </div>
        ) : (
          <>
            {/* Date & time */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                {formatDate(session.startedAt)}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatTime(session.startedAt)} — {formatTime(session.endedAt)}
              </p>
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-3">
              <StatCard
                icon={Clock}
                label="Duration"
                value={formatDuration(session.durationMinutes)}
              />
              <StatCard
                icon={Hash}
                label="Sets"
                value={String(totalSets)}
              />
              <StatCard
                icon={Dumbbell}
                label="Volume"
                value={totalVolume > 0 ? `${Math.round(totalVolume).toLocaleString()}` : "—"}
              />
            </div>

            {/* Notes */}
            {session.notes && (
              <div className="flex items-start gap-2 rounded-xl border bg-card p-3">
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <p className="text-sm">{session.notes}</p>
              </div>
            )}

            {/* Exercises */}
            <section className="space-y-4">
              <h2 className="text-sm font-medium text-muted-foreground">
                Exercises ({session.exercises.length})
              </h2>
              {session.exercises.map((ex) => (
                <ExerciseBlock key={ex.id} exercise={ex} />
              ))}
            </section>
          </>
        )}
      </PageContainer>
    </>
  );
}
