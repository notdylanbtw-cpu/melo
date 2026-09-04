import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { answerFromKnowledge, coverageOf } from "@/lib/melo/knowledge";
import { dt, money } from "@/lib/format";
import { useMelo } from "@/lib/melo/store";
import type { KnowledgeService } from "@/lib/melo/types";
import { cn } from "@/lib/utils";

export function KnowledgePage() {
  const knowledge = useMelo((s) => s.knowledge);
  const setWidget = useMelo((s) => s.setWidgetOpen);
  const updateKnowledge = useMelo((s) => s.updateKnowledge);
  const setTab = useMelo((s) => s.setSettingsTab);
  const navigate = useNavigate();
  const coverage = coverageOf(knowledge);
  const [q, setQ] = useState("How much for a blocked drain in Newtown after hours?");
  const [asked, setAsked] = useState(q);
  const answer = useMemo(() => answerFromKnowledge(asked, knowledge), [asked, knowledge]);

  return (
    <div className="p-4 sm:p-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Knowledge</h1>
            <p className="mt-1 text-sm text-muted-foreground text-pretty">
              One brain for Receptionist, Ask Melo and the website widget. Change a price here and all three move.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setTab("train");
                void navigate({ to: "/app/settings" });
              }}
            >
              Train Melo
            </Button>
            <Button variant="outline" onClick={() => setWidget(true)}>
              Preview widget
            </Button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-border bg-canvas p-4 sm:col-span-1">
            <div className="text-xs font-medium text-muted-foreground">Coverage</div>
            <div className="mt-1 text-2xl font-semibold tabular">{coverage}%</div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${coverage}%` }} />
            </div>
          </div>
          {knowledge.sources.slice(0, 3).map((s) => (
            <div key={s.id} className="rounded-2xl border border-border bg-canvas p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="truncate text-sm font-medium">{s.name}</div>
                <span className={cn("text-xs", s.status === "synced" ? "text-success" : "text-warning")}>{s.status}</span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">{s.kind.replace("_", " ")}</div>
              <div className="mt-3 text-xs text-muted-foreground">Updated {dt(s.updatedAt, "d MMM")}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <section>
              <h2 className="mb-3 text-sm font-semibold">Services & pricing</h2>
              <p className="mb-3 text-xs text-muted-foreground">Amounts are inc GST. Blur a field to save — Ask Melo and the widget pick it up immediately.</p>
              <div className="overflow-x-auto rounded-2xl border border-border bg-canvas">
                <table className="w-full min-w-[640px] text-sm">
                  <thead className="text-left text-xs text-muted-foreground">
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 font-medium">Service</th>
                      <th className="px-4 py-3 font-medium">From</th>
                      <th className="px-4 py-3 font-medium">After hours</th>
                      <th className="px-4 py-3 font-medium">Duration</th>
                      <th className="px-4 py-3 font-medium">On</th>
                    </tr>
                  </thead>
                  <tbody>
                    {knowledge.services.map((s) => (
                      <PriceRow key={s.id} service={s} />
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <div className="grid gap-4 md:grid-cols-2">
              <EditCard
                title="Hours"
                value={knowledge.hours}
                onSave={(hours) => updateKnowledge({ hours })}
              />
              <EditCard
                title="After hours"
                value={knowledge.afterHours}
                onSave={(afterHours) => updateKnowledge({ afterHours })}
              />
              <EditCard
                title="Booking rules"
                value={knowledge.bookingRules}
                onSave={(bookingRules) => updateKnowledge({ bookingRules })}
              />
              <section className="rounded-2xl border border-border bg-canvas p-4">
                <div className="text-sm font-medium">Service areas</div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {knowledge.areas.map((a) => (
                    <span key={a} className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                      {a}
                    </span>
                  ))}
                </div>
              </section>
            </div>

            <section className="rounded-2xl border border-border bg-canvas p-4">
              <div className="text-sm font-medium">FAQs the firm will answer</div>
              <ul className="mt-3 divide-y divide-border">
                {knowledge.faqs.map((f) => (
                  <li key={f.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="text-sm font-medium">{f.q}</div>
                    <p className="mt-1 text-sm text-muted-foreground text-pretty">{f.a}</p>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <aside className="lg:sticky lg:top-4 h-fit rounded-2xl border border-border bg-canvas p-4">
            <div className="text-sm font-semibold">Test the brain</div>
            <p className="mt-1 text-xs text-muted-foreground">Same path Receptionist and the widget use.</p>
            <form
              className="mt-3 space-y-2"
              onSubmit={(e) => {
                e.preventDefault();
                setAsked(q);
              }}
            >
              <Input value={q} onChange={(e) => setQ(e.target.value)} />
              <Button type="submit" className="w-full">
                Ask
              </Button>
            </form>
            <p className="mt-4 text-sm leading-relaxed text-pretty">{answer.text}</p>
            <div className="mt-3 flex flex-wrap gap-1">
              {answer.citations.map((c) => (
                <span key={c.id} className="rounded-full bg-muted px-2 py-0.5 text-xs">
                  {c.title}
                </span>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function PriceRow({ service }: { service: KnowledgeService }) {
  const live = useMelo((s) => s.knowledge.services.find((x) => x.id === service.id) ?? service);
  const update = useMelo((s) => s.updateServicePrice);
  const [from, setFrom] = useState(String(live.priceFrom));
  const [after, setAfter] = useState(String(live.afterHoursFrom));

  useEffect(() => {
    setFrom(String(live.priceFrom));
    setAfter(String(live.afterHoursFrom));
  }, [live.priceFrom, live.afterHoursFrom]);

  const save = () => {
    const a = Number(from);
    const b = Number(after);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return;
    if (a === live.priceFrom && b === live.afterHoursFrom) return;
    update(live.id, a, b);
  };

  return (
    <tr className="border-t border-border">
      <td className="px-4 py-3">
        <div className="font-medium">{live.name}</div>
        <div className="text-xs text-muted-foreground">{live.summary}</div>
      </td>
      <td className="px-4 py-3">
        <Input
          type="number"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          onBlur={save}
          className="h-8 w-24 tabular"
          aria-label={`${live.name} from price`}
        />
        <div className="mt-1 text-xs text-muted-foreground">{money(Number(from) || 0)}</div>
      </td>
      <td className="px-4 py-3">
        <Input
          type="number"
          value={after}
          onChange={(e) => setAfter(e.target.value)}
          onBlur={save}
          className="h-8 w-24 tabular"
          aria-label={`${live.name} after hours price`}
        />
        <div className="mt-1 text-xs text-muted-foreground">{money(Number(after) || 0)}</div>
      </td>
      <td className="px-4 py-3 tabular text-muted-foreground">{live.durationMins} min</td>
      <td className="px-4 py-3">
        <Switch checked={live.active} disabled aria-label={`${live.name} active`} />
      </td>
    </tr>
  );
}

function EditCard({ title, value, onSave }: { title: string; value: string; onSave: (v: string) => void }) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  return (
    <section className="rounded-2xl border border-border bg-canvas p-4">
      <div className="text-sm font-medium">{title}</div>
      <Textarea
        className="mt-2 min-h-24"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          if (text.trim() && text !== value) onSave(text.trim());
        }}
      />
    </section>
  );
}
