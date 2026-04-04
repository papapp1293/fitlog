"use client";

import { useTransition } from "react";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { TopBar } from "@/components/layout/top-bar";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";
import { getWorkoutType } from "@/actions/workout";
import {
  addExerciseToTemplate,
  removeExerciseFromTemplate,
} from "@/actions/exercise";
import { ExercisePickerDialog } from "@/components/workout/exercise-picker-dialog";
import { toast } from "sonner";

interface TemplateExerciseItem {
  id: string;
  order: number;
  exercise: { id: string; name: string; muscleGroup: string | null; isUnilateral: boolean };
}

interface WorkoutTypeData {
  id: string;
  name: string;
  templateExercises: TemplateExerciseItem[];
  _count: { sessions: number };
}

export function TemplateDetailScreen({ templateId }: { templateId: string }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const queryClient = useQueryClient();

  const { data: template, isLoading } = useQuery<WorkoutTypeData | null>({
    queryKey: ["workout-type", templateId],
    queryFn: () => getWorkoutType(templateId),
  });

  function handleAddExercise(exerciseId: string) {
    startTransition(async () => {
      const result = await addExerciseToTemplate(templateId, exerciseId);
      if (result.success) {
        setPickerOpen(false);
        queryClient.invalidateQueries({ queryKey: ["workout-type", templateId] });
        queryClient.invalidateQueries({ queryKey: ["workout-types"] });
        toast.success("Exercise added");
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleRemoveExercise(templateExerciseId: string) {
    startTransition(async () => {
      const result = await removeExerciseFromTemplate(templateExerciseId);
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["workout-type", templateId] });
        queryClient.invalidateQueries({ queryKey: ["workout-types"] });
        toast.success("Exercise removed");
      } else {
        toast.error(result.error);
      }
    });
  }

  if (isLoading) {
    return (
      <>
        <TopBar title="Loading..." showBack />
        <PageContainer className="py-4">
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        </PageContainer>
      </>
    );
  }

  if (!template) {
    return (
      <>
        <TopBar title="Not Found" showBack />
        <PageContainer className="py-12 text-center">
          <p className="text-muted-foreground">Template not found.</p>
        </PageContainer>
      </>
    );
  }

  const exerciseIds = template.templateExercises.map((te) => te.exercise.id);

  return (
    <>
      <TopBar title={template.name} showBack />

      <PageContainer className="py-4 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {template.templateExercises.length} exercises
          </p>
          <p className="text-sm text-muted-foreground">
            {template._count.sessions} sessions
          </p>
        </div>

        <div className="space-y-2">
          {template.templateExercises.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No exercises yet. Add your first exercise below.
            </p>
          ) : (
            template.templateExercises.map((te, index) => (
              <div
                key={te.id}
                className="flex items-center gap-3 rounded-xl border bg-card p-4"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shrink-0">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{te.exercise.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {te.exercise.muscleGroup && (
                      <span className="text-xs text-muted-foreground">
                        {te.exercise.muscleGroup}
                      </span>
                    )}
                    {te.exercise.isUnilateral && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        L/R
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                  disabled={isPending}
                  onClick={() => handleRemoveExercise(te.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>

        <Button
          className="w-full gap-2"
          size="lg"
          onClick={() => setPickerOpen(true)}
          disabled={isPending}
        >
          <Plus className="h-4 w-4" />
          Add Exercise
        </Button>

        <ExercisePickerDialog
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          onSelect={handleAddExercise}
          excludeIds={exerciseIds}
        />
      </PageContainer>
    </>
  );
}
