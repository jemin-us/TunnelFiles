import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "tunnelfiles";
import { Server, HardDrive, Archive, Plug } from "lucide-react";

function Frame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`dark bg-background text-foreground p-6 ${className}`}>{children}</div>;
}

const CONNECTIONS = [
  { name: "Production", host: "10.0.1.42", icon: Server, active: true },
  { name: "Staging", host: "staging.example.com", icon: HardDrive, active: false },
  { name: "Backup", host: "backup.example.com", icon: Archive, active: false },
];

export const Nav = () => (
  <Frame className="min-h-[440px]">
    <SidebarProvider className="min-h-0 w-auto">
      <Sidebar collapsible="none" className="border-border w-64 rounded-lg border">
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-1.5">
            <Plug className="size-4 shrink-0" />
            <span className="font-medium">TunnelFiles</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Connections</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {CONNECTIONS.map((c) => (
                  <SidebarMenuItem key={c.name}>
                    <SidebarMenuButton isActive={c.active}>
                      <c.icon />
                      <span>{c.name}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <div className="text-muted-foreground px-2 py-1 text-xs">3 saved · 1 connected</div>
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  </Frame>
);
