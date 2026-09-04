import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronsUpDown, ChevronRight, HelpCircle, Search, Sparkles } from "lucide-react";
import { MeloWordmark } from "@/components/brand/melo-mark";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown";
import { NAV, isBranch, type NavBadge, type NavEntry, type NavLeaf } from "./nav";
import { useMelo } from "@/lib/melo/store";
import { signOut } from "@/lib/auth/client";
import { clearTenantCache } from "@/lib/melo/office-sync";
import { cn } from "@/lib/utils";

function pathActive(pathname: string, to: string) {
  if (to === "/app") return pathname === "/app" || pathname === "/app/";
  if (to === "/app/reception") return pathname === "/app/reception" || pathname === "/app/reception/";
  if (to === "/app/pipeline") return pathname === "/app/pipeline" || pathname === "/app/pipeline/";
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function Sidebar({ onNavigate, previewPath }: { onNavigate?: () => void; previewPath?: string }) {
  const rawPath = useRouterState({ select: (s) => s.location.pathname });
  const pathname = previewPath
    ? previewPath
    : rawPath.startsWith("/preview/")
      ? rawPath.replace("/preview/home", "/app").replace("/preview/billing", "/app/settings").replace("/preview/", "/app/")
      : rawPath;
  const unreadInbox = useMelo((s) => s.conversations.reduce((n, c) => n + c.unread, 0));
  const review = useMelo((s) => s.reviewItems.filter((r) => r.status === "pending").length);
  const reception = useMelo((s) => (s.liveCall?.phase === "live" ? 1 : 0) + s.conversations.filter((c) => c.channel === "voice" && c.unread).length);
  const workspace = useMelo((s) => s.workspace);
  const owner = useMelo((s) => s.workspace.ownerName);
  const setAsk = useMelo((s) => s.setAskOpen);
  const setCmd = useMelo((s) => s.setCommandOpen);
  const setHelp = useMelo((s) => s.setHelpOpen);
  const setTab = useMelo((s) => s.setSettingsTab);
  const navigate = useNavigate();

  const badges: Record<NavBadge, number> = { inbox: unreadInbox, reception, review };
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const autoOpen = useMemo(() => {
    const next: Record<string, boolean> = {};
    for (const section of NAV) {
      for (const item of section.items) {
        if (isBranch(item) && item.children.some((c) => pathActive(pathname, c.to))) next[item.id] = true;
      }
    }
    return next;
  }, [pathname]);

  const expanded = (id: string) => open[id] ?? autoOpen[id] ?? false;

  return (
    <aside className="flex h-full w-[232px] shrink-0 flex-col border-r border-border bg-sidebar">
      <div className="flex h-14 items-center px-4">
        <MeloWordmark />
      </div>
      <button
        type="button"
        onClick={() => setCmd(true)}
        className="mx-3 mb-2 flex h-9 items-center gap-2 rounded-md border border-border bg-canvas px-2.5 text-sm text-muted-foreground hover:bg-muted"
      >
        <Search className="size-3.5" />
        Search
        <span className="ml-auto text-[10px] text-subtle">⌘K</span>
      </button>
      <nav className="melo-scroll flex-1 space-y-4 overflow-y-auto px-2 pb-2">
        {NAV.map((section) => (
          <div key={section.id}>
            <div className="px-2.5 pb-1 text-[10px] font-semibold tracking-[0.08em] text-subtle uppercase">{section.label}</div>
            <div className="space-y-0.5">
              {section.items.map((item) =>
                isBranch(item) ? (
                  <Branch
                    key={item.id}
                    item={item}
                    pathname={pathname}
                    badges={badges}
                    open={expanded(item.id)}
                    onToggle={() => setOpen((s) => ({ ...s, [item.id]: !expanded(item.id) }))}
                    onNavigate={onNavigate}
                  />
                ) : (
                  <Leaf key={item.to} item={item} pathname={pathname} badges={badges} onNavigate={onNavigate} />
                ),
              )}
            </div>
          </div>
        ))}
      </nav>
      <div className="space-y-1 border-t border-border p-2">
        <button
          type="button"
          onClick={() => setAsk(true)}
          className="flex h-9 w-full items-center gap-2 rounded-md px-2.5 text-sm font-medium text-foreground hover:bg-canvas"
        >
          <Sparkles className="size-4 text-primary" />
          Ask Melo
        </button>
        <button
          type="button"
          onClick={() => setHelp(true)}
          className="flex h-9 w-full items-center gap-2 rounded-md px-2.5 text-sm text-muted-foreground hover:bg-canvas hover:text-foreground"
        >
          <HelpCircle className="size-4" />
          Help
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-canvas">
              <span className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                {owner.slice(0, 1)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{workspace.name}</span>
                <span className="block truncate text-[11px] text-muted-foreground">{owner}</span>
              </span>
              <ChevronsUpDown className="size-3.5 text-subtle" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top" className="w-56">
            <DropdownMenuItem disabled>
              <span>
                <span className="block font-medium">{workspace.name}</span>
                <span className="block text-xs text-muted-foreground">Current workspace</span>
              </span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => {
                setTab("workspace");
                onNavigate?.();
                void navigate({ to: "/app/settings" });
              }}
            >
              Workspace settings
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => {
                setTab("billing");
                onNavigate?.();
                void navigate({ to: "/app/settings" });
              }}
            >
              Billing
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => {
                useMelo.getState().resetTenant();
                clearTenantCache();
                void signOut("/login").catch(() => undefined);
              }}
            >
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}

function Leaf({
  item,
  pathname,
  badges,
  onNavigate,
  nested,
}: {
  item: NavLeaf;
  pathname: string;
  badges: Record<NavBadge, number>;
  onNavigate?: () => void;
  nested?: boolean;
}) {
  const active = pathActive(pathname, item.to);
  const Icon = item.icon;
  const badge = item.badgeKey ? badges[item.badgeKey] : 0;
  return (
    <Link
      to={item.to}
      onClick={onNavigate}
      className={cn(
        "flex h-8 items-center gap-2.5 rounded-md text-sm",
        nested ? "pl-8 pr-2" : "h-9 px-2.5 font-medium",
        active ? "bg-canvas text-foreground shadow-hairline" : "text-muted-foreground hover:bg-canvas/70 hover:text-foreground",
      )}
    >
      {nested ? null : <Icon className="size-4" />}
      <span className="flex-1">{item.label}</span>
      {badge ? (
        <span className="min-w-5 rounded-full bg-primary px-1.5 text-center text-[10px] font-semibold text-primary-foreground">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}

function Branch({
  item,
  pathname,
  badges,
  open,
  onToggle,
  onNavigate,
}: {
  item: Extract<NavEntry, { children: NavLeaf[] }>;
  pathname: string;
  badges: Record<NavBadge, number>;
  open: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
}) {
  const childActive = item.children.some((c) => pathActive(pathname, c.to));
  const Icon = item.icon;
  const badge = item.badgeKey ? badges[item.badgeKey] : 0;
  return (
    <div>
      <div
        className={cn(
          "flex h-9 items-center gap-1 rounded-md text-sm font-medium",
          childActive && !open ? "text-foreground" : "text-muted-foreground",
        )}
      >
        <Link
          to={item.defaultTo}
          onClick={onNavigate}
          className="flex min-w-0 flex-1 items-center gap-2.5 rounded-md px-2.5 py-2 hover:bg-canvas/70 hover:text-foreground"
        >
          <Icon className="size-4" />
          <span className="flex-1">{item.label}</span>
          {badge ? (
            <span className="min-w-5 rounded-full bg-primary px-1.5 text-center text-[10px] font-semibold text-primary-foreground">
              {badge}
            </span>
          ) : null}
        </Link>
        <button
          type="button"
          onClick={onToggle}
          className="grid size-8 place-items-center rounded-md hover:bg-canvas hover:text-foreground"
          aria-label={open ? `Collapse ${item.label}` : `Expand ${item.label}`}
        >
          <ChevronRight className={cn("size-3.5 transition-transform", open && "rotate-90")} />
        </button>
      </div>
      {open ? (
        <div className="mt-0.5 space-y-0.5">
          {item.children.map((child) => (
            <Leaf key={child.to} item={child} pathname={pathname} badges={badges} onNavigate={onNavigate} nested />
          ))}
        </div>
      ) : null}
    </div>
  );
}