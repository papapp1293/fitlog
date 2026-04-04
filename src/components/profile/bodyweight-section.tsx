"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Scale } from "lucide-react";
import {
  getBodyweightLogs,
  logBodyweight,
  deleteBodyweightLog,
} from "@/actions/bodyweight";
import { BodyweightSkeleton } from "@/components/skeletons/bodyweight-skeleton";
import { toast } from "sonner";

// Explicit colors for dark-mode SVG (CSS vars don't work in inline SVG attributes with oklch)
const CHART_COLORS = {
  weight: "#60a5fa",   // blue-400
  trend: "#34d399",    // emerald-400
  grid: "rgba(255,255,255,0.1)",
  axis: "#a1a1aa",     // zinc-400
  tooltip: {
    bg: "#27272a",     // zinc-800
    border: "rgba(255,255,255,0.1)",
    text: "#fafafa",   // zinc-50
  },
};

interface BodyweightLog {
  id: string;
  weight: number;
  date: Date;
}

interface ChartPoint {
  date: string;
  weight: number;
  trend: number | null;
}

function computeChartData(logs: BodyweightLog[]): ChartPoint[] {
  const sorted = [...logs].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return sorted.map((log, i) => {
    // 7-point simple moving average
    const windowStart = Math.max(0, i - 6);
    const window = sorted.slice(windowStart, i + 1);
    const avg = window.reduce((sum, l) => sum + l.weight, 0) / window.length;

    return {
      date: new Date(log.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      weight: log.weight,
      trend: window.length >= 3 ? Math.round(avg * 10) / 10 : null,
    };
  });
}

function getTodayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function BodyweightSection() {
  const [weight, setWeight] = useState("");
  const [date, setDate] = useState(getTodayString());
  const queryClient = useQueryClient();

  const { data: logs = [], isLoading } = useQuery<BodyweightLog[]>({
    queryKey: ["bodyweight-logs"],
    queryFn: () => getBodyweightLogs(),
  });

  const logMutation = useMutation({
    mutationFn: (input: { weight: number; date?: string }) => logBodyweight(input),
    onSuccess: (result) => {
      if (result.success) {
        setWeight("");
        setDate(getTodayString());
        queryClient.invalidateQueries({ queryKey: ["bodyweight-logs"] });
        toast.success("Weight logged");
      } else {
        toast.error(result.error);
      }
    },
    onError: () => {
      toast.error("Failed to log weight");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBodyweightLog(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["bodyweight-logs"] });
      const previous = queryClient.getQueryData<BodyweightLog[]>(["bodyweight-logs"]);
      queryClient.setQueryData<BodyweightLog[]>(
        ["bodyweight-logs"],
        (old) => old?.filter((l) => l.id !== id) ?? []
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["bodyweight-logs"], context.previous);
      }
      toast.error("Failed to delete entry");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["bodyweight-logs"] });
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = parseFloat(weight);
    if (isNaN(value) || value <= 0) {
      toast.error("Enter a valid weight");
      return;
    }
    logMutation.mutate({ weight: value, date: date || undefined });
  }

  if (isLoading) {
    return <BodyweightSkeleton />;
  }

  const chartData = computeChartData(logs);
  const recentLogs = [...logs]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  return (
    <section className="space-y-4">
      <h3 className="flex items-center gap-2 font-semibold">
        <Scale className="h-4 w-4 text-muted-foreground" />
        Bodyweight
      </h3>

      {/* Chart */}
      {chartData.length >= 2 ? (
        <div className="rounded-xl border bg-card p-3">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={CHART_COLORS.grid}
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: CHART_COLORS.axis }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={["dataMin - 1", "dataMax + 1"]}
                tick={{ fontSize: 11, fill: CHART_COLORS.axis }}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: CHART_COLORS.tooltip.bg,
                  border: `1px solid ${CHART_COLORS.tooltip.border}`,
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: CHART_COLORS.tooltip.text,
                }}
                labelStyle={{ color: CHART_COLORS.tooltip.text }}
                itemStyle={{ color: CHART_COLORS.tooltip.text }}
              />
              <Line
                type="monotone"
                dataKey="weight"
                stroke={CHART_COLORS.weight}
                strokeWidth={2}
                dot={{ r: 4, fill: CHART_COLORS.weight, stroke: CHART_COLORS.weight }}
                activeDot={{ r: 6, fill: CHART_COLORS.weight, stroke: "#18181b", strokeWidth: 2 }}
                name="Weight"
              />
              <Line
                type="monotone"
                dataKey="trend"
                stroke={CHART_COLORS.trend}
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                connectNulls
                name="Trend"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="rounded-xl border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">
            {chartData.length === 0
              ? "No entries yet. Log your weight to see trends."
              : "Log at least 2 entries to see the chart."}
          </p>
        </div>
      )}

      {/* Input form */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="flex gap-2">
          <Input
            type="number"
            step="0.1"
            min="0"
            placeholder="Weight (lbs)"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={logMutation.isPending}>
            {logMutation.isPending ? "..." : "Log"}
          </Button>
        </div>
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          max={getTodayString()}
          className="w-full text-sm"
        />
      </form>

      {/* Recent logs */}
      {recentLogs.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            Recent
          </p>
          {recentLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between rounded-lg border bg-card px-3 py-2"
            >
              <div className="flex items-baseline gap-2">
                <span className="font-medium">{log.weight} lbs</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(log.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => deleteMutation.mutate(log.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
