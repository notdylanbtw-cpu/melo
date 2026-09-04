import { Badge } from "@/components/ui/badge";
import { useAdmin } from "@/lib/admin/store";
import type { ContentKind } from "@/lib/admin/types";
import { dt, relative } from "@/lib/format";
import { cn } from "@/lib/utils";

const KINDS: { id: ContentKind; label: string }[] = [
  { id: "gbp", label: "GBP posts" },
  { id: "blog", label: "Blogs" },
  { id: "service_page", label: "Service pages" },
  { id: "quote", label: "Quotes" },
  { id: "sms", label: "SMS / sequences" },
  { id: "widget", label: "Widget answers" },
];

export function AdminContent() {
  const content = useAdmin((s) => s.content);
  const tenants = useAdmin((s) => s.tenants);
  const series = useAdmin((s) => s.series);
  const week = series.slice(-7).reduce((n, d) => n + d.content, 0);
  const maxKind = Math.max(...KINDS.map((k) => content.filter((c) => c.kind === k.id).length), 1);

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4 sm:p-6">
      <div>
        <h1 className="text-xl font-semibold">Content</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {week} pieces generated in the last 7 days · GBP, blogs, quotes, widget answers
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {KINDS.map((k) => {
          const n = content.filter((c) => c.kind === k.id).length;
          return (
            <div key={k.id} className="rounded-xl border border-border bg-canvas p-4">
              <div className="text-xs font-medium text-muted-foreground">{k.label}</div>
              <div className="mt-1 text-2xl font-semibold tabular">{n}</div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className={cn("h-full rounded-full bg-primary")} style={{ width: `${Math.round((n / maxKind) * 100)}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      <div className="overflow-x-auto rounded-xl border border-border bg-canvas">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="text-left text-xs text-muted-foreground">
            <tr className="border-b border-border">
              <th className="px-4 py-3 font-medium">Item</th>
              <th className="px-4 py-3 font-medium">Workspace</th>
              <th className="px-4 py-3 font-medium">Kind</th>
              <th className="px-4 py-3 font-medium">Agent</th>
              <th className="px-4 py-3 font-medium">When</th>
            </tr>
          </thead>
          <tbody>
            {content.map((c) => {
              const tenant = tenants.find((t) => t.id === c.tenantId);
              return (
                <tr key={c.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{c.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">{tenant?.name}</td>
                  <td className="px-4 py-3">
                    <Badge tone="outline">{KINDS.find((k) => k.id === c.kind)?.label ?? c.kind}</Badge>
                  </td>
                  <td className="px-4 py-3">{c.agent}</td>
                  <td className="px-4 py-3 text-muted-foreground" title={dt(c.at)}>
                    {relative(c.at)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
