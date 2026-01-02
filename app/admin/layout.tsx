import AdminHeader from "@/components/admin/admin-header";
import AdminNavigation from "@/components/admin/admin-navigation";
import SessionWrapper from "@/components/session-wrapper";
import { SidebarSignOutButton } from "@/components/signout-button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarProvider,
} from "@/components/ui/sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex h-dvh w-full">
        <Sidebar>
          <SidebarHeader>
            <SidebarGroup>
              <p className="w-full text-center text-xl font-semibold text-lime-500">
                Visondyna | Admin
              </p>
            </SidebarGroup>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>

              <SidebarGroupContent>
                <AdminNavigation />
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter>
            <SidebarGroup>
              <SidebarSignOutButton />
            </SidebarGroup>
          </SidebarFooter>
        </Sidebar>

        <div className="grid min-h-0 w-full grid-rows-[60px_1fr]">
          <SessionWrapper>
            <AdminHeader />
          </SessionWrapper>
          <main className="min-h-0 min-w-0 overflow-y-auto bg-slate-50 p-6 dark:bg-slate-950">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
