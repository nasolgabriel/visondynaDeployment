"use client";

import { BriefcaseBusiness, Blocks, Users } from "lucide-react";
import Link from "next/link";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "../ui/sidebar";
import { usePathname } from "next/navigation";

const items = [
  { href: "/admin/dashboard", label: "Dashboard", icon: Blocks },
  { href: "/admin/jobs", label: "Jobs", icon: BriefcaseBusiness },
  { href: "/admin/users", label: "Users", icon: Users },
];

export default function AdminNavigation() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {items.map((item) => {
        const isActive = item.href === pathname;

        return (
          <SidebarMenuItem key={item.href} className="min-w-0">
            <SidebarMenuButton
              className="text-muted-foreground"
              size="lg"
              tooltip={item.label}
              isActive={isActive}
              asChild
            >
              <Link
                href={item.href}
                className="flex min-w-0 items-center gap-2"
              >
                <item.icon />
                <span>{item.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
