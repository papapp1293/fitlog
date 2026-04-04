import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TemplatesScreen } from "@/components/workout/templates-screen";

export default async function TemplatesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return <TemplatesScreen />;
}
