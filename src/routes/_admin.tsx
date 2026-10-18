import * as React from "react";
import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useRouter,
  useLocation,
} from "@tanstack/react-router";
import { getAuthSessionFn, logoutFn } from "@/features/auth/server/auth.fn";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Package,
  Tags,
  FileText,
  BarChart3,
  LogOut,
} from "lucide-react";
import { cn } from "cn";

export const Route = createFileRoute("/_admin")({
  beforeLoad: async () => {
    const { user } = await getAuthSessionFn();
    if (!user) {
      throw redirect({
        to: "/login",
      });
    }
    return { user };
  },
  component: AdminLayout,
});

const NAV_ITEMS = [
  {
    to: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    to: "/equipment",
    label: "Equipment",
    icon: Package,
    exact: false,
  },
  {
    to: "/categories",
    label: "Kategori",
    icon: Tags,
    exact: false,
  },
  {
    to: "/invoices",
    label: "Invoice",
    icon: FileText,
    exact: false,
  },
  {
    to: "/statistics",
    label: "Statistik",
    icon: BarChart3,
    exact: false,
  },
];

function AdminLayout() {
  const router = useRouter();
  const location = useLocation();
  const { user } = Route.useRouteContext();
  const [loggingOut, setLoggingOut] = React.useState(false);

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logoutFn();
      await router.invalidate();
      window.location.href = "/login";
    } catch {
      window.location.href = "/login";
    }
  }

  function isLinkActive(to: string, exact: boolean) {
    if (exact) {
      return location.pathname === to;
    }
    return location.pathname.startsWith(to);
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="border-r border-sidebar-border">
        {/* Brand Header */}
        <SidebarHeader className="border-b border-sidebar-border px-4 py-3.5">
          <div className="flex items-center gap-3">
            <img
              src="/marimari-logo.png"
              alt="Mari Mari Outdoor"
              className="size-8 rounded-md object-contain shrink-0 ring-1 ring-border/50"
            />
            <div className="flex flex-col truncate group-data-[collapsible=icon]:hidden">
              <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">
                Mari Mari
              </span>
              <span className="text-[11px] text-muted-foreground">Equipment Admin</span>
            </div>
          </div>
        </SidebarHeader>

        {/* Navigation Menu */}
        <SidebarContent className="p-2">
          <SidebarMenu className="gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isLinkActive(item.to, item.exact);
              return (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton
                    render={<Link to={item.to as any} />}
                    isActive={active}
                    tooltip={item.label}
                    className={cn(
                      "h-9 rounded-lg px-3 text-xs font-medium transition-colors cursor-pointer",
                      active
                        ? "!bg-sidebar-primary !text-sidebar-primary-foreground font-semibold shadow-xs hover:!bg-sidebar-primary/90 hover:!text-sidebar-primary-foreground data-active:!bg-sidebar-primary data-active:!text-sidebar-primary-foreground"
                        : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>

        {/* User Profile & Logout Footer */}
        <SidebarFooter className="border-t border-sidebar-border p-3">
          <div className="mb-2 px-1 text-xs group-data-[collapsible=icon]:hidden">
            <p className="truncate font-medium text-sidebar-foreground">{user.email}</p>
            <p className="text-[11px] text-muted-foreground">Administrator</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full justify-start gap-2 text-xs h-8 cursor-pointer group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
          >
            <LogOut className="size-3.5 text-muted-foreground shrink-0" />
            <span className="group-data-[collapsible=icon]:hidden">
              {loggingOut ? "Keluar..." : "Keluar"}
            </span>
          </Button>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      {/* Main App Inset */}
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-4 md:px-6">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <div className="text-xs font-medium text-muted-foreground">
              {location.pathname === "/" && "Ringkasan & Operasional"}
              {location.pathname.startsWith("/equipment") && "Katalog & Stok Alat"}
              {location.pathname.startsWith("/categories") && "Kategori Alat"}
              {location.pathname.startsWith("/invoices") && "Manajemen Invoice & Sewa"}
              {location.pathname.startsWith("/statistics") && "Statistik & Laporan Pendapatan"}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to={"/invoices/new" as any}
              className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground shadow-xs transition hover:opacity-90 active:scale-[0.98]"
            >
              + Invoice Baru
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
