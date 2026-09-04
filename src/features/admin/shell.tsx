import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { BarChart3, FileText, Headphones, Home, LayoutGrid, LifeBuoy } from "lucide-react";
import { useAdmin } from "@/lib/admin/store";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/admin", label: "Home", icon: Home },
  { to: "/admin/subs", label: "Subscribers", icon: LayoutGrid },
  { to: "/admin/content", label: "Content", icon: FileText },
  { to: "/admin/tickets", label: "Tickets", icon: LifeBuoy, badge: true },
] as const;

export function AdminShell() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const openTickets = useAdmin((s) => s.tickets.filter((t) => t.status !== "closed").length);

  return (
    <div className="flex h-dvh overflow-hidden bg-background text-foreground">
      <aside className="hidden w-52 shrink-0 flex-col border-r border-border bg-sidebar lg:flex">
        <div className="flex h-14 items-center gap-2 border-b border-border px-4">
          <BarChart3 className="size-4 text-primary" />
          <div>
            <div className="text-sm font-semibold leading-none">Melo</div>
            <div className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Admin</div>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 p-2">
          {NAV.map((n) => {
          const active = n.to === "/admin" ? path === "/admin" || path === "/admin/" : path.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "flex h-9 items-center gap-2 rounded-md px-2 text-sm",
                  active ? "bg-muted font-medium" : "text-muted-foreground hover:bg-muted/60",
                )}
              >
                <n.icon className="size-4" />
                {n.label}
                {"badge" in n && n.badge && openTickets ? (
                  <span className="ml-auto rounded-full bg-danger-soft px-1.5 text-[11px] font-medium text-danger">{openTickets}</span>
                ) : null}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-3">
          <Link to="/" className="flex h-9 items-center gap-2 rounded-md px-2 text-sm text-muted-foreground hover:bg-muted/60">
            <Headphones className="size-4" />
            Open office
          </Link>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-canvas px-4">
          <div className="flex items-center gap-2 lg:hidden">
            <BarChart3 className="size-4 text-primary" />
            <span className="text-sm font-semibold">Melo Admin</span>
          </div>
          <nav className="flex min-w-0 flex-1 gap-1 overflow-x-auto lg:hidden">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "h-8 shrink-0 rounded-md px-2.5 text-sm",
                  (n.to === "/admin" ? path === "/admin" || path === "/admin/" : path.startsWith(n.to)) ? "bg-muted font-medium" : "text-muted-foreground",
                )}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto hidden text-xs text-muted-foreground sm:block">Friday 4 Sep · Sydney</div>
          <Link to="/" className="text-xs font-medium text-primary lg:hidden">
            Office
          </Link>
        </header>
        <main className="melo-scroll min-h-0 flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
