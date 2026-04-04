import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ProfileScreen } from "@/components/profile/profile-screen";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return <ProfileScreen user={session.user} />;
}
