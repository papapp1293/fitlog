"use client";

import { signOut } from "next-auth/react";
import Image from "next/image";
import { TopBar } from "@/components/layout/top-bar";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { BodyweightSection } from "@/components/profile/bodyweight-section";

interface ProfileScreenProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function ProfileScreen({ user }: ProfileScreenProps) {
  return (
    <>
      <TopBar title="Profile" />
      <PageContainer className="py-6 space-y-6">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name ?? ""}
                width={80}
                height={80}
                className="h-20 w-20 rounded-full object-cover"
              />
            ) : (
              <User className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          <div className="text-center">
            <h2 className="text-xl font-semibold">{user.name ?? "User"}</h2>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>

        <div className="border-t pt-6">
          <BodyweightSection />
        </div>

        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </PageContainer>
    </>
  );
}
