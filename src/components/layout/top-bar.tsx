"use client";

import { ArrowLeft, MoreVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TopBarProps {
  title: string;
  showBack?: boolean;
  actions?: { label: string; onClick: () => void; variant?: "destructive" }[];
  rightContent?: React.ReactNode;
  sticky?: boolean;
}

export function TopBar({ title, showBack, actions, rightContent, sticky = true }: TopBarProps) {
  const router = useRouter();

  return (
    <header className={`${sticky ? "sticky top-0 z-40" : ""} border-b bg-background/80 backdrop-blur-lg`}>
      <div className="mx-auto flex h-14 max-w-md items-center gap-3 px-4">
        {showBack && (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}

        <h1 className="flex-1 truncate text-lg font-semibold">{title}</h1>

        {rightContent}

        {actions && actions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {actions.map((action) => (
                <DropdownMenuItem
                  key={action.label}
                  onClick={action.onClick}
                  className={
                    action.variant === "destructive"
                      ? "text-destructive focus:text-destructive"
                      : ""
                  }
                >
                  {action.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
