"use client";

import {
  LineChart,
  Line,
  ResponsiveContainer,
  YAxis,
} from "recharts";
import { Scale, ChevronRight } from "lucide-react";
import Link from "next/link";

interface BodyweightLog {
  id: string;
  weight: number;
  date: Date;
}

export function HomeBodyweightCard({ logs }: { logs: BodyweightLog[] }) {
  const sorted = [...logs].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const latest = sorted.length > 0 ? sorted[sorted.length - 1] : null;
  const previous = sorted.length > 1 ? sorted[sorted.length - 2] : null;
  const diff = latest && previous ? latest.weight - previous.weight : null;

  const chartData = sorted.slice(-14).map((log) => ({
    weight: log.weight,
  }));

  return (
    <Link href="/profile">
      <section className="rounded-xl border bg-card p-4 transition-colors hover:bg-accent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Bodyweight
            </h3>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>

        {latest ? (
          <div className="mt-3 flex items-end justify-between gap-4">
            <div>
              <p className="text-2xl font-bold">
                {latest.weight}{" "}
                <span className="text-sm font-normal text-muted-foreground">lbs</span>
              </p>
              {diff !== null && (
                <p className={`text-xs mt-0.5 ${diff > 0 ? "text-orange-400" : diff < 0 ? "text-green-400" : "text-muted-foreground"}`}>
                  {diff > 0 ? "+" : ""}{diff.toFixed(1)} lbs from last
                </p>
              )}
            </div>
            {chartData.length >= 2 && (
              <div className="h-12 w-24 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <YAxis domain={["dataMin - 0.5", "dataMax + 0.5"]} hide />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      stroke="#60a5fa"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            No entries yet. Tap to log your weight.
          </p>
        )}
      </section>
    </Link>
  );
}
