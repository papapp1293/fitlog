import { Skeleton } from "@/components/ui/skeleton";

export function HomeSkeleton() {
  return (
    <div className="space-y-6">
      {/* Weekly calendar */}
      <Skeleton className="h-20 rounded-xl" />
      {/* Start button */}
      <Skeleton className="h-14 rounded-xl" />
      {/* Stats section */}
      <div className="space-y-3 pt-4">
        <Skeleton className="h-4 w-24" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
