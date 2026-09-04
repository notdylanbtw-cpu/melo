import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAdmin } from "@/lib/admin/store";
import type { TenantStatus } from "@/lib/admin/types";
import { dt, money, relative } from "@/lib/format";
import { cn } from "@/lib/utils";

const STATUS: Record<TenantStatus, { label: string; tone: "success" | "warning" | "danger" | "default" | "primary" }> = {
  active: { label: "Active", tone: "success" },
  trial: { label: "Trial", tone: "primary" },
  past_due: { label: "Past due", tone: "danger" },
  cancelled: { label: "Cancelled", tone: "default" },
};

export function AdminSubs() {
  const tenants = useAdmin((s) => s.tenants);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<TenantStatus | "all">("all");
  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return tenants.filter((t) => {
      if (status !== "all" && t.status !== status) return false;
      if (!needle) return true;
      return `${t.name} ${t.owner} ${t.email} ${t.industry} ${t.suburb}`.toLowerCase().includes(needle);
    });
  }, [tenants, q, status]);
  const mrr = rows.filter((t) => t.status === "active" || t.status === "trial").reduce((n, t) => n + t.mrr, 0);

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Subscribers</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {rows.length} workspaces · {money(mrr)} MRR in view
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Input placeholder="Search workspaces…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
        <div className="flex rounded-lg bg-muted p-0.5">
          {(["all", "active", "trial", "past_due", "cancelled"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={cn("h-8 rounded-md px-2.5 text-xs font-medium capitalize", status === s ? "bg-canvas shadow-hairline" : "text-muted-foreground")}
            >
              {s === "past_due" ? "Past due" : s}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border bg-canvas">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="text-left text-xs text-muted-foreground">
            <tr className="border-b border-border">
              <th className="px-4 py-3 font-medium">Workspace</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3 font-medium">MRR</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Started</th>
              <th className="px-4 py-3 font-medium">Last seen</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <div className="font-medium">{t.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {t.owner} · {t.suburb} · {t.industry}
                  </div>
                </td>
                <td className="px-4 py-3 capitalize">{t.plan}</td>
                <td className="px-4 py-3 tabular">{money(t.mrr)}</td>
                <td className="px-4 py-3">
                  <Badge tone={STATUS[t.status].tone}>{STATUS[t.status].label}</Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{dt(t.startedAt, "d MMM yyyy")}</td>
                <td className="px-4 py-3 text-muted-foreground">{relative(t.lastActiveAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
