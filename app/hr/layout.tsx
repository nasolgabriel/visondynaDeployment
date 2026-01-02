import HrHeader from "@/components/hr/hr-header";
import { SidebarSignOutButton } from "@/components/signout-button";
import {
  SidebarProvider,
  Sidebar,
  SidebarFooter,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import HrNavigation from "@/components/hr/hr-navigation";
import SessionWrapper from "@/components/session-wrapper";

export default function HrLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex h-dvh w-full">
        <Sidebar>
          <SidebarHeader>
            <SidebarGroup>
              <p className="w-full text-center text-xl font-semibold text-lime-500">
                Visondyna | HR
              </p>
            </SidebarGroup>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>

              <SidebarGroupContent>
                <HrNavigation />
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
            <HrHeader />
          </SessionWrapper>
          <main className="min-h-0 min-w-0 overflow-y-auto bg-slate-50 p-6 dark:bg-slate-950">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
