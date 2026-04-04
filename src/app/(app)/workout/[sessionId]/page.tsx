import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ActiveWorkoutScreen } from "@/components/workout/active-workout-screen";

export default async function ActiveWorkoutPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { sessionId } = await params;
  return <ActiveWorkoutScreen sessionId={sessionId} />;
}
