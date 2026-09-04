import { Bell, Menu, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown";
import { useMelo } from "@/lib/melo/store";
import { relative } from "@/lib/format";
import { useNavigate } from "@tanstack/react-router";
import { Kbd } from "@/components/melo/empty";
import { signOut } from "@/lib/auth/client";
import { clearTenantCache } from "@/lib/melo/office-sync";
import { cn } from "@/lib/utils";

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const setAsk = useMelo((s) => s.setAskOpen);
  const setCmd = useMelo((s) => s.setCommandOpen);
  const setHelp = useMelo((s) => s.setHelpOpen);
  const notifs = useMelo((s) => s.notifications);
  const mark = useMelo((s) => s.markNotifsRead);
  const markOne = useMelo((s) => s.markNotifRead);
  const owner = useMelo((s) => s.workspace.ownerName);
  const unread = notifs.filter((n) => !n.read).length;
  const navigate = useNavigate();

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-canvas px-4">
      <Button size="icon" variant="ghost" className="lg:hidden" onClick={onMenu} aria-label="Open menu">
        <Menu />
      </Button>
      <button
        type="button"
        onClick={() => setCmd(true)}
        className="hidden h-9 min-w-0 flex-1 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm text-muted-foreground hover:bg-muted sm:flex"
      >
        <Search className="size-3.5" />
        Search jobs, people, threads…
        <span className="ml-auto flex items-center gap-1">
          <Kbd>⌘K</Kbd>
        </span>
      </button>
      <div className="ml-auto flex items-center gap-1.5">
        <Button size="icon" variant="ghost" className="sm:hidden" onClick={() => setCmd(true)} aria-label="Search">
          <Search />
        </Button>
        <Button size="sm" onClick={() => setAsk(true)} className="hidden sm:inline-flex">
          <Sparkles className="size-3.5" />
          Ask Melo
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost" className="relative" aria-label="Notifications">
              <Bell />
              {unread ? <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-danger" /> : null}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-0">
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <span className="text-xs font-medium">Notifications</span>
              {unread ? (
                <button type="button" className="text-[11px] text-primary" onClick={() => mark()}>
                  Mark all read
                </button>
              ) : null}
            </div>
            {notifs.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">You’re up to date.</div>
            ) : (
              notifs.map((n) => (
                <DropdownMenuItem
                  key={n.id}
                  className={cn("items-start rounded-none px-3 py-2.5", !n.read && "bg-accent/50")}
                  onSelect={() => {
                    markOne(n.id);
                    if (n.href) void navigate({ to: n.href });
                  }}
                >
                  <div>
                    <div className="font-medium">{n.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {n.body} · {relative(n.at)}
                    </div>
                  </div>
                </DropdownMenuItem>
              ))
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setHelp(true)}>Keyboard shortcuts</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex size-8 items-center justify-center rounded-full bg-accent text-xs font-semibold text-primary"
              aria-label="Account"
            >
              {owner.slice(0, 1)}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onSelect={() => {
                useMelo.getState().setSettingsTab("workspace");
                void navigate({ to: "/app/settings" });
              }}
            >
              Settings
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
    </header>
  );
}
