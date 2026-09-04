import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMelo } from "@/lib/melo/store";

const STATUS: Record<string, "default" | "primary" | "success" | "warning"> = {
  draft: "warning",
  scheduled: "primary",
  live: "success",
  gbp: "default",
};

export function ReachPage() {
  const content = useMelo((s) => s.content);
  const sequences = useMelo((s) => s.sequences);
  const toggle = useMelo((s) => s.toggleAutomation);
  const autos = useMelo((s) => s.automations);

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold">Reach</h1>
      <p className="mt-1 text-sm text-muted-foreground">90-day local SEO from real calls and jobs. Scout sequences recover missed calls, quotes and silent customers.</p>
      <Tabs defaultValue="content" className="mt-5">
        <TabsList>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="outbound">Outbound</TabsTrigger>
        </TabsList>
        <TabsContent value="content" className="mt-4">
          <div className="grid gap-3 md:grid-cols-2">
            {content.map((c) => (
              <article key={c.id} className="rounded-xl border border-border bg-canvas p-4">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-semibold">{c.title}</h2>
                  <Badge tone={STATUS[c.status]}>{c.status}</Badge>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {c.kind.toUpperCase()} · {c.suburb} · {c.demand}
                </div>
                <p className="mt-3 text-sm leading-relaxed">{c.body}</p>
              </article>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="outbound" className="mt-4 space-y-3">
          {sequences.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-xl border border-border bg-canvas p-4">
              <div>
                <div className="font-medium">{s.name}</div>
                <div className="text-sm text-muted-foreground">
                  {s.trigger} · {s.enrolled} enrolled · {s.steps.join(" → ")}
                </div>
              </div>
              <Switch checked={s.active} onCheckedChange={() => useMelo.setState({ sequences: useMelo.getState().sequences.map((x) => (x.id === s.id ? { ...x, active: !x.active } : x)) })} />
            </div>
          ))}
          <div className="pt-2 text-sm font-medium">Automations</div>
          {autos.map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-xl border border-border bg-canvas px-4 py-3 text-sm">
              <span>
                {a.name} · {a.trigger}
              </span>
              <Switch checked={a.on} onCheckedChange={() => toggle(a.id)} />
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
