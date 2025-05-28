import { Header } from "@/components/layout/header";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { UsersRound, Video, Settings, LogOut, LayoutDashboard } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider defaultOpen={true}>
      <Header />
      <div className="flex flex-1">
        <Sidebar collapsible="icon" className="border-r">
          <SidebarHeader>
            {/* <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden">
              <SidebarTrigger />
            </Button> */}
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <Link href="/admin/patients" className="w-full" legacyBehavior passHref>
                  <SidebarMenuButton tooltip="Patients">
                    <UsersRound />
                    <span>Patients</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/admin/stream" className="w-full" legacyBehavior passHref>
                  <SidebarMenuButton tooltip="Stream Capture">
                    <Video />
                    <span>Stream Capture</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              {/* Add more admin links as needed */}
               <SidebarMenuItem>
                <Link href="/admin/dashboard" className="w-full" legacyBehavior passHref>
                  <SidebarMenuButton tooltip="Dashboard">
                    <LayoutDashboard />
                    <span>Dashboard</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Settings">
                  <Settings />
                  <span>Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                 <Link href="/" className="w-full" legacyBehavior passHref>
                    <SidebarMenuButton tooltip="Logout">
                      <LogOut />
                      <span>Logout</span>
                    </SidebarMenuButton>
                 </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="flex-1 p-4 md:p-6 bg-muted/40 overflow-auto">
          {children}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
