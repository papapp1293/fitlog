"use client";

import { useTransition } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/layout/top-bar";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { getWorkoutTypes, startWorkout } from "@/actions/workout";
import { useWorkoutStore } from "@/stores/workout-store";
import { toast } from "sonner";

export function WorkoutSelectScreen() {
  const router = useRouter();
  const setActiveSession = useWorkoutStore((s) => s.setActiveSession);

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
          templates.map((template) => (
            <button
              key={template.id}
              onClick={() => handleStart(template.id)}
              disabled={isPending}
              className="w-full rounded-xl border bg-card p-5 text-left transition-colors hover:bg-accent active:scale-[0.98] disabled:opacity-50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{template.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {template.templateExercises.length} exercises
                  </p>
                </div>
                <Play className="h-6 w-6 text-primary" />
              </div>
            </button>
          ))
        )}
      </PageContainer>
    </>
  );
}
