import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { WorkoutSelectScreen } from "@/components/workout/workout-select-screen";

export default async function WorkoutPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return <WorkoutSelectScreen />;
}
