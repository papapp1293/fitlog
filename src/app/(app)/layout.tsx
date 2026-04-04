import { BottomNav } from "@/components/layout/bottom-nav";
import { ErrorBoundary } from "@/components/error-boundary";
import { PageTransition } from "@/components/layout/page-transition";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ErrorBoundary>
        <PageTransition>
          {children}
        </PageTransition>
      </ErrorBoundary>
      <BottomNav />
    </>
  );
}
