import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Mic, MicOff, Pause, Phone, PhoneOff, Play, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { dt, timeOf } from "@/lib/format";
import { useMelo } from "@/lib/melo/store";
import { listOfficeCalls, holdLiveCall, endLiveCall, transferLiveCall } from "@/lib/channels/actions";
import { toast } from "sonner";
import type { LiveCall, StaffMember } from "@/lib/melo/types";
import { cn } from "@/lib/utils";

function Waveform({ active }: { active: boolean }) {
  return (
    <div className="flex h-14 items-end justify-center gap-0.5">
      {Array.from({ length: 48 }).map((_, i) => (
        <span
          key={i}
          className={cn("wave-bar w-1 rounded-full bg-primary", !active && "opacity-30")}
          style={{
            height: `${10 + ((i * 19) % 36)}px`,
            animationDelay: `${(i % 10) * 70}ms`,
            animationPlayState: active ? "running" : "paused",
          }}
        />
      ))}
    </div>
  );
}

function CallTimer() {
  const [secs, setSecs] = useState(4 * 60 + 18);
  useEffect(() => {
    const id = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return (
    <span className="tabular">
      {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
    </span>
  );
}

export function ReceptionPage() {
  const live = useMelo((s) => s.liveCall);
  const recent = useMelo((s) => s.recentCalls);
  const customers = useMelo((s) => s.customers);
  const staff = useMelo((s) => s.staff);
  const jobs = useMelo((s) => s.jobs);
  const conversations = useMelo((s) => s.conversations);
  const agents = useMelo((s) => s.agents);
  const [focus, setFocus] = useState<"live" | string>("live");
  const applyLive = useMelo((s) => s.applyLiveCall);

  useEffect(() => {
    const tick = () => {
      void listOfficeCalls()
        .then((rows) => {
          const liveRow = rows.find((r) => r.phase === "live" || r.phase === "hold");
          if (liveRow) applyLive(liveRow);
        })
        .catch(() => undefined);
    };
    tick();
    const id = window.setInterval(tick, 4000);
    return () => window.clearInterval(id);
  }, [applyLive]);

  const call: LiveCall | null = focus === "live" ? live : recent.find((c) => c.id === focus) ?? live;
  const customer = customers.find((c) => c.id === call?.customerId);
  const job = jobs.find((j) => j.customerId === call?.customerId && (j.channel === "voice" || j.id === "job-1042"));
  const receptionist = agents.find((a) => a.id === "receptionist");
  const waiting = conversations.filter(
    (c) =>
      c.channel === "voice" &&
      c.unread > 0 &&
      c.customerId !== live?.customerId &&
      !recent.some((r) => r.customerId === c.customerId),
  );
  const isLive = focus === "live" && call?.phase !== "ended";

  return (
    <div className="flex h-[calc(100dvh-56px)] min-h-0 flex-col lg:flex-row">
      <aside className="flex shrink-0 gap-2 overflow-x-auto border-b border-border bg-canvas p-2 lg:w-60 lg:flex-col lg:overflow-y-auto lg:border-r lg:border-b-0 lg:p-0">
        <div className="hidden px-3 pt-3 pb-2 text-sm font-semibold lg:block">Reception</div>
        <QueueRow
          active={focus === "live"}
          live={isLive}
          title={customer && focus === "live" ? customer.name : customers.find((c) => c.id === live?.customerId)?.name ?? "Live"}
          subtitle={live?.suburb ?? ""}
          onClick={() => setFocus("live")}
        />
        {waiting.map((c) => {
          const cust = customers.find((x) => x.id === c.customerId);
          const rec = recent.find((r) => r.customerId === c.customerId);
          return (
            <QueueRow
              key={c.id}
              active={rec ? focus === rec.id : false}
              live={false}
              waiting
              title={cust?.name ?? c.subject}
              subtitle="Callback"
              onClick={() => rec && setFocus(rec.id)}
            />
          );
        })}
        {recent.map((c) => {
          const cust = customers.find((x) => x.id === c.customerId);
          return (
            <QueueRow
              key={c.id}
              active={focus === c.id}
              live={false}
              title={cust?.name ?? "Caller"}
              subtitle={c.reason}
              onClick={() => setFocus(c.id)}
            />
          );
        })}
      </aside>

      <div className="melo-scroll min-w-0 flex-1 overflow-y-auto p-4 sm:p-6">
        {call && customer ? (
          isLive ? (
            <LiveConsole
              call={call}
              customerName={customer.name}
              from={call.from}
              jobId={job?.id}
              jobNumber={job?.number}
              receptionist={receptionist?.name}
            />
          ) : (
            <EndedDetail call={call} customerName={customer.name} jobId={job?.id} />
          )
        ) : (
          <p className="text-sm text-muted-foreground">No live calls.</p>
        )}
      </div>

      <aside className="hidden w-[300px] shrink-0 flex-col gap-3 overflow-y-auto border-l border-border bg-canvas p-4 xl:flex">
        <Suggested call={call} jobId={job?.id} staff={staff} />
        <section>
          <h2 className="text-xs font-medium text-muted-foreground">Staff</h2>
          <ul className="mt-2 space-y-2">
            {staff.map((s) => (
              <li key={s.id} className="flex items-start justify-between gap-2 text-sm">
                <span className="font-medium">{s.name}</span>
                <span className="text-right text-xs text-muted-foreground">{staffNote(s.id)}</span>
              </li>
            ))}
          </ul>
        </section>
      </aside>
    </div>
  );
}

function QueueRow({
  active,
  live,
  waiting,
  title,
  subtitle,
  onClick,
}: {
  active: boolean;
  live: boolean;
  waiting?: boolean;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-w-40 flex-col items-start rounded-lg px-3 py-2.5 text-left lg:min-w-0 lg:rounded-none lg:border-b lg:border-border",
        active ? "bg-accent" : "hover:bg-muted/60",
      )}
    >
      <div className="flex items-center gap-2 text-sm font-medium">
        {live ? <span className="size-2 rounded-full bg-success live-dot" /> : null}
        {waiting ? <span className="size-2 rounded-full bg-warning" /> : null}
        {title}
      </div>
      <div className="truncate text-xs text-muted-foreground">{subtitle}</div>
    </button>
  );
}

function staffNote(id: string) {
  if (id === "dez") return "Free 10:00 · Burwood run";
  if (id === "sam") return "Held 7:30 · Newtown";
  return "Available · transfer";
}

function LiveConsole({
  call,
  customerName,
  from,
  jobId,
  jobNumber,
  receptionist,
}: {
  call: LiveCall;
  customerName: string;
  from: string;
  jobId?: string;
  jobNumber?: string;
  receptionist?: string;
}) {
  const control = useMelo((s) => s.liveControl);
  const onHold = call.phase === "hold";
  const active = call.phase === "live" && !call.muted;

  const run = (action: "mute" | "hold" | "resume" | "end" | "barge") => {
    const sid = call.twilioSid;
    if (sid && (action === "hold" || action === "resume")) {
      void holdLiveCall({ data: { callSid: sid, hold: action === "hold" } }).catch((e: Error) => toast.error(e.message));
    }
    if (sid && action === "end") {
      void endLiveCall({ data: sid }).catch((e: Error) => toast.error(e.message));
    }
    control(action);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight">{customerName}</h1>
            <Badge tone={onHold ? "warning" : "success"}>{onHold ? "On hold" : "Live"}</Badge>
            {jobNumber ? <Badge tone="outline">{jobNumber}</Badge> : null}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {from} · {call.suburb} · {call.reason}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-semibold tabular"><CallTimer /></div>
          <div className="text-xs text-muted-foreground">Started {timeOf(call.startedAt)}</div>
        </div>
      </div>

      <section className="rounded-2xl border border-border bg-canvas p-5">
        <Waveform active={active} />
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <Button variant={call.muted ? "secondary" : "outline"} onClick={() => run("mute")}>
            {call.muted ? <MicOff /> : <Mic />}
            {call.muted ? "Unmute" : "Mute"}
          </Button>
          <Button variant={onHold ? "secondary" : "outline"} onClick={() => run(onHold ? "resume" : "hold")}>
            {onHold ? <Play /> : <Pause />}
            {onHold ? "Resume" : "Hold"}
          </Button>
          <Button variant="outline" onClick={() => run("barge")}>
            Barge in
          </Button>
          <Button variant="danger" onClick={() => run("end")}>
            <PhoneOff /> End
          </Button>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-canvas p-4">
        <div className="mb-3 text-sm font-semibold">Transcript</div>
        <div className="melo-scroll max-h-80 space-y-3 overflow-y-auto">
          {call.transcript.map((t, i) => {
            const mine = t.speaker !== "customer";
            const label = t.speaker === "customer" ? customerName : t.speaker === "owner" ? "Alex" : receptionist ?? "Receptionist";
            return (
              <div key={i} className={cn("flex flex-col", mine ? "items-end" : "items-start")}>
                <span className="text-xs font-medium text-muted-foreground">{label}</span>
                <p
                  className={cn(
                    "mt-0.5 max-w-[90%] rounded-xl px-3 py-2 text-sm leading-relaxed",
                    mine ? "bg-accent text-foreground" : "bg-muted",
                  )}
                >
                  {t.text}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <div className="xl:hidden">
        <Suggested call={call} jobId={jobId} staff={useMelo.getState().staff} />
      </div>
    </div>
  );
}

function Suggested({
  call,
  jobId,
  staff,
}: {
  call: LiveCall | null;
  jobId?: string;
  staff: StaffMember[];
}) {
  const book = useMelo((s) => s.bookSlot);
  const transfer = useMelo((s) => s.transferCall);
  const send = useMelo((s) => s.sendInbox);
  const selectJob = useMelo((s) => s.selectJob);
  const selectReview = useMelo((s) => s.selectReview);
  const navigate = useNavigate();
  const dez = staff.find((s) => s.id === "dez");

  return (
    <section>
      <h2 className="text-xs font-medium text-muted-foreground">Suggested</h2>
      <div className="mt-2 flex flex-col gap-2">
        <Button
          className="h-auto justify-start py-2.5 text-left"
          onClick={() => {
            book("dez", "2026-09-03T10:00:00+10:00", jobId ?? "job-1042");
          }}
        >
          Confirm Dez · 10:00 am
        </Button>
        <Button
          variant="outline"
          className="h-auto justify-start py-2.5 text-left"
          onClick={() => {
            selectReview("rev-q2041");
            void navigate({ to: "/app/review" });
          }}
        >
          Open quote in Review
        </Button>
        <Button
          variant="outline"
          className="h-auto justify-start py-2.5 text-left"
          onClick={() => {
            const sid = useMelo.getState().liveCall?.twilioSid;
            const alex = useMelo.getState().staff.find((s) => s.id === "alex");
            if (sid && alex?.phone) {
              void transferLiveCall({ data: { callSid: sid, to: alex.phone, name: alex.name } }).catch((e: Error) => toast.error(e.message));
            }
            transfer("alex");
          }}
        >
          <UserPlus /> Warm transfer Alex
        </Button>
        <Button
          variant="outline"
          className="h-auto justify-start py-2.5 text-left"
          onClick={() => send("conv-james", "Dez will be there at 10:00. Please be home or leave access — first name Dez, Northside Plumbing.")}
        >
          Text access instructions
        </Button>
        {jobId ? (
          <Button
            variant="ghost"
            className="justify-start"
            onClick={() => {
              selectJob(jobId);
              void navigate({ to: "/app/pipeline" });
            }}
          >
            Open {dez ? "JOB-1042" : "job"}
          </Button>
        ) : null}
      </div>
      {call?.phase === "ended" ? null : (
        <p className="mt-3 text-xs text-muted-foreground">Dez is already on a Burwood run after Artarmon. 10:00 fits without moving Sam.</p>
      )}
    </section>
  );
}

function EndedDetail({
  call,
  customerName,
  jobId,
}: {
  call: LiveCall;
  customerName: string;
  jobId?: string;
}) {
  const selectJob = useMelo((s) => s.selectJob);
  const navigate = useNavigate();
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{customerName}</h1>
        <p className="text-sm text-muted-foreground">
          {call.from} · {call.suburb} · {dt(call.startedAt)}
        </p>
      </div>
      <section className="rounded-2xl border border-border bg-canvas p-4">
        <div className="text-sm font-medium">Recording</div>
        <div className="mt-3 flex h-10 items-center gap-2 rounded-lg bg-muted px-3">
          <Phone className="size-3.5 text-muted-foreground" />
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-border">
            <div className="h-full w-2/5 bg-primary" />
          </div>
          <span className="text-xs tabular text-muted-foreground">02:14</span>
        </div>
      </section>
      <section className="rounded-2xl border border-border bg-canvas p-4">
        <div className="text-sm font-semibold">Summary</div>
        <p className="mt-2 text-sm leading-relaxed text-pretty">
          {call.summary ?? "Blocked drain, Burwood. Dez booked 10:00 am. Customer will be home."}
        </p>
      </section>
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => {
            if (jobId) selectJob(jobId);
            void navigate({ to: "/app/pipeline" });
          }}
        >
          Open job
        </Button>
        <Button variant="outline" onClick={() => void navigate({ to: "/app/review" })}>
          Draft quote
        </Button>
        <Button variant="outline">
          <Phone /> Callback
        </Button>
      </div>
      <section className="rounded-2xl border border-border bg-canvas p-4">
        <div className="mb-3 text-sm font-semibold">Transcript</div>
        <div className="space-y-2 text-sm">
          {call.transcript.map((t, i) => (
            <p key={i}>
              <span className="font-medium text-muted-foreground">{t.speaker === "customer" ? customerName : t.speaker === "owner" ? "Alex" : "Receptionist"}: </span>
              {t.text}
            </p>
          ))}
        </div>
      </section>
    </div>
  );
}

export function CallsPage() {
  const live = useMelo((s) => s.liveCall);
  const recent = useMelo((s) => s.recentCalls);
  const conversations = useMelo((s) => s.conversations);
  const customers = useMelo((s) => s.customers);
  const number = useMelo((s) => s.workspace.number);
  const knowledge = useMelo((s) => s.knowledge);
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const rows = [
    ...(live && live.phase !== "ended"
      ? [{ id: live.id, at: live.startedAt, name: customers.find((c) => c.id === live.customerId)?.name ?? "Caller", from: live.from, reason: live.reason, live: true, tag: "Live" }]
      : []),
    ...recent.map((c) => ({
      id: c.id,
      at: c.startedAt,
      name: customers.find((x) => x.id === c.customerId)?.name ?? "Caller",
      from: c.from,
      reason: c.reason,
      live: false,
      tag: c.summary ? "Ended" : undefined,
    })),
    ...conversations
      .filter((c) => c.channel === "voice" && !recent.some((r) => r.customerId === c.customerId) && c.customerId !== live?.customerId)
      .map((c) => ({
        id: c.id,
        at: c.updatedAt,
        name: customers.find((x) => x.id === c.customerId)?.name ?? c.subject,
        from: customers.find((x) => x.id === c.customerId)?.phone ?? "",
        reason: c.subject,
        live: false,
        tag: undefined as string | undefined,
      })),
  ].filter((r) => {
    const n = q.trim().toLowerCase();
    if (!n) return true;
    return `${r.name} ${r.from} ${r.reason}`.toLowerCase().includes(n);
  });

  const groups = [
    { label: "Today", items: rows.filter((r) => r.at.startsWith("2026-09-03") || r.live) },
    { label: "Yesterday", items: rows.filter((r) => r.at.startsWith("2026-09-02")) },
    { label: "Earlier", items: rows.filter((r) => !r.live && !r.at.startsWith("2026-09-03") && !r.at.startsWith("2026-09-02")) },
  ].filter((g) => g.items.length);

  return (
    <div className="flex h-[calc(100dvh-56px)] min-h-0">
      <div className="melo-scroll min-w-0 flex-1 overflow-y-auto p-5 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Calls</h1>
            <p className="mt-1 text-sm text-muted-foreground">Monitor and manage your AI receptionist.</p>
          </div>
          <div className="rounded-xl border border-border bg-canvas px-4 py-3 text-sm">
            <div className="text-xs text-muted-foreground">Your AI receptionist’s number</div>
            <div className="mt-1 font-medium tabular">{number}</div>
          </div>
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search calls by name, number or keyword"
          className="mt-6 h-10 w-full max-w-xl rounded-lg border border-border bg-canvas px-3 text-sm outline-none"
        />
        <div className="mt-8 space-y-8">
          {groups.map((g) => (
            <section key={g.label}>
              <h2 className="mb-2 text-sm font-semibold">{g.label}</h2>
              <ul className="divide-y divide-border border-t border-border">
                {g.items.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => void navigate({ to: "/app/reception" })}
                      className="flex w-full items-center gap-3 py-3.5 text-left hover:bg-muted/40"
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-full border border-border bg-canvas text-primary">
                        <Play className="size-3.5 fill-current pl-0.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium">{r.live ? `${r.name} is on the line` : `${r.name} — ${r.reason}`}</span>
                          {r.live ? <Badge tone="success">Live</Badge> : r.tag ? <Badge>{r.tag}</Badge> : null}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {timeOf(r.at)} · {r.from || "Unknown number"}
                        </span>
                      </span>
                      <span className="text-xs text-muted-foreground tabular">{timeOf(r.at)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
      <aside className="hidden w-[300px] shrink-0 flex-col gap-4 overflow-y-auto border-l border-border bg-canvas p-5 xl:flex">
        <section>
          <h2 className="text-sm font-semibold">Reception status</h2>
          <p className="mt-2 text-sm text-success">On, taking calls</p>
          <p className="mt-1 text-xs text-muted-foreground">{number}</p>
        </section>
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Knowledge</h2>
            <button type="button" className="text-xs text-primary" onClick={() => void navigate({ to: "/app/knowledge" })}>
              Manage
            </button>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{knowledge.faqs.length} FAQs trained</p>
        </section>
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Escalation</h2>
            <button type="button" className="text-xs text-primary" onClick={() => void navigate({ to: "/app/settings" })}>
              Manage
            </button>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">Transfer to mobile when they ask for you.</p>
        </section>
      </aside>
    </div>
  );
}
