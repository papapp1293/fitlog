"use client";

import { useTransition } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/layout/top-bar";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Play, Timer } from "lucide-react";
import { getWorkoutTypes, startWorkout } from "@/actions/workout";
import { useWorkoutStore } from "@/stores/workout-store";
import { useWorkoutTimer } from "@/hooks/use-workout-timer";
import { toast } from "sonner";
import Link from "next/link";

export function WorkoutSelectScreen() {
  const router = useRouter();
  const activeSessionId = useWorkoutStore((s) => s.activeSessionId);
  const setActiveSession = useWorkoutStore((s) => s.setActiveSession);
  const { formatted: timerFormatted } = useWorkoutTimer();

  const { data: templates = [], isLoading } = useQuery<
    { id: string; name: string; templateExercises: { exercise: { name: string } }[]; _count: { sessions: number } }[]
  >({
    queryKey: ["workout-types"],
    queryFn: () => getWorkoutTypes(),
  });

  const [isPending, startTransition] = useTransition();

  function handleStart(workoutTypeId: string) {
    startTransition(async () => {
      const result = await startWorkout({ workoutTypeId });
      if (result.success) {
        setActiveSession(result.data.id);
        router.push(`/workout/${result.data.id}`);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <>
      <TopBar title="Select Workout" showBack />
      <PageContainer className="py-4 space-y-4" bottomNavPadding={false}>
        {activeSessionId && (
          <Link href={`/workout/${activeSessionId}`}>
            <div className="flex items-center gap-3 rounded-xl border-2 border-primary bg-primary/10 p-4 transition-colors hover:bg-primary/20">
              <Play className="h-5 w-5 text-primary shrink-0" />
              <div className="flex-1">
                <p className="font-semibold">Workout in progress</p>
                <p className="text-sm text-muted-foreground">
                  Tap to resume your current session
                </p>
              </div>
              <span className="flex items-center gap-1.5 text-sm font-mono tabular-nums text-muted-foreground">
                <Timer className="h-4 w-4" />
                {timerFormatted}
              </span>
            </div>
          </Link>
        )}

        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
          ))
        ) : templates.length === 0 ? (
          <div className="py-12 text-center space-y-4">
            <p className="text-muted-foreground">
              No workout templates yet.
            </p>
            <Button
              variant="outline"
              onClick={() => router.push("/templates")}
            >
              Create Template
            </Button>
          </div>
        ) : (
          templates.map((template) => {
            const exerciseCount = template.templateExercises.length;
            return (
              <button
                key={template.id}
                onClick={() => handleStart(template.id)}
                disabled={isPending || !!activeSessionId}
                className="w-full rounded-xl border bg-card p-5 text-left transition-colors hover:bg-accent active:scale-[0.98] disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{template.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {exerciseCount === 0
                        ? "No exercises — add during workout"
                        : `${exerciseCount} exercises`}
                    </p>
                  </div>
                  <Play className={`h-6 w-6 ${activeSessionId ? "text-muted-foreground" : "text-primary"}`} />
                </div>
              </button>
            );
          })
        )}
      </PageContainer>
    </>
  );
}
