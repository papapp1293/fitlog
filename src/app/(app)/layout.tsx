import { BottomNav } from "@/components/layout/bottom-nav";
import { ErrorBoundary } from "@/components/error-boundary";
import { PageTransition } from "@/components/layout/page-transition";
import { OfflineIndicator } from "@/components/pwa/offline-indicator";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <OfflineIndicator />
      <ErrorBoundary>
        <PageTransition>
          {children}
        </PageTransition>
      </ErrorBoundary>
      <BottomNav />
    </>
  );
}
