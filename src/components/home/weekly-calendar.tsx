"use client";

import { cn } from "@/lib/utils";

export function WeeklyCalendar() {
  const today = new Date();
  const dayOfWeek = today.getDay();

  // Start from Monday
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return date;
  });

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
        This Week
      </h2>
      <div className="flex gap-2">
        {days.map((date, i) => {
          const isToday = date.toDateString() === today.toDateString();
          const isPast = date < today && !isToday;

          return (
            <div
              key={i}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 rounded-xl py-3 transition-colors",
                isToday
                  ? "bg-primary text-primary-foreground"
                  : isPast
                  ? "text-muted-foreground"
                  : "text-foreground"
              )}
            >
              <span className="text-[10px] font-medium uppercase">
                {dayNames[i]}
              </span>
              <span className="text-sm font-semibold">{date.getDate()}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
