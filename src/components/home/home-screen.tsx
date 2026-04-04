"use client";

import { PageContainer } from "@/components/layout/page-container";
import { WeeklyCalendar } from "@/components/home/weekly-calendar";
import { Button } from "@/components/ui/button";
import { Dumbbell, Plus } from "lucide-react";
import Link from "next/link";

export function HomeScreen() {
  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-md items-center gap-3 px-4">
          <Dumbbell className="h-6 w-6 text-primary" />
          <h1 className="text-lg font-semibold">Gym Tracker</h1>
        </div>
      </header>

      <PageContainer className="py-6 space-y-6">
        <WeeklyCalendar />

        <Link href="/workout">
          <Button className="w-full h-14 text-lg font-semibold gap-2" size="lg">
            <Plus className="h-5 w-5" />
            Start Training
          </Button>
        </Link>

        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Quick Stats
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="This Week" value="0" unit="workouts" />
            <StatCard label="This Month" value="0" unit="workouts" />
          </div>
        </section>
      </PageContainer>
    </>
  );
}

function StatCard({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold mt-1">
        {value} <span className="text-sm font-normal text-muted-foreground">{unit}</span>
      </p>
    </div>
  );
}
