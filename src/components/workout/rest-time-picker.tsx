"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Delete } from "lucide-react";

interface RestTimePickerProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (seconds: number) => void;
}

/**
 * Calculator-style MM:SS time picker.
 * Digits fill right-to-left: tap 1 → 00:01, tap 3 → 00:13, tap 0 → 01:30, etc.
 * Max 4 digits (99:59).
 */
export function RestTimePicker({ open, onClose, onConfirm }: RestTimePickerProps) {
  const [digits, setDigits] = useState<string>("");

  const display = formatDigits(digits);
  const totalSeconds = digitsToSeconds(digits);

  const handleDigit = useCallback((d: string) => {
    setDigits((prev) => {
      if (prev.length >= 4) return prev;
      return prev + d;
    });
  }, []);

  const handleBackspace = useCallback(() => {
    setDigits((prev) => prev.slice(0, -1));
  }, []);

  const handleConfirm = useCallback(() => {
    if (totalSeconds > 0) {
      onConfirm(totalSeconds);
      setDigits("");
    }
  }, [totalSeconds, onConfirm]);

  const handleClose = useCallback(() => {
    setDigits("");
    onClose();
  }, [onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={handleClose}
      />

      {/* Picker panel */}
      <div className="relative z-10 w-[calc(100%-2rem)] max-w-sm rounded-2xl bg-card border p-5 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Display */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-2">Set rest timer</p>
          <div className="font-mono text-5xl font-bold tabular-nums tracking-wider">
            <span className={digits.length < 3 ? "text-muted-foreground/40" : ""}>
              {display.slice(0, 2)}
            </span>
            <span className="text-muted-foreground/60">:</span>
            <span className={digits.length === 0 ? "text-muted-foreground/40" : ""}>
              {display.slice(3, 5)}
            </span>
          </div>
          {totalSeconds > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {totalSeconds >= 60
                ? `${Math.floor(totalSeconds / 60)}m ${totalSeconds % 60 > 0 ? `${totalSeconds % 60}s` : ""}`
                : `${totalSeconds}s`}
            </p>
          )}
        </div>

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-2">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
            <button
              key={d}
              onClick={() => handleDigit(d)}
              className="h-14 rounded-xl bg-muted text-xl font-semibold transition-colors active:bg-muted-foreground/20"
            >
              {d}
            </button>
          ))}
          <button
            onClick={handleBackspace}
            className="h-14 rounded-xl bg-muted flex items-center justify-center transition-colors active:bg-muted-foreground/20"
          >
            <Delete className="h-5 w-5" />
          </button>
          <button
            onClick={() => handleDigit("0")}
            className="h-14 rounded-xl bg-muted text-xl font-semibold transition-colors active:bg-muted-foreground/20"
          >
            0
          </button>
          <button
            onClick={() => {
              setDigits((prev) => {
                if (prev.length >= 3) return prev;
                return prev + "00";
              });
            }}
            className="h-14 rounded-xl bg-muted text-lg font-semibold transition-colors active:bg-muted-foreground/20"
          >
            00
          </button>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={handleClose} className="h-12">
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={totalSeconds === 0}
            className="h-12"
          >
            Set Timer
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Pads raw digits into "MM:SS" display */
function formatDigits(raw: string): string {
  const padded = raw.padStart(4, "0");
  return `${padded.slice(0, 2)}:${padded.slice(2, 4)}`;
}

/** Converts raw digit string to total seconds */
function digitsToSeconds(raw: string): number {
  if (!raw) return 0;
  const padded = raw.padStart(4, "0");
  const minutes = parseInt(padded.slice(0, 2), 10);
  const seconds = parseInt(padded.slice(2, 4), 10);
  return minutes * 60 + seconds;
}
