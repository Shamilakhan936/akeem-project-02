import { Brain, LayoutDashboard, Bot, BarChart3, Settings, LogOut, Users, Network, ClipboardList, Activity, TrendingUp, Globe, ShieldCheck, GitBranch, Building2, Zap, Code2, Webhook, Package } from "lucide-react";
import { NavLink } from "@/components/common/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Overview", url: "/dashboard", icon: LayoutDashboard },
  { title: "Transactions", url: "/dashboard/transactions", icon: ShieldCheck },
  { title: "Agents", url: "/dashboard/agents", icon: Bot },
  { title: "Pilot Companies", url: "/dashboard/pilots", icon: Building2 },
  { title: "Knowledge Graph", url: "/dashboard/knowledge-graph", icon: GitBranch },
  { title: "Decisions", url: "/dashboard/decisions", icon: ClipboardList },
  { title: "Intelligence", url: "/dashboard/intelligence", icon: Network },
  { title: "Feedback", url: "/dashboard/feedback", icon: Activity },
  { title: "Network Effect", url: "/dashboard/network-effect", icon: Zap },
  { title: "Metrics", url: "/dashboard/metrics", icon: TrendingUp },
  { title: "Scale", url: "/dashboard/scale", icon: Globe },
  { title: "PayLaterr", url: "/dashboard/paylaterr", icon: Zap },
  { title: "Package API", url: "/dashboard/api", icon: Package },
  { title: "API & SDK", url: "/dashboard/marketplace", icon: Code2 },
  { title: "Webhooks", url: "/dashboard/webhooks", icon: Webhook },
  { title: "Teams", url: "/dashboard/teams", icon: Users },
  { title: "Analytics", url: "/dashboard/analytics", icon: BarChart3 },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { signOut } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 py-3">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary shrink-0" />
              {!collapsed && <span className="font-bold text-foreground">Synapse</span>}
            </div>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-muted/50"
                      activeClassName="bg-primary/10 text-primary font-medium"
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut} className="text-muted-foreground hover:text-foreground">
              <LogOut className="w-4 h-4 shrink-0" />
              {!collapsed && <span>Sign Out</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
