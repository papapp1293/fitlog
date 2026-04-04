"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Check } from "lucide-react";

interface SetData {
  id: string;
  setNumber: number;
  weight: number | null;
  reps: number | null;
  rir: number | null;
  side: string | null;
  completed: boolean;
}

interface SetTableProps {
  sessionExerciseId: string;
  sets: SetData[];
  isUnilateral: boolean;
  onLogSet: (
    setNumber: number,
    data: {
      weight?: number | null;
      reps?: number | null;
      rir?: number | null;
      side?: "L" | "R" | null;
    }
  ) => Promise<void>;
  onDeleteSet: (setId: string) => Promise<void>;
}

export function SetTable({
  sets,
  isUnilateral,
  onLogSet,
  onDeleteSet,
}: SetTableProps) {
  const [newSet, setNewSet] = useState<{
    weight: string;
    reps: string;
    rir: string;
  }>({ weight: "", reps: "", rir: "" });
  const [saving, setSaving] = useState(false);

  const nextSetNumber = sets.length > 0 ? Math.max(...sets.map((s) => s.setNumber)) + 1 : 1;

  async function handleAddSet(side?: "L" | "R") {
    setSaving(true);
    await onLogSet(nextSetNumber, {
      weight: newSet.weight ? Number(newSet.weight) : null,
      reps: newSet.reps ? Number(newSet.reps) : null,
      rir: newSet.rir ? Number(newSet.rir) : null,
      side: side ?? null,
    });
    setNewSet({ weight: "", reps: "", rir: "" });
    setSaving(false);
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[3rem_1fr_1fr_1fr_2.5rem] gap-1 px-3 py-2 text-xs font-medium text-muted-foreground uppercase border-b">
        <span>Set</span>
        <span>Weight</span>
        <span>Reps</span>
        <span>RIR</span>
        <span />
      </div>

      {/* Logged sets */}
      {sets.map((set) => (
        <div
          key={set.id}
          className="grid grid-cols-[3rem_1fr_1fr_1fr_2.5rem] gap-1 items-center px-3 py-2 border-b last:border-0"
        >
          <span className="text-sm font-medium text-muted-foreground">
            {set.setNumber}
            {set.side ? ` ${set.side}` : ""}
          </span>
          <span className="text-sm font-semibold">
            {set.weight != null ? set.weight : "—"}
          </span>
          <span className="text-sm font-semibold">
            {set.reps != null ? set.reps : "—"}
          </span>
          <span className="text-sm text-muted-foreground">
            {set.rir != null ? set.rir : "—"}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onDeleteSet(set.id)}
          >
            <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </div>
      ))}

      {/* New set input */}
      <div className="grid grid-cols-[3rem_1fr_1fr_1fr_2.5rem] gap-1 items-center px-3 py-2 bg-muted/30">
        <span className="text-sm font-medium text-muted-foreground">
          {nextSetNumber}
        </span>
        <Input
          type="number"
          inputMode="decimal"
          placeholder="0"
          value={newSet.weight}
          onChange={(e) => setNewSet((s) => ({ ...s, weight: e.target.value }))}
          className="h-8 text-sm"
        />
        <Input
          type="number"
          inputMode="numeric"
          placeholder="0"
          value={newSet.reps}
          onChange={(e) => setNewSet((s) => ({ ...s, reps: e.target.value }))}
          className="h-8 text-sm"
        />
        <Input
          type="number"
          inputMode="numeric"
          placeholder="0"
          value={newSet.rir}
          onChange={(e) => setNewSet((s) => ({ ...s, rir: e.target.value }))}
          className="h-8 text-sm"
        />
        <div />
      </div>

      {/* Add set buttons */}
      <div className="p-3 border-t">
        {isUnilateral ? (
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => handleAddSet("L")}
              disabled={saving}
            >
              <Check className="h-3.5 w-3.5" />
              Left
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => handleAddSet("R")}
              disabled={saving}
            >
              <Check className="h-3.5 w-3.5" />
              Right
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-1"
            onClick={() => handleAddSet()}
            disabled={saving}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Set
          </Button>
        )}
      </div>
    </div>
  );
}
