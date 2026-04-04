import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ExerciseHistoryScreen } from "@/components/exercise/exercise-history-screen";

export default async function ExerciseHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  return <ExerciseHistoryScreen exerciseId={id} />;
}
