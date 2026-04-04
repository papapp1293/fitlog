import { Skeleton } from "@/components/ui/skeleton";

export function WorkoutSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-7 w-7 rounded-full" />
            <Skeleton className="h-5 w-32" />
          </div>
          <Skeleton className="h-32 rounded-xl" />
        </div>
      ))}
    </div>
  );
}
