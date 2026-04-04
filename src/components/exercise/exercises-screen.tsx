"use client";

import { useState, useTransition } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { TopBar } from "@/components/layout/top-bar";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Trash2 } from "lucide-react";
import { getExercises, createExercise, deleteExercise } from "@/actions/exercise";
import { MUSCLE_GROUPS } from "@/lib/constants";
import { toast } from "sonner";

interface ExerciseItem {
  id: string;
  name: string;
  muscleGroup: string | null;
  isUnilateral: boolean;
}

export function ExercisesScreen() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: exercises = [], isLoading } = useQuery<ExerciseItem[]>({
    queryKey: ["exercises"],
    queryFn: () => getExercises(),
  });

  const filtered = exercises.filter((e: ExerciseItem) =>
    e.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <TopBar title="Exercises" />
      <PageContainer className="py-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search exercises..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="space-y-2">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-xl bg-muted"
              />
            ))
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              {search ? "No exercises found" : "No exercises yet. Create one!"}
            </p>
          ) : (
            filtered.map((exercise) => (
              <ExerciseRow
                key={exercise.id}
                exercise={exercise}
                onDelete={async () => {
                  const result = await deleteExercise(exercise.id);
                  if (result.success) {
                    queryClient.invalidateQueries({ queryKey: ["exercises"] });
                    toast.success("Exercise deleted");
                  } else {
                    toast.error(result.error);
                  }
                }}
              />
            ))
          )}
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger>
            <Button className="w-full gap-2" size="lg">
              <Plus className="h-4 w-4" />
              New Exercise
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Exercise</DialogTitle>
            </DialogHeader>
            <CreateExerciseForm
              onSuccess={() => {
                setDialogOpen(false);
                queryClient.invalidateQueries({ queryKey: ["exercises"] });
              }}
            />
          </DialogContent>
        </Dialog>
      </PageContainer>
    </>
  );
}

function ExerciseRow({
  exercise,
  onDelete,
}: {
  exercise: { id: string; name: string; muscleGroup: string | null; isUnilateral: boolean };
  onDelete: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{exercise.name}</p>
        <div className="flex gap-2 mt-1">
          {exercise.muscleGroup && (
            <Badge variant="secondary" className="text-xs">
              {exercise.muscleGroup}
            </Badge>
          )}
          {exercise.isUnilateral && (
            <Badge variant="outline" className="text-xs">
              Unilateral
            </Badge>
          )}
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
        disabled={isPending}
        onClick={() => startTransition(onDelete)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

function CreateExerciseForm({ onSuccess }: { onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [muscleGroup, setMuscleGroup] = useState("");
  const [isUnilateral, setIsUnilateral] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await createExercise({
        name,
        isUnilateral,
        muscleGroup: muscleGroup || undefined,
      });
      if (result.success) {
        toast.success("Exercise created");
        onSuccess();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
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
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">None</option>
          {MUSCLE_GROUPS.map((mg) => (
            <option key={mg} value={mg}>
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
          className="rounded"
        />
        Unilateral exercise (left/right)
      </label>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Creating..." : "Create Exercise"}
      </Button>
    </form>
  );
}
