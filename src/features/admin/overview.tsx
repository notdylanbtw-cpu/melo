import { Link } from "@tanstack/react-router";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { useAdmin } from "@/lib/admin/store";
import { dt, money, relative } from "@/lib/format";
import { cn } from "@/lib/utils";

export function AdminOverview() {
  const series = useAdmin((s) => s.series);
  const tenants = useAdmin((s) => s.tenants);
  const content = useAdmin((s) => s.content);
  const tickets = useAdmin((s) => s.tickets);
  const last = series[series.length - 1]!;
  const week = series.slice(-7);
  const prev = series.slice(-14, -7);
  const newWeek = week.reduce((n, d) => n + d.newSubs, 0);
  const newPrev = prev.reduce((n, d) => n + d.newSubs, 0);
  const contentWeek = week.reduce((n, d) => n + d.content, 0);
  const contentPrev = prev.reduce((n, d) => n + d.content, 0);
  const active = tenants.filter((t) => t.status === "active" || t.status === "trial").length;
  const open = tickets.filter((t) => t.status !== "closed");
  const mrrActive = tenants.filter((t) => t.status === "active" || t.status === "trial").reduce((n, t) => n + t.mrr, 0);

  const kpis = [
    { label: "MRR", value: money(mrrActive), hint: `${active} live workspaces`, to: "/admin/subs" },
    { label: "New subs", value: String(newWeek), hint: delta(newWeek, newPrev) + " vs last week", to: "/admin/subs" },
    { label: "Content", value: String(contentWeek), hint: delta(contentWeek, contentPrev) + " vs last week", to: "/admin/content" },
    { label: "Tickets", value: String(open.length), hint: `${tickets.filter((t) => t.status === "open").length} need a reply`, to: "/admin/tickets" },
  ];

  const chart = series.map((d) => ({
    ...d,
    label: dt(d.date, "d MMM"),
  }));

  return (
    <div className="mx-auto max-w-6xl space-y-5 p-4 sm:p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Today</h1>
        <p className="mt-1 text-sm text-muted-foreground">Melo across every workspace. Subs, content the firm writes, tickets waiting on you.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <Link key={k.label} to={k.to} className="rounded-xl border border-border bg-canvas p-4 hover:bg-muted/40">
            <div className="text-xs font-medium text-muted-foreground">{k.label}</div>
            <div className="mt-1 text-2xl font-semibold tabular">{k.value}</div>
            <div className="text-xs text-muted-foreground">{k.hint}</div>
          </Link>
        ))}
      </div>

      <section className="rounded-xl border border-border bg-canvas p-4">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h2 className="text-sm font-semibold">New subscribers</h2>
            <p className="text-xs text-muted-foreground">Last 14 days · {last.newSubs} today</p>
          </div>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }}
                formatter={(v: number, name: string) => [v, name === "newSubs" ? "New subs" : name]}
              />
              <Area type="monotone" dataKey="newSubs" stroke="var(--color-primary)" fill="var(--color-accent)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-canvas p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Needs a reply</h2>
            <Link to="/admin/tickets" className="text-xs text-primary">
              All tickets
            </Link>
          </div>
          <ul className="space-y-2">
            {open
              .filter((t) => t.status === "open")
              .map((t) => (
                <li key={t.id}>
                  <Link
                    to="/admin/tickets"
                    className="block rounded-lg border border-border p-2.5 hover:bg-muted/50"
                    onClick={() => useAdmin.getState().selectTicket(t.id)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">{t.subject}</span>
                      <Badge tone={t.priority === "high" ? "danger" : "outline"}>{t.number}</Badge>
                    </div>
                    <div className="mt-0.5 truncate text-xs text-muted-foreground">
                      {t.from} · {relative(t.createdAt)}
                    </div>
                  </Link>
                </li>
              ))}
          </ul>
        </section>

        <section className="rounded-xl border border-border bg-canvas p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Content just generated</h2>
            <Link to="/admin/content" className="text-xs text-primary">
              All content
            </Link>
          </div>
          <ul className="space-y-2">
            {content.slice(0, 6).map((c) => {
              const tenant = tenants.find((x) => x.id === c.tenantId);
              return (
                <li key={c.id} className="flex items-start justify-between gap-2 text-sm">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{c.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {tenant?.name} · {c.agent}
                    </div>
                  </div>
                  <span className="shrink-0 text-[11px] text-muted-foreground">{kindLabel[c.kind]}</span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <section className="rounded-xl border border-border bg-canvas p-4">
        <h2 className="mb-3 text-sm font-semibold">Plan mix</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {(["starter", "growth", "firm"] as const).map((p) => {
            const rows = tenants.filter((t) => t.plan === p && t.status !== "cancelled");
            const mrr = rows.reduce((n, t) => n + t.mrr, 0);
            return (
              <div key={p} className="rounded-lg border border-border p-3">
                <div className="text-xs font-medium text-muted-foreground">{p === "starter" ? "Basic" : p === "growth" ? "Pro" : "Agency"}</div>
                <div className="mt-1 text-lg font-semibold tabular">{rows.length}</div>
                <div className="text-xs text-muted-foreground">{money(mrr)} MRR</div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className={cn("h-full rounded-full bg-primary")} style={{ width: `${Math.round((rows.length / Math.max(tenants.length, 1)) * 100)}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

const kindLabel: Record<string, string> = {
  gbp: "GBP",
  blog: "Blog",
  service_page: "Page",
  quote: "Quote",
  sms: "SMS",
  widget: "Widget",
};

function delta(now: number, then: number) {
  if (!then) return "New";
  const pct = Math.round(((now - then) / then) * 100);
  return `${pct >= 0 ? "+" : ""}${pct}%`;
}
