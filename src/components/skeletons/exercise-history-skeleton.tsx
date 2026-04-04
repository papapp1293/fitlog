import { Skeleton } from "@/components/ui/skeleton";

export function ExerciseHistorySkeleton() {
  return (
    <div className="space-y-6">
      {/* Charts */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-[200px] rounded-xl" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-[200px] rounded-xl" />
      </div>
      {/* Recent sessions */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-28" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
