import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowUpRight, CalendarCheck, Check, Cpu, Moon, Phone, X } from "lucide-react";
import { AskChips, AskComposer } from "@/components/melo/ask";
import { AgentPortrait } from "@/components/melo/portrait";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { greetingSydney, timeOf, todaySydneyISO, todaySydneyLabel } from "@/lib/format";
import { INDUSTRY_LABELS } from "@/lib/melo/terminology";
import { useMelo } from "@/lib/melo/store";
import { cn } from "@/lib/utils";

const WEEK = [
  { d: "Mon", v: 9 },
  { d: "Tue", v: 11 },
  { d: "Wed", v: 8 },
  { d: "Thu", v: 12 },
  { d: "Fri", v: 6 },
  { d: "Sat", v: 3 },
  { d: "Sun", v: 2 },
];

export function HomePage() {
  const mode = useMelo((s) => s.homeMode);
  const setMode = useMelo((s) => s.setHomeMode);
  const owner = useMelo((s) => s.workspace.ownerName);
  const workspace = useMelo((s) => s.workspace.name);
  const industry = useMelo((s) => s.workspace.industry);
  const labels = INDUSTRY_LABELS[industry];
  const live = useMelo((s) => s.liveCall);
  const customers = useMelo((s) => s.customers);
  const navigate = useNavigate();
  const liveName = customers.find((c) => c.id === live?.customerId)?.name;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-sm text-muted-foreground">
            {workspace} · {todaySydneyLabel()}
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-pretty">
            {greetingSydney()} {owner}, what do you want to get done today?
          </h1>
        </div>
        <div className="flex rounded-lg bg-muted p-0.5">
          <button
            type="button"
            onClick={() => setMode("command")}
            className={cn(
              "h-8 rounded-md px-3 text-sm font-medium transition-colors",
              mode === "command" ? "bg-canvas text-foreground shadow-hairline" : "text-muted-foreground",
            )}
          >
            Command
          </button>
          <button
            type="button"
            onClick={() => setMode("dashboard")}
            className={cn(
              "h-8 rounded-md px-3 text-sm font-medium transition-colors",
              mode === "dashboard" ? "bg-canvas text-foreground shadow-hairline" : "text-muted-foreground",
            )}
          >
            Dashboard
          </button>
        </div>
      </div>

      {live && live.phase !== "ended" ? (
        <button
          type="button"
          onClick={() => void navigate({ to: "/app/reception" })}
          className="flex items-center gap-3 rounded-xl border border-border bg-canvas px-4 py-3 text-left transition-colors hover:bg-muted/40"
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-success-soft text-success">
            <Phone className="size-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2 text-sm font-medium">
              <span className="size-1.5 rounded-full bg-success live-dot" />
              Live call · {liveName}
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              {live.reason} · {live.suburb}
            </span>
          </span>
          <span className="text-xs font-medium text-primary">Open Reception</span>
        </button>
      ) : null}

      <ComputerStrip />

      {mode === "command" ? <CommandCentre labels={labels} /> : <OpsDashboard labels={labels} />}
    </div>
  );
}

function ComputerStrip() {
  return (
    <Link
      to="/app/computer"
      className="flex items-center gap-3 rounded-xl border border-border bg-canvas px-4 py-3 text-left transition-colors hover:bg-muted/40"
    >
      <span className="flex size-8 items-center justify-center rounded-full bg-success-soft text-success">
        <Cpu className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 text-sm font-medium">
          <span className="size-1.5 rounded-full bg-success live-dot" />
          Melo Computer is on
        </span>
        <span className="block text-xs text-muted-foreground">Sydney · phone, inbox, and taught tasks — even if you close this tab</span>
      </span>
      <span className="text-xs font-medium text-primary">Open</span>
    </Link>
  );
}

function CommandCentre({ labels }: { labels: { jobs: string } }) {
  return (
    <div className="space-y-4">
      <AskComposer variant="hero" />
      <AskChips />
      <MorningList />
      <div className="grid gap-4 lg:grid-cols-3">
        <ReviewCard />
        <JobsCard label={labels.jobs} />
        <OvernightCard />
      </div>
    </div>
  );
}

function MorningList() {
  const hidden = useMelo((s) => s.checklistHidden);
  const hide = useMelo((s) => s.setChecklistHidden);
  const items = useMelo((s) => s.reviewItems);
  const live = useMelo((s) => s.liveCall);
  const selectReview = useMelo((s) => s.selectReview);
  const navigate = useNavigate();

  if (hidden) return null;

  const rows = [
    ...items
      .filter((r) => r.status === "pending")
      .map((r) => ({
        id: r.id,
        done: false,
        label: r.title,
        run: () => {
          selectReview(r.id);
          void navigate({ to: "/app/review" });
        },
      })),
    ...(live && live.phase !== "ended"
      ? [
          {
            id: "live",
            done: false,
            label: `Sit in on live call · ${live.suburb}`,
            run: () => void navigate({ to: "/app/reception" }),
          },
        ]
      : []),
  ];
  if (!rows.length) return null;
  const left = rows.filter((r) => !r.done).length;

  return (
    <section className="rounded-xl border border-border bg-canvas p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">This morning</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{left} open</span>
          <button type="button" className="rounded-md p-1 text-subtle hover:bg-muted hover:text-foreground" onClick={() => hide(true)} aria-label="Dismiss">
            <X className="size-3.5" />
          </button>
        </div>
      </div>
      <ul className="space-y-1">
        {rows.map((r) => (
          <li key={r.id}>
            <button
              type="button"
              onClick={r.run}
              className="flex w-full items-center gap-2 rounded-lg px-1 py-1.5 text-left text-sm hover:bg-muted"
            >
              <span
                className={cn(
                  "flex size-4 items-center justify-center rounded-full border",
                  r.done ? "border-success bg-success text-primary-foreground" : "border-border",
                )}
              >
                {r.done ? <Check className="size-2.5" /> : null}
              </span>
              <span className={cn(r.done && "text-muted-foreground line-through")}>{r.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ReviewCard() {
  const reviewItems = useMelo((s) => s.reviewItems);
  const agents = useMelo((s) => s.agents);
  const selectReview = useMelo((s) => s.selectReview);
  const approve = useMelo((s) => s.approveReview);
  const navigate = useNavigate();
  const review = reviewItems.filter((r) => r.status === "pending");

  return (
    <section className="rounded-xl border border-border bg-canvas p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Needs your review</h2>
        <Link to="/app/review" className="text-xs text-primary">
          View all
        </Link>
      </div>
      <ul className="space-y-2">
        {review.map((r) => {
          const agent = agents.find((a) => a.id === r.agentId);
          return (
            <li key={r.id} className="rounded-lg border border-border p-2.5">
              <button
                type="button"
                className="flex w-full gap-2 text-left"
                onClick={() => {
                  selectReview(r.id);
                  void navigate({ to: "/app/review" });
                }}
              >
                {agent ? <AgentPortrait agent={agent} size={32} /> : null}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{r.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">{r.summary}</span>
                </span>
              </button>
              {r.kind === "quote" ? (
                <div className="mt-2 flex justify-end">
                  <Button
                    size="xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      approve(r.id);
                    }}
                  >
                    Send for signature
                  </Button>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function JobsCard({ label }: { label: string }) {
  const allJobs = useMelo((s) => s.jobs);
  const selectJob = useMelo((s) => s.selectJob);
  const navigate = useNavigate();
  const jobs = allJobs.filter((j) => j.scheduledStart?.startsWith(todaySydneyISO()));

  return (
    <section className="rounded-xl border border-border bg-canvas p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Today’s {label.toLowerCase()}</h2>
        <Link to="/app/calendar" className="text-xs text-primary">
          Calendar
        </Link>
      </div>
      <ul className="space-y-2">
        {jobs.map((j) => (
          <li key={j.id}>
            <button
              type="button"
              onClick={() => {
                selectJob(j.id);
                void navigate({ to: "/app/pipeline" });
              }}
              className="flex w-full items-center justify-between rounded-lg border border-border p-2.5 text-left hover:bg-muted/50"
            >
              <span>
                <span className="block text-sm font-medium">{j.title}</span>
                <span className="block text-xs text-muted-foreground">
                  {j.suburb}
                  {j.scheduledStart ? ` · ${timeOf(j.scheduledStart)}` : ""}
                </span>
              </span>
              <Badge tone="primary">{j.number}</Badge>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function OvernightCard() {
  const selectConversation = useMelo((s) => s.selectConversation);
  const recent = useMelo((s) => s.recentCalls);
  const navigate = useNavigate();
  if (!recent.length) return null;
  return (
    <section className="rounded-xl border border-border bg-canvas p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Overnight brief</h2>
        <Badge tone="warning">3 after-hours</Badge>
      </div>
      <ul className="space-y-3 text-sm">
        <li className="flex gap-2">
          <Moon className="mt-0.5 size-4 text-muted-foreground" />
          3 after-hours calls — Mia quoted, Tom twice.
        </li>
        <li className="flex gap-2">
          <CalendarCheck className="mt-0.5 size-4 text-success" />
          1 booked — James Wilson, Dez 10:00 am.
        </li>
        <li className="flex gap-2">
          <Phone className="mt-0.5 size-4 text-warning" />
          1 callback sitting on Tom Brennan at 7:30 am.
        </li>
      </ul>
      <div className="mt-4 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => {
            selectConversation("conv-tom");
            void navigate({ to: "/app/inbox" });
          }}
        >
          Open Tom
        </Button>
        <Button asChild variant="outline" size="sm" className="flex-1">
          <Link to="/app/inbox">
            Inbox <ArrowUpRight className="size-3.5" />
          </Link>
        </Button>
      </div>
    </section>
  );
}

function OpsDashboard({ labels }: { labels: { jobs: string; staffPlural: string } }) {
  const reviewItems = useMelo((s) => s.reviewItems);
  const allJobs = useMelo((s) => s.jobs);
  const agents = useMelo((s) => s.agents);
  const activityAll = useMelo((s) => s.activity);
  const convos = useMelo((s) => s.conversations);
  const review = reviewItems.filter((r) => r.status === "pending");
  const booked = allJobs.filter((j) => j.stage === "booked" || j.stage === "on_site").length;
  const activity = activityAll.slice(0, 8);
  const navigate = useNavigate();
  const voiceN = convos.filter((c) => c.channel === "voice").length;
  const chatN = convos.filter((c) => c.channel !== "voice").length;
  const afterHours = convos.filter((c) => /T(2[0-3]|0[0-6]):/.test(c.updatedAt)).length;
  const max = Math.max(1, ...WEEK.map((w) => w.v));

  const kpis = [
    { label: "Calls", value: String(voiceN), hint: `${afterHours} after-hours`, to: "/app/reception" },
    { label: "Inbox", value: String(chatN), hint: "every other channel", to: "/app/inbox" },
    { label: "Booked", value: String(booked), hint: `open ${labels.jobs.toLowerCase()}`, to: "/app/calendar" },
    { label: "In review", value: String(review.length), hint: "needs you", to: "/app/review" },
  ];

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <button
            key={k.label}
            type="button"
            onClick={() => void navigate({ to: k.to })}
            className="rounded-xl border border-border bg-canvas p-4 text-left transition-colors hover:bg-muted/40"
          >
            <div className="text-xs font-medium text-muted-foreground">{k.label}</div>
            <div className="mt-1 text-2xl font-semibold tabular">{k.value}</div>
            <div className="text-xs text-muted-foreground">{k.hint}</div>
          </button>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-xl border border-border bg-canvas p-4 lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold">Calls this week</h2>
          <div className="flex h-28 items-end gap-2">
            {WEEK.map((w) => (
              <div key={w.d} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex h-24 w-full items-end rounded-md bg-muted">
                  <div
                    className={cn("w-full rounded-md bg-primary", w.d === "Thu" && "bg-primary-hover")}
                    style={{ height: `${(w.v / max) * 100}%` }}
                  />
                </div>
                <div className="text-[11px] text-muted-foreground">{w.d}</div>
              </div>
            ))}
          </div>
          <h2 className="mt-6 mb-3 text-sm font-semibold">Recent activity</h2>
          <ul className="space-y-3">
            {activity.map((a) => (
              <li key={a.id} className="flex gap-3 text-sm">
                <div className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
                <div>
                  <span className="font-medium">{a.actor}</span> <span className="text-muted-foreground">{a.text}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-xl border border-border bg-canvas p-4">
          <h2 className="mb-3 text-sm font-semibold">Firm status</h2>
          <ul className="space-y-2">
            {agents.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-lg p-1 text-left hover:bg-muted"
                  onClick={() => void navigate({ to: "/app/firm" })}
                >
                  <AgentPortrait agent={a} size={28} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{a.name}</span>
                    <span className="block truncate text-[11px] text-muted-foreground">{a.currentTask ?? "Idle"}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
