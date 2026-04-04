"use client";

import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { TopBar } from "@/components/layout/top-bar";
import { PageContainer } from "@/components/layout/page-container";
import {
  getExerciseHistory,
  getExerciseById,
} from "@/actions/history";
import type { ExerciseHistoryPoint } from "@/actions/history";
import { ExerciseHistorySkeleton } from "@/components/skeletons/exercise-history-skeleton";
import { Dumbbell, TrendingUp } from "lucide-react";

interface ChartData {
  date: string;
  volume: number;
  bestWeight: number;
}

function formatChartData(points: ExerciseHistoryPoint[]): ChartData[] {
  return points.map((p) => ({
    date: new Date(p.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    volume: p.volume,
    bestWeight: p.bestWeight,
  }));
}

export function ExerciseHistoryScreen({
  exerciseId,
}: {
  exerciseId: string;
}) {
  const { data: exercise } = useQuery({
    queryKey: ["exercise", exerciseId],
    queryFn: () => getExerciseById(exerciseId),
  });

  const { data: history = [], isLoading } = useQuery<ExerciseHistoryPoint[]>({
    queryKey: ["exercise-history", exerciseId],
    queryFn: () => getExerciseHistory(exerciseId),
  });

  const chartData = formatChartData(history);
  const recentSessions = [...history].reverse().slice(0, 20);

  return (
    <>
      <TopBar title={exercise?.name ?? "Exercise History"} showBack />
      <PageContainer className="py-4 space-y-6">
        {isLoading ? (
          <ExerciseHistorySkeleton />
        ) : history.length === 0 ? (
          <div className="py-12 text-center">
            <Dumbbell className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-muted-foreground">
              No history yet. Complete a workout with this exercise to see your
              progress.
            </p>
          </div>
        ) : (
          <>
            {/* Volume chart */}
            <section className="space-y-2">
              <h3 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <TrendingUp className="h-3.5 w-3.5" />
                Volume Over Time
              </h3>
              <div className="rounded-xl border bg-card p-3">
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      dataKey="date"
                      tick={{
                        fontSize: 11,
                        fill: "hsl(var(--muted-foreground))",
                      }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{
                        fontSize: 11,
                        fill: "hsl(var(--muted-foreground))",
                      }}
                      tickLine={false}
                      axisLine={false}
                      width={45}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="volume"
                      stroke="hsl(var(--chart-1))"
                      strokeWidth={2}
                      dot={{ r: 3, fill: "hsl(var(--chart-1))" }}
                      name="Volume (lbs)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Best weight chart */}
            <section className="space-y-2">
              <h3 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Dumbbell className="h-3.5 w-3.5" />
                Best Weight Per Session
              </h3>
              <div className="rounded-xl border bg-card p-3">
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      dataKey="date"
                      tick={{
                        fontSize: 11,
                        fill: "hsl(var(--muted-foreground))",
                      }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{
                        fontSize: 11,
                        fill: "hsl(var(--muted-foreground))",
                      }}
                      tickLine={false}
                      axisLine={false}
                      width={45}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="bestWeight"
                      stroke="hsl(var(--chart-3))"
                      strokeWidth={2}
                      dot={{ r: 3, fill: "hsl(var(--chart-3))" }}
                      name="Best Weight (lbs)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Recent sessions list */}
            <section className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                Recent Sessions
              </h3>
              <div className="space-y-2">
                {recentSessions.map((session, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-xl border bg-card p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {new Date(session.date).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {session.totalSets} sets &middot; Best:{" "}
                        {session.bestWeight} x {session.bestReps}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold tabular-nums">
                        {session.volume.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">volume</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </PageContainer>
    </>
  );
}
