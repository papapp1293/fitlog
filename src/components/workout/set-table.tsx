"use client";

import { useState, useRef } from "react";
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

interface PreviousSetData {
  setNumber: number;
  weight: number | null;
  reps: number | null;
  rir: number | null;
  side: string | null;
}

interface SetTableProps {
  sessionExerciseId: string;
  sets: SetData[];
  isUnilateral: boolean;
  previousSets?: PreviousSetData[];
  onLogSet: (
    setNumber: number,
    data: {
      weight?: number | null;
      reps?: number | null;
      rir?: number | null;
      side?: "L" | "R" | null;
    }
  ) => Promise<void>;
  onUpdateSet: (
    setId: string,
    data: { weight?: number | null; reps?: number | null; rir?: number | null }
  ) => Promise<void>;
  onDeleteSet: (setId: string) => Promise<void>;
}

export function SetTable({
  sets,
  isUnilateral,
  previousSets,
  onLogSet,
  onUpdateSet,
  onDeleteSet,
}: SetTableProps) {
  const [newSet, setNewSet] = useState<{
    weight: string;
    reps: string;
    rir: string;
  }>({ weight: "", reps: "", rir: "" });
  const [saving, setSaving] = useState(false);

  const nextSetNumber =
    sets.length > 0 ? Math.max(...sets.map((s) => s.setNumber)) + 1 : 1;

  // Find matching previous set for autofill
  const prevSet = previousSets?.find((p) => p.setNumber === nextSetNumber);

  async function handleAddSet(side?: "L" | "R") {
    setSaving(true);
    await onLogSet(nextSetNumber, {
      weight: newSet.weight
        ? Number(newSet.weight)
        : prevSet?.weight ?? null,
      reps: newSet.reps
        ? Number(newSet.reps)
        : prevSet?.reps ?? null,
      rir: newSet.rir
        ? Number(newSet.rir)
        : prevSet?.rir ?? null,
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
        <EditableSetRow
          key={set.id}
          set={set}
          onUpdate={onUpdateSet}
          onDelete={onDeleteSet}
        />
      ))}

      {/* New set input with previous-set placeholders */}
      <div className="grid grid-cols-[3rem_1fr_1fr_1fr_2.5rem] gap-1 items-center px-3 py-2 bg-muted/30">
        <span className="text-sm font-medium text-muted-foreground">
          {nextSetNumber}
        </span>
        <Input
          type="number"
          inputMode="decimal"
          placeholder={prevSet?.weight != null ? String(prevSet.weight) : "0"}
          value={newSet.weight}
          onChange={(e) =>
            setNewSet((s) => ({ ...s, weight: e.target.value }))
          }
          className={`h-8 text-sm ${
            !newSet.weight && prevSet?.weight != null
              ? "placeholder:text-muted-foreground/50"
              : ""
          }`}
        />
        <Input
          type="number"
          inputMode="numeric"
          placeholder={prevSet?.reps != null ? String(prevSet.reps) : "0"}
          value={newSet.reps}
          onChange={(e) =>
            setNewSet((s) => ({ ...s, reps: e.target.value }))
          }
          className={`h-8 text-sm ${
            !newSet.reps && prevSet?.reps != null
              ? "placeholder:text-muted-foreground/50"
              : ""
          }`}
        />
        <Input
          type="number"
          inputMode="numeric"
          placeholder={prevSet?.rir != null ? String(prevSet.rir) : "0"}
          value={newSet.rir}
          onChange={(e) =>
            setNewSet((s) => ({ ...s, rir: e.target.value }))
          }
          className={`h-8 text-sm ${
            !newSet.rir && prevSet?.rir != null
              ? "placeholder:text-muted-foreground/50"
              : ""
          }`}
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

function EditableSetRow({
  set,
  onUpdate,
  onDelete,
}: {
  set: SetData;
  onUpdate: (
    setId: string,
    data: { weight?: number | null; reps?: number | null; rir?: number | null }
  ) => Promise<void>;
  onDelete: (setId: string) => Promise<void>;
}) {
  const [editingField, setEditingField] = useState<
    "weight" | "reps" | "rir" | null
  >(null);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function startEdit(field: "weight" | "reps" | "rir") {
    const current = set[field];
    setEditingField(field);
    setEditValue(current != null ? String(current) : "");
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  async function commitEdit() {
    if (editingField === null) return;
    const field = editingField;
    setEditingField(null);

    const numValue = editValue === "" ? null : Number(editValue);
    const currentValue = set[field];

    // Only update if value actually changed
    if (numValue !== currentValue) {
      await onUpdate(set.id, { [field]: numValue });
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      commitEdit();
    } else if (e.key === "Escape") {
      setEditingField(null);
    }
  }

  function renderCell(field: "weight" | "reps" | "rir", className: string) {
    const value = set[field];

    if (editingField === field) {
      return (
        <Input
          ref={inputRef}
          type="number"
          inputMode={field === "weight" ? "decimal" : "numeric"}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={handleKeyDown}
          className="h-7 text-sm"
        />
      );
    }

    return (
      <button
        onClick={() => startEdit(field)}
        className={`text-left w-full rounded px-1 -mx-1 transition-colors hover:bg-accent ${className}`}
      >
        {value != null ? value : "—"}
      </button>
    );
  }

  return (
    <div className="grid grid-cols-[3rem_1fr_1fr_1fr_2.5rem] gap-1 items-center px-3 py-2 border-b last:border-0">
      <span className="text-sm font-medium text-muted-foreground">
        {set.setNumber}
        {set.side ? ` ${set.side}` : ""}
      </span>
      {renderCell("weight", "text-sm font-semibold")}
      {renderCell("reps", "text-sm font-semibold")}
      {renderCell("rir", "text-sm text-muted-foreground")}
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={() => onDelete(set.id)}
      >
        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
      </Button>
    </div>
  );
}
