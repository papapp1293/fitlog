"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { TopBar } from "@/components/layout/top-bar";
import { PageContainer } from "@/components/layout/page-container";
import { getWorkoutHistory } from "@/actions/history";
import type { WorkoutHistoryItem } from "@/actions/history";
import { HistorySkeleton } from "@/components/skeletons/history-skeleton";
import { ClipboardList, Clock, Dumbbell, ChevronRight } from "lucide-react";

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function WorkoutCard({ workout }: { workout: WorkoutHistoryItem }) {
  return (
    <Link
      href={`/history/${workout.id}`}
      className="flex items-center justify-between rounded-xl border bg-card p-4 transition-colors active:bg-muted"
    >
      <div className="min-w-0 flex-1">
        <p className="font-medium">{workout.workoutTypeName}</p>
        <p className="text-sm text-muted-foreground">
          {formatDate(workout.startedAt)} &middot; {formatTime(workout.startedAt)}
        </p>
        <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDuration(workout.durationMinutes)}
          </span>
          <span className="flex items-center gap-1">
            <Dumbbell className="h-3 w-3" />
            {workout.exerciseCount} exercise{workout.exerciseCount !== 1 ? "s" : ""}
          </span>
          <span>{workout.totalSets} sets</span>
          {workout.totalVolume > 0 && (
            <span className="tabular-nums">
              {workout.totalVolume.toLocaleString()} lbs
            </span>
          )}
        </div>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}

export function WorkoutHistoryScreen() {
  const { data: workouts = [], isLoading } = useQuery<WorkoutHistoryItem[]>({
    queryKey: ["workout-history"],
    queryFn: () => getWorkoutHistory(),
  });

  return (
    <>
      <TopBar title="Workout History" />
      <PageContainer className="py-4 space-y-3">
        {isLoading ? (
          <HistorySkeleton />
        ) : workouts.length === 0 ? (
          <div className="py-12 text-center">
            <ClipboardList className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-muted-foreground">
              No workouts yet. Complete your first workout to see it here.
            </p>
          </div>
        ) : (
          workouts.map((workout) => (
            <WorkoutCard key={workout.id} workout={workout} />
          ))
        )}
      </PageContainer>
    </>
  );
}
