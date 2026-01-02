"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { SidebarMenuButton } from "./ui/sidebar";

type variantType =
  | "default"
  | "destructive"
  | "outline"
  | "secondary"
  | "ghost"
  | "link";

export function SignOutButton({
  variant = "default",
  ...props
}: {
  variant?: variantType;
}) {
  return (
    <Button
      variant={variant}
      onClick={() => signOut({ callbackUrl: "/" })}
      {...props}
    >
      Sign Out
    </Button>
  );
}

export function SidebarSignOutButton() {
  return (
    <SidebarMenuButton
      className="text-muted-foreground"
      size="lg"
      onClick={() => signOut({ callbackUrl: "/" })}
    >
      <div className="flex items-center gap-2">
        <LogOut size={16} />
        <span>Sign Out</span>
      </div>
    </SidebarMenuButton>
  );
}
