"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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
  const newSetRowRef = useRef<HTMLDivElement>(null);

  // For unilateral exercises, pair set numbers: 1L, 1R, 2L, 2R
  // Next set number = max set number + 1, unless last set's side is "L" (then same number for "R")
  const lastSet = sets.length > 0 ? sets[sets.length - 1] : null;
  const nextSetNumber = (() => {
    if (sets.length === 0) return 1;
    const maxSetNum = Math.max(...sets.map((s) => s.setNumber));
    if (isUnilateral && lastSet?.side === "L") return maxSetNum;
    return maxSetNum + 1;
  })();

  // Suggest which side to log next for unilateral exercises
  const suggestedSide: "L" | "R" | null = (() => {
    if (!isUnilateral) return null;
    if (!lastSet?.side || lastSet.side === "R") return "L";
    return "R";
  })();

  // Find matching previous set for autofill
  const prevSet = previousSets?.find((p) => p.setNumber === nextSetNumber);

  // Whether the user has typed anything or there are previous values to autofill
  const hasValues = newSet.weight !== "" || newSet.reps !== "" || prevSet != null;

  async function handleAddSet(side?: "L" | "R") {
    if (saving) return;
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

  // Auto-submit when focus leaves the new set row entirely
  function handleNewSetBlur(e: React.FocusEvent) {
    // Check if the new focus target is still inside the new set row
    const row = newSetRowRef.current;
    if (!row) return;
    // relatedTarget is where focus is going
    const next = e.relatedTarget as Node | null;
    if (next && row.contains(next)) return; // still inside, don't submit

    // Only auto-submit for bilateral; unilateral needs explicit L/R choice
    if (isUnilateral || !hasValues) return;
    handleAddSet();
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

      {/* New set input with previous-set placeholders — auto-submits on blur for bilateral */}
      <div
        ref={newSetRowRef}
        onBlur={handleNewSetBlur}
        className="grid grid-cols-[3rem_1fr_1fr_1fr_2.5rem] gap-1 items-center px-3 py-2 bg-muted/30"
      >
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
              variant={suggestedSide === "L" ? "default" : "outline"}
              size="sm"
              className="gap-1"
              onClick={() => handleAddSet("L")}
              disabled={saving}
            >
              <Check className="h-3.5 w-3.5" />
              Left
            </Button>
            <Button
              variant={suggestedSide === "R" ? "default" : "outline"}
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

const AUTO_SAVE_DELAY = 1500; // ms

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
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingFieldRef = useRef<"weight" | "reps" | "rir" | null>(null);

  function startEdit(field: "weight" | "reps" | "rir") {
    // Commit any pending debounced save for a different field
    if (pendingFieldRef.current && pendingFieldRef.current !== field) {
      flushSave();
    }
    const current = set[field];
    setEditingField(field);
    pendingFieldRef.current = field;
    setEditValue(current != null ? String(current) : "");
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  const saveField = useCallback(
    (field: "weight" | "reps" | "rir", value: string) => {
      const numValue = value === "" ? null : Number(value);
      const currentValue = set[field];
      if (numValue !== currentValue) {
        onUpdate(set.id, { [field]: numValue });
      }
    },
    [set, onUpdate]
  );

  function flushSave() {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    if (pendingFieldRef.current) {
      saveField(pendingFieldRef.current, editValue);
      pendingFieldRef.current = null;
    }
  }

  function handleChange(value: string) {
    setEditValue(value);
    // Debounce auto-save while typing
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (editingField) {
        saveField(editingField, value);
      }
    }, AUTO_SAVE_DELAY);
  }

  function commitEdit() {
    if (editingField === null) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    saveField(editingField, editValue);
    pendingFieldRef.current = null;
    setEditingField(null);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      commitEdit();
    } else if (e.key === "Escape") {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      pendingFieldRef.current = null;
      setEditingField(null);
    }
  }

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function renderCell(field: "weight" | "reps" | "rir", className: string) {
    const value = set[field];

    if (editingField === field) {
      return (
        <Input
          ref={inputRef}
          type="number"
          inputMode={field === "weight" ? "decimal" : "numeric"}
          value={editValue}
          onChange={(e) => handleChange(e.target.value)}
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
