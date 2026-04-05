import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { WorkoutHistoryScreen } from "@/components/workout/workout-history-screen";

export default async function HistoryPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return <WorkoutHistoryScreen />;
}
