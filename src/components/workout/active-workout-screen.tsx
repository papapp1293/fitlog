"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/layout/top-bar";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Plus, Timer, Trash2 } from "lucide-react";
import {
  getWorkoutSession,
  endWorkout,
  deleteWorkoutSession,
  addExerciseToSession,
  removeExerciseFromSession,
} from "@/actions/workout";
import { logSet, deleteSet, updateSet, getPreviousSets } from "@/actions/sets";
import { ExercisePickerDialog } from "@/components/workout/exercise-picker-dialog";
import { RestTimePicker } from "@/components/workout/rest-time-picker";
import { REST_TIMER_PRESETS } from "@/lib/constants";
import { useWorkoutStore } from "@/stores/workout-store";
import { useWorkoutTimer } from "@/hooks/use-workout-timer";
import { useRestTimer } from "@/hooks/use-rest-timer";
import { SetTable } from "@/components/workout/set-table";
import { WorkoutSkeleton } from "@/components/skeletons/workout-skeleton";
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

interface PreviousSetData {
  setNumber: number;
  weight: number | null;
  reps: number | null;
  rir: number | null;
  side: string | null;
}

const SESSION_KEY = (id: string) => ["workout-session", id] as const;

export function ActiveWorkoutScreen({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { formatted: timerFormatted } = useWorkoutTimer();
  const { isActive: restActive, formatted: restFormatted } = useRestTimer();
  const setActiveSession = useWorkoutStore((s) => s.setActiveSession);
  const clearActiveSession = useWorkoutStore((s) => s.clearActiveSession);
  const startRestTimer = useWorkoutStore((s) => s.startRestTimer);
  const clearRestTimer = useWorkoutStore((s) => s.clearRestTimer);
  const restDuration = useWorkoutStore((s) => s.restDuration);
  const setRestDuration = useWorkoutStore((s) => s.setRestDuration);
  const [isPending, startTransition] = useTransition();
  const [exercisePickerOpen, setExercisePickerOpen] = useState(false);
  const [timePickerOpen, setTimePickerOpen] = useState(false);

  const queryKey = SESSION_KEY(sessionId);

  const { data: session, isLoading } = useQuery<WorkoutSessionData | null>({
    queryKey,
    queryFn: () => getWorkoutSession(sessionId),
  });

  // Sync store with DB start time so timer is accurate on resume
  useEffect(() => {
    if (session) {
      setActiveSession(sessionId, new Date(session.startedAt).getTime());
    }
  }, [session, sessionId, setActiveSession]);

  // Fetch previous sets for all exercises in the session
  const exerciseIds = session?.exercises.map((e) => e.exercise.id) ?? [];
  const { data: previousSetsMap = {} } = useQuery<Record<string, PreviousSetData[]>>({
    queryKey: ["previous-sets", exerciseIds.join(",")],
    queryFn: async () => {
      if (exerciseIds.length === 0) return {};
      const entries = await Promise.all(
        exerciseIds.map(async (id) => {
          const sets = await getPreviousSets(id);
          return [id, sets] as const;
        })
      );
      return Object.fromEntries(entries);
    },
    enabled: exerciseIds.length > 0,
  });

  // --- Optimistic mutations ---

  const logSetMutation = useMutation({
    mutationFn: (input: {
      sessionExerciseId: string;
      setNumber: number;
      weight?: number | null;
      reps?: number | null;
      rir?: number | null;
      side?: "L" | "R" | null;
    }) => logSet(input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<WorkoutSessionData | null>(queryKey);

      queryClient.setQueryData<WorkoutSessionData | null>(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          exercises: old.exercises.map((ex) =>
            ex.id === input.sessionExerciseId
              ? {
                  ...ex,
                  sets: [
                    ...ex.sets,
                    {
                      id: `optimistic-${Date.now()}`,
                      setNumber: input.setNumber,
                      weight: input.weight ?? null,
                      reps: input.reps ?? null,
                      rir: input.rir ?? null,
                      side: input.side ?? null,
                      completed: true,
                    },
                  ],
                }
              : ex
          ),
        };
      });

      startRestTimer();
      return { previous };
    },
    onError: (_err, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast.error("Failed to log set");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const updateSetMutation = useMutation({
    mutationFn: (input: {
      id: string;
      weight?: number | null;
      reps?: number | null;
      rir?: number | null;
    }) => updateSet(input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<WorkoutSessionData | null>(queryKey);

      queryClient.setQueryData<WorkoutSessionData | null>(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          exercises: old.exercises.map((ex) => ({
            ...ex,
            sets: ex.sets.map((s) =>
              s.id === input.id
                ? {
                    ...s,
                    ...(input.weight !== undefined && { weight: input.weight }),
                    ...(input.reps !== undefined && { reps: input.reps }),
                    ...(input.rir !== undefined && { rir: input.rir }),
                  }
                : s
            ),
          })),
        };
      });

      return { previous };
    },
    onError: (_err, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast.error("Failed to update set");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteSetMutation = useMutation({
    mutationFn: (setId: string) => deleteSet(setId),
    onMutate: async (setId) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<WorkoutSessionData | null>(queryKey);

      queryClient.setQueryData<WorkoutSessionData | null>(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          exercises: old.exercises.map((ex) => ({
            ...ex,
            sets: ex.sets.filter((s) => s.id !== setId),
          })),
        };
      });

      return { previous };
    },
    onError: (_err, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast.error("Failed to delete set");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const addExerciseMutation = useMutation({
    mutationFn: (exerciseId: string) => addExerciseToSession(sessionId, exerciseId),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey });
        queryClient.invalidateQueries({ queryKey: ["previous-sets"] });
        toast.success("Exercise added");
      } else {
        toast.error(result.error);
      }
    },
    onError: () => {
      toast.error("Failed to add exercise");
    },
  });

  const removeExerciseMutation = useMutation({
    mutationFn: (sessionExerciseId: string) => removeExerciseFromSession(sessionExerciseId),
    onMutate: async (sessionExerciseId) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<WorkoutSessionData | null>(queryKey);

      queryClient.setQueryData<WorkoutSessionData | null>(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          exercises: old.exercises.filter((ex) => ex.id !== sessionExerciseId),
        };
      });

      return { previous };
    },
    onError: (_err, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast.error("Failed to remove exercise");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // --- Handlers ---

  function handleEndWorkout() {
    startTransition(async () => {
      const result = await endWorkout({ sessionId });
      if (result.success) {
        clearActiveSession();
        queryClient.invalidateQueries({ queryKey: ["weekly-stats"] });
        queryClient.invalidateQueries({ queryKey: ["workout-dates"] });
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

  const handleLogSet = useCallback(
    async (
      sessionExerciseId: string,
      setNumber: number,
      data: { weight?: number | null; reps?: number | null; rir?: number | null; side?: "L" | "R" | null }
    ) => {
      logSetMutation.mutate({ sessionExerciseId, setNumber, ...data });
    },
    [logSetMutation]
  );

  const handleUpdateSet = useCallback(
    async (
      setId: string,
      data: { weight?: number | null; reps?: number | null; rir?: number | null }
    ) => {
      updateSetMutation.mutate({ id: setId, ...data });
    },
    [updateSetMutation]
  );

  const handleDeleteSet = useCallback(
    async (setId: string) => {
      deleteSetMutation.mutate(setId);
    },
    [deleteSetMutation]
  );

  function handleAddExercise(exerciseId: string) {
    setExercisePickerOpen(false);
    addExerciseMutation.mutate(exerciseId);
  }

  function handleRemoveExercise(sessionExerciseId: string) {
    removeExerciseMutation.mutate(sessionExerciseId);
  }

  // --- Render ---

  if (isLoading) {
    return (
      <>
        <TopBar title="Loading..." showBack />
        <PageContainer className="py-4">
          <WorkoutSkeleton />
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
      {/* Combined sticky header: TopBar + rest timer */}
      <div className="sticky top-0 z-40">
        <TopBar
          title={session.workoutType.name}
          showBack
          sticky={false}
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

        {/* Rest timer — sits directly under TopBar in the same sticky block */}
        <div className={`border-b backdrop-blur-lg ${restActive ? "bg-primary/10" : "bg-card/80"}`}>
          {restActive && (
            <div className="mx-auto flex max-w-md items-center justify-between px-4 py-1.5">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  const end = useWorkoutStore.getState().restTimerEnd;
                  if (end) {
                    useWorkoutStore.setState({ restTimerEnd: end + 30_000 });
                  }
                }}
              >
                +30s
              </Button>
              <button
                className="flex items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-accent active:scale-95"
                onClick={() => setTimePickerOpen(true)}
              >
                <span className="text-sm text-muted-foreground">Rest</span>
                <span className="font-mono text-lg font-bold tabular-nums">
                  {restFormatted}
                </span>
              </button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={clearRestTimer}
              >
                Skip
              </Button>
            </div>
          )}

          <div className="mx-auto flex max-w-md items-center gap-1 justify-center px-4 py-1">
            {REST_TIMER_PRESETS.map((seconds) => (
              <Button
                key={seconds}
                variant={restDuration === seconds ? "default" : "ghost"}
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => {
                  setRestDuration(seconds);
                  if (restActive) startRestTimer(seconds);
                }}
              >
                {seconds >= 60 ? `${seconds / 60}m` : `${seconds}s`}
              </Button>
            ))}
            <Button
              variant={!REST_TIMER_PRESETS.includes(restDuration as typeof REST_TIMER_PRESETS[number]) ? "default" : "ghost"}
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => setTimePickerOpen(true)}
            >
              {!REST_TIMER_PRESETS.includes(restDuration as typeof REST_TIMER_PRESETS[number])
                ? formatDuration(restDuration)
                : "Custom"}
            </Button>
          </div>
        </div>
      </div>

      <PageContainer className="py-4 space-y-6" bottomNavPadding={false}>
        {session.exercises.map((sessionExercise, index) => (
          <section key={sessionExercise.id} className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {index + 1}
              </span>
              <h3 className="flex-1 font-semibold">{sessionExercise.exercise.name}</h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => handleRemoveExercise(sessionExercise.id)}
              >
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </div>

            <SetTable
              sessionExerciseId={sessionExercise.id}
              sets={sessionExercise.sets}
              isUnilateral={sessionExercise.exercise.isUnilateral}
              previousSets={previousSetsMap[sessionExercise.exercise.id]}
              onLogSet={(setNumber, data) =>
                handleLogSet(sessionExercise.id, setNumber, data)
              }
              onUpdateSet={handleUpdateSet}
              onDeleteSet={handleDeleteSet}
            />
          </section>
        ))}

        <div className="pb-8 space-y-3">
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => setExercisePickerOpen(true)}
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

        <ExercisePickerDialog
          open={exercisePickerOpen}
          onOpenChange={setExercisePickerOpen}
          onSelect={handleAddExercise}
          excludeIds={session.exercises.map((e) => e.exercise.id)}
        />
      </PageContainer>

      <RestTimePicker
        open={timePickerOpen}
        onClose={() => setTimePickerOpen(false)}
        onConfirm={(seconds) => {
          setRestDuration(seconds);
          if (restActive) startRestTimer(seconds);
          setTimePickerOpen(false);
        }}
      />
    </>
  );
}

function formatDuration(seconds: number): string {
  if (seconds >= 60) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s > 0 ? `${m}:${String(s).padStart(2, "0")}` : `${m}m`;
  }
  return `${seconds}s`;
}
