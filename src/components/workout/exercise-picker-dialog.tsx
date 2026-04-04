"use client";

import { useState, useTransition } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Search, Check } from "lucide-react";
import { getExercises, createExercise } from "@/actions/exercise";
import { MUSCLE_GROUPS } from "@/lib/constants";
import { toast } from "sonner";

interface ExercisePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (exerciseId: string) => void;
  excludeIds?: string[];
}

export function ExercisePickerDialog({
  open,
  onOpenChange,
  onSelect,
  excludeIds = [],
}: ExercisePickerDialogProps) {
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const queryClient = useQueryClient();

  const { data: exercises = [], isLoading } = useQuery<
    { id: string; name: string; muscleGroup: string | null; isUnilateral: boolean }[]
  >({
    queryKey: ["exercises"],
    queryFn: () => getExercises(),
    enabled: open,
  });

  const excludeSet = new Set(excludeIds);
  const filtered = exercises
    .filter((e) => !excludeSet.has(e.id))
    .filter((e) => e.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Exercise</DialogTitle>
        </DialogHeader>

        {showCreate ? (
          <CreateExerciseInline
            onCreated={(id) => {
              queryClient.invalidateQueries({ queryKey: ["exercises"] });
              setShowCreate(false);
              onSelect(id);
            }}
            onCancel={() => setShowCreate(false)}
          />
        ) : (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search exercises..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex-1 overflow-y-auto -mx-6 px-6 space-y-1 min-h-0 max-h-[40vh]">
              {isLoading ? (
                <p className="py-4 text-center text-sm text-muted-foreground">Loading...</p>
              ) : filtered.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  {search ? "No matching exercises" : "No exercises yet"}
                </p>
              ) : (
                filtered.map((exercise) => (
                  <button
                    key={exercise.id}
                    onClick={() => onSelect(exercise.id)}
                    className="w-full flex items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-accent active:scale-[0.98]"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{exercise.name}</p>
                      {exercise.muscleGroup && (
                        <p className="text-xs text-muted-foreground">{exercise.muscleGroup}</p>
                      )}
                    </div>
                    <Plus className="h-4 w-4 text-muted-foreground shrink-0" />
                  </button>
                ))
              )}
            </div>

            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => setShowCreate(true)}
            >
              <Plus className="h-4 w-4" />
              Create New Exercise
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CreateExerciseInline({
  onCreated,
  onCancel,
}: {
  onCreated: (id: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [muscleGroup, setMuscleGroup] = useState("");
  const [isUnilateral, setIsUnilateral] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await createExercise({
        name,
        muscleGroup: muscleGroup || undefined,
        isUnilateral,
      });
      if (result.success) {
        toast.success("Exercise created");
        onCreated(result.data.id);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="exerciseName">Name</Label>
        <Input
          id="exerciseName"
          placeholder="e.g. Bench Press"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="muscleGroup">Muscle Group</Label>
        <select
          id="muscleGroup"
          value={muscleGroup}
          onChange={(e) => setMuscleGroup(e.target.value)}
          className="flex h-9 w-full rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="" className="bg-background text-foreground">Select...</option>
          {MUSCLE_GROUPS.map((mg) => (
            <option key={mg} value={mg} className="bg-background text-foreground">
              {mg}
            </option>
          ))}
        </select>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isUnilateral}
          onChange={(e) => setIsUnilateral(e.target.checked)}
          className="rounded border-input"
        />
        Unilateral (left/right)
      </label>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button type="submit" className="flex-1 gap-1" disabled={isPending}>
          <Check className="h-4 w-4" />
          {isPending ? "Creating..." : "Create"}
        </Button>
      </div>
    </form>
  );
}
