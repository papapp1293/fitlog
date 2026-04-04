"use client";

import { useQuery } from "@tanstack/react-query";
import { PageContainer } from "@/components/layout/page-container";
import { WeeklyCalendar } from "@/components/home/weekly-calendar";
import { Button } from "@/components/ui/button";
import { Dumbbell, Plus, Play, Timer } from "lucide-react";
import Link from "next/link";
import { getWeeklyStats, getWorkoutDates } from "@/actions/workout";
import { getBodyweightLogs } from "@/actions/bodyweight";
import { useWorkoutStore } from "@/stores/workout-store";
import { useWorkoutTimer } from "@/hooks/use-workout-timer";
import { HomeSkeleton } from "@/components/skeletons/home-skeleton";
import { HomeBodyweightCard } from "@/components/home/home-bodyweight-card";

function getMonday() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split("T")[0];
}

export function HomeScreen() {
  const mondayStr = getMonday();
  const activeSessionId = useWorkoutStore((s) => s.activeSessionId);
  const { formatted: timerFormatted } = useWorkoutTimer();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["weekly-stats"],
    queryFn: () => getWeeklyStats(),
  });

  const { data: workoutDates = [], isLoading: datesLoading } = useQuery({
    queryKey: ["workout-dates", mondayStr],
    queryFn: () => getWorkoutDates(mondayStr),
  });

  const { data: bwLogs = [] } = useQuery<{ id: string; weight: number; date: Date }[]>({
    queryKey: ["bodyweight-logs"],
    queryFn: () => getBodyweightLogs(),
  });

  const isLoading = statsLoading || datesLoading;

  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-md items-center gap-3 px-4">
          <Dumbbell className="h-6 w-6 text-primary" />
          <h1 className="text-lg font-semibold">Gym Tracker</h1>
        </div>
      </header>

      <PageContainer className="py-6 space-y-6">
        {isLoading ? (
          <HomeSkeleton />
        ) : (
        <>
        <WeeklyCalendar workoutDates={workoutDates} />

        {activeSessionId ? (
          <Link href={`/workout/${activeSessionId}`}>
            <Button
              className="w-full h-14 text-lg font-semibold gap-3"
              size="lg"
            >
              <Play className="h-5 w-5" />
              Resume Workout
              <span className="ml-auto flex items-center gap-1.5 text-sm font-mono tabular-nums opacity-80">
                <Timer className="h-4 w-4" />
                {timerFormatted}
              </span>
            </Button>
          </Link>
        ) : (
          <Link href="/workout">
            <Button
              className="w-full h-14 text-lg font-semibold gap-2"
              size="lg"
            >
              <Plus className="h-5 w-5" />
              Start Training
            </Button>
          </Link>
        )}

        <section className="space-y-3 pt-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Quick Stats
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="This Week"
              value={String(stats?.weekCount ?? 0)}
              unit="workouts"
            />
            <StatCard
              label="This Month"
              value={String(stats?.monthCount ?? 0)}
              unit="workouts"
            />
          </div>
        </section>
        <HomeBodyweightCard logs={bwLogs} />
        </>
        )}
      </PageContainer>
    </>
  );
}

function StatCard({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold mt-1">
        {value} <span className="text-sm font-normal text-muted-foreground">{unit}</span>
      </p>
    </div>
  );
}
