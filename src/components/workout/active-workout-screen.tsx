"use client";

import { useEffect, useTransition } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/layout/top-bar";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Plus, Timer } from "lucide-react";
import {
  getWorkoutSession,
  endWorkout,
  deleteWorkoutSession,
} from "@/actions/workout";
import { logSet, deleteSet } from "@/actions/sets";
import { useWorkoutStore } from "@/stores/workout-store";
import { useWorkoutTimer } from "@/hooks/use-workout-timer";
import { useRestTimer } from "@/hooks/use-rest-timer";
import { SetTable } from "@/components/workout/set-table";
import { toast } from "sonner";

interface SessionExerciseData {
  id: string;
  order: number;
  notes: string | null;
  exercise: { id: string; name: string; isUnilateral: boolean };
  sets: {
    id: string;
    setNumber: number;
    weight: number | null;
    reps: number | null;
    rir: number | null;
    side: string | null;
    completed: boolean;
  }[];
}

interface WorkoutSessionData {
  id: string;
  workoutType: { id: string; name: string };
  exercises: SessionExerciseData[];
  startedAt: Date;
  endedAt: Date | null;
  notes: string | null;
}

export function ActiveWorkoutScreen({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { formatted: timerFormatted } = useWorkoutTimer();
  const { isActive: restActive, formatted: restFormatted } = useRestTimer();
  const setActiveSession = useWorkoutStore((s) => s.setActiveSession);
  const clearActiveSession = useWorkoutStore((s) => s.clearActiveSession);
  const startRestTimer = useWorkoutStore((s) => s.startRestTimer);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setActiveSession(sessionId);
  }, [sessionId, setActiveSession]);

  const { data: session, isLoading } = useQuery<WorkoutSessionData | null>({
    queryKey: ["workout-session", sessionId],
    queryFn: () => getWorkoutSession(sessionId),
  });

  function handleEndWorkout() {
    startTransition(async () => {
      const result = await endWorkout({ sessionId });
      if (result.success) {
        clearActiveSession();
        toast.success("Workout complete!");
        router.push("/");
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleDeleteSession() {
    startTransition(async () => {
      const result = await deleteWorkoutSession(sessionId);
      if (result.success) {
        clearActiveSession();
        router.push("/");
      } else {
        toast.error(result.error);
      }
    });
  }

  async function handleLogSet(
    sessionExerciseId: string,
    setNumber: number,
    data: { weight?: number | null; reps?: number | null; rir?: number | null; side?: "L" | "R" | null }
  ) {
    const result = await logSet({
      sessionExerciseId,
      setNumber,
      ...data,
    });
    if (result.success) {
      startRestTimer();
      queryClient.invalidateQueries({
        queryKey: ["workout-session", sessionId],
      });
    } else {
      toast.error(result.error);
    }
  }

  async function handleDeleteSet(setId: string) {
    const result = await deleteSet(setId);
    if (result.success) {
      queryClient.invalidateQueries({
        queryKey: ["workout-session", sessionId],
      });
    } else {
      toast.error(result.error);
    }
  }

  if (isLoading) {
    return (
      <>
        <TopBar title="Loading..." showBack />
        <PageContainer className="py-4">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        </PageContainer>
      </>
    );
  }

  if (!session) {
    return (
      <>
        <TopBar title="Not Found" showBack />
        <PageContainer className="py-12 text-center">
          <p className="text-muted-foreground">Workout session not found.</p>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <TopBar
        title={session.workoutType.name}
        showBack
        rightContent={
          <div className="flex items-center gap-2 text-sm">
            <Timer className="h-4 w-4 text-muted-foreground" />
            <span className="font-mono tabular-nums">{timerFormatted}</span>
          </div>
        }
        actions={[
          { label: "End Workout", onClick: handleEndWorkout },
          {
            label: "Delete Session",
            onClick: handleDeleteSession,
            variant: "destructive",
          },
        ]}
      />

      {restActive && (
        <div className="sticky top-14 z-30 border-b bg-primary/10 backdrop-blur-lg">
          <div className="mx-auto flex max-w-md items-center justify-center gap-2 py-2 text-sm">
            <span className="text-muted-foreground">Rest</span>
            <span className="font-mono text-lg font-bold tabular-nums">
              {restFormatted}
            </span>
          </div>
        </div>
      )}

      <PageContainer className="py-4 space-y-6" bottomNavPadding={false}>
        {session.exercises.map((sessionExercise, index) => (
          <section key={sessionExercise.id} className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {index + 1}
              </span>
              <h3 className="font-semibold">{sessionExercise.exercise.name}</h3>
            </div>

            <SetTable
              sessionExerciseId={sessionExercise.id}
              sets={sessionExercise.sets}
              isUnilateral={sessionExercise.exercise.isUnilateral}
              onLogSet={(setNumber, data) =>
                handleLogSet(sessionExercise.id, setNumber, data)
              }
              onDeleteSet={handleDeleteSet}
            />
          </section>
        ))}

        <div className="pb-8 space-y-3">
          <Button
            variant="outline"
            className="w-full gap-2"
            disabled={isPending}
          >
            <Plus className="h-4 w-4" />
            Add Exercise
          </Button>

          <Button
            className="w-full"
            size="lg"
            onClick={handleEndWorkout}
            disabled={isPending}
          >
            {isPending ? "Finishing..." : "Finish Workout"}
          </Button>
        </div>
      </PageContainer>
    </>
  );
}
