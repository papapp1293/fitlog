import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { WorkoutDetailScreen } from "@/components/workout/workout-detail-screen";

export default async function WorkoutDetailPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { sessionId } = await params;
  return <WorkoutDetailScreen sessionId={sessionId} />;
}
