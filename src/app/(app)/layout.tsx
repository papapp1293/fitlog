import { BottomNav } from "@/components/layout/bottom-nav";
import { ErrorBoundary } from "@/components/error-boundary";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
      <BottomNav />
    </>
  );
}
