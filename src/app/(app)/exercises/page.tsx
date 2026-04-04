import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ExercisesScreen } from "@/components/exercise/exercises-screen";

export default async function ExercisesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return <ExercisesScreen />;
}
