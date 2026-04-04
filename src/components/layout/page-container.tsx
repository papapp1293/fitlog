import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  bottomNavPadding?: boolean;
}

export function PageContainer({
  children,
  className,
  bottomNavPadding = true,
}: PageContainerProps) {
  return (
    <main
      className={cn(
        "mx-auto w-full max-w-md flex-1 px-4",
        bottomNavPadding && "pb-20",
        className
      )}
    >
      {children}
    </main>
  );
}
