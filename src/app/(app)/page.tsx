import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { HomeScreen } from "@/components/home/home-screen";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return <HomeScreen />;
}
