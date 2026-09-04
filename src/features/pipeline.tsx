import { useEffect, useRef, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { ArrowLeft, CalendarDays, MapPin, Phone } from "lucide-react";
import { ChannelChip } from "@/components/melo/channel";
import { InvoiceSheet, OwnerMargin, QuoteSheet } from "@/components/melo/quote-sheet";
import { SendInvoiceDialog, SendInvoicePanel } from "@/components/melo/send-invoice";
import { STAGE_LABEL, StagePill } from "@/components/melo/status";
import { InvoicesPage } from "@/features/invoices";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { dt, initials, money, moneyExact, relative, timeOf } from "@/lib/format";
import { INDUSTRY_LABELS } from "@/lib/melo/terminology";
import { totals } from "@/lib/melo/totals";
import { useMelo } from "@/lib/melo/store";
import type { Customer, Job, JobStage, StaffMember } from "@/lib/melo/types";
import { cn } from "@/lib/utils";

const STAGES: JobStage[] = ["new", "quoted", "booked", "on_site", "won"];

const QUOTE_LABEL: Record<NonNullable<Job["quote"]>["status"], string> = {
  draft: "Draft",
  in_review: "Needs Alex",
  sent: "Awaiting signature",
  accepted: "Signed",
  declined: "Declined",
  expired: "Expired",
};

export function PipelinePage() {
  const jobs = useMelo((s) => s.jobs);
  const customers = useMelo((s) => s.customers);
  const staff = useMelo((s) => s.staff);
  const selected = useMelo((s) => s.selectedJobId);
  const select = useMelo((s) => s.selectJob);
  const move = useMelo((s) => s.moveJob);
  const tab = useMelo((s) => s.pipelineTab);
  const setTab = useMelo((s) => s.setPipelineTab);
  const labels = INDUSTRY_LABELS[useMelo((s) => s.workspace.industry)];
  const [q, setQ] = useState("");
  const [assignee, setAssignee] = useState<"all" | "unassigned" | string>("all");
  const [over, setOver] = useState<JobStage | null>(null);
  const job = jobs.find((j) => j.id === selected);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const invoicesRoute = pathname.includes("/invoices");
  const view = invoicesRoute ? "invoices" : "board";

  useEffect(() => {
    setTab(view);
  }, [view, setTab]);

  if (job) return <JobRecord job={job} onBack={() => select(null)} />;

  const query = q.trim().toLowerCase();
  const visible = jobs.filter((j) => {
    if (assignee === "unassigned" && j.assigneeId) return false;
    if (assignee !== "all" && assignee !== "unassigned" && j.assigneeId !== assignee) return false;
    if (!query) return true;
    const cust = customers.find((c) => c.id === j.customerId);
    return `${j.number} ${j.title} ${j.suburb} ${cust?.name ?? ""}`.toLowerCase().includes(query);
  });

  const openJobs = jobs.filter((j) => j.stage !== "won");
  const openValue = openJobs.reduce((n, j) => n + j.value, 0);
  const quotesWaiting = jobs.filter((j) => j.quote && (j.quote.status === "in_review" || j.quote.status === "sent")).length;
  const unscheduled = jobs.filter((j) => !j.scheduledStart && j.stage !== "won").length;
  const onSite = jobs.filter((j) => j.stage === "on_site").length;

  return (
    <div className="flex h-[calc(100dvh-56px)] min-h-0 flex-col">
      <div className="border-b border-border bg-canvas px-4 pt-5 pb-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Pipeline</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {view === "invoices"
                ? "Send tax invoices with templates. GST, Xero and the inbox stay in sync."
                : `${labels.jobs} from first contact to paid. Drag a card to move stage.`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex h-9 items-center gap-0.5 rounded-lg bg-muted p-0.5 lg:hidden">
              <button
                type="button"
                onClick={() => void navigate({ to: "/app/pipeline" })}
                className={cn(
                  "h-8 rounded-md px-3 text-sm font-medium",
                  view === "board" ? "bg-canvas text-foreground shadow-hairline" : "text-muted-foreground",
                )}
              >
                Board
              </button>
              <button
                type="button"
                onClick={() => void navigate({ to: "/app/pipeline/invoices" })}
                className={cn(
                  "h-8 rounded-md px-3 text-sm font-medium",
                  view === "invoices" ? "bg-canvas text-foreground shadow-hairline" : "text-muted-foreground",
                )}
              >
                Invoices
              </button>
            </div>
            {view === "board" ? (
              <div className="flex flex-wrap gap-4 text-sm">
                <Stat label="Open" value={money(openValue)} />
                <Stat label="Quotes" value={String(quotesWaiting)} />
                <Stat label="On site" value={String(onSite)} />
                <Stat label="Unscheduled" value={String(unscheduled)} />
              </div>
            ) : null}
          </div>
        </div>
        {view === "board" ? (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search jobs, customers, suburbs"
              className="max-w-xs"
            />
            <FilterChip active={assignee === "all"} onClick={() => setAssignee("all")}>
              All
            </FilterChip>
            <FilterChip active={assignee === "unassigned"} onClick={() => setAssignee("unassigned")}>
              Unassigned
            </FilterChip>
            {staff.map((s) => (
              <FilterChip key={s.id} active={assignee === s.id} onClick={() => setAssignee(s.id)}>
                {s.name.split(" ")[0]}
              </FilterChip>
            ))}
          </div>
        ) : null}
      </div>
      {view === "invoices" ? (
        <InvoicesPage />
      ) : (
      <div className="melo-scroll flex min-h-0 flex-1 gap-3 overflow-x-auto px-4 py-4 sm:px-6">
        {STAGES.map((stage) => {
          const col = visible.filter((j) => j.stage === stage);
          const value = col.reduce((n, j) => n + j.value, 0);
          return (
            <div
              key={stage}
              onDragOver={(e) => {
                e.preventDefault();
                setOver(stage);
              }}
              onDragLeave={() => setOver((s) => (s === stage ? null : s))}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("text/job-id");
                if (id) move(id, stage);
                setOver(null);
              }}
              className={cn(
                "flex w-[280px] shrink-0 flex-col rounded-2xl bg-muted/80 p-1.5",
                over === stage && "ring-2 ring-primary/40",
              )}
            >
              <div className="flex items-baseline justify-between px-2.5 py-2">
                <div className="text-sm font-semibold">{STAGE_LABEL[stage]}</div>
                <div className="text-xs tabular text-muted-foreground">
                  {col.length} · {money(value)}
                </div>
              </div>
              <div className="flex flex-col gap-2 px-1 pb-1">
                {col.map((j) => (
                  <JobCard
                    key={j.id}
                    job={j}
                    customer={customers.find((c) => c.id === j.customerId)}
                    staff={staff.find((x) => x.id === j.assigneeId)}
                    onOpen={() => select(j.id)}
                  />
                ))}
                {col.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border px-3 py-8 text-center text-xs text-muted-foreground">
                    {over === stage ? "Drop here" : "None"}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-semibold tabular">{value}</div>
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-2.5 py-1 text-xs font-medium",
        active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function JobCard({
  job,
  customer,
  staff,
  onOpen,
}: {
  job: Job;
  customer?: Customer;
  staff?: StaffMember;
  onOpen: () => void;
}) {
  const dragged = useRef(false);
  const last = job.statusHistory[job.statusHistory.length - 1]?.at;
  const staleQuote = job.quote?.status === "sent" && job.quote.expiry < "2026-09-12";

  return (
    <button
      type="button"
      draggable
      onDragStart={(e) => {
        dragged.current = true;
        e.dataTransfer.setData("text/job-id", job.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      onDragEnd={() => {
        window.setTimeout(() => {
          dragged.current = false;
        }, 0);
      }}
      onClick={() => {
        if (dragged.current) return;
        onOpen();
      }}
      className="rounded-xl border border-border bg-canvas p-3 text-left shadow-hairline hover:border-primary/40"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[11px] tabular text-muted-foreground">{job.number}</div>
          <div className="text-sm font-semibold">{job.title}</div>
        </div>
        <span className="text-sm font-semibold tabular">{money(job.value)}</span>
      </div>
      <div className="mt-1 text-xs text-muted-foreground">
        {customer?.name} · {job.suburb}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <ChannelChip channel={job.channel} />
        <StaffFace staff={staff} />
      </div>
      <div className="mt-2 truncate text-[11px] text-subtle">{job.nextAction}</div>
      {job.quote?.status === "in_review" ? (
        <div className="mt-2 text-[11px] font-medium text-warning">Quote {QUOTE_LABEL[job.quote.status]}</div>
      ) : job.quote?.signature?.status === "awaiting" || job.quote?.status === "sent" ? (
        <div className="mt-2 text-[11px] font-medium text-warning">{job.quote.number} awaiting signature</div>
      ) : job.quote?.signature?.status === "signed" ? (
        <div className="mt-2 text-[11px] font-medium text-success">{job.quote.number} signed — job approved</div>
      ) : staleQuote && job.quote ? (
        <div className="mt-2 text-[11px] font-medium text-warning">
          {job.quote.number} expires {dt(`${job.quote.expiry}T09:00:00+10:00`, "d MMM")}
        </div>
      ) : last ? (
        <div className="mt-2 text-[11px] text-subtle">{relative(last)}</div>
      ) : null}
    </button>
  );
}

function StaffFace({ staff }: { staff?: StaffMember }) {
  if (!staff) {
    return <span className="text-[11px] text-muted-foreground">Unassigned</span>;
  }
  const bg = staff.id === "dez" ? "bg-agent-dispatch" : staff.id === "alex" ? "bg-foreground" : "bg-primary";
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("flex size-5 items-center justify-center rounded-full text-[9px] font-semibold text-primary-foreground", bg)}>
        {initials(staff.name)}
      </span>
      <span className="text-[11px] text-muted-foreground">{staff.name.split(" ")[0]}</span>
    </span>
  );
}

function JobRecord({ job, onBack }: { job: Job; onBack: () => void }) {
  const customers = useMelo((s) => s.customers);
  const staff = useMelo((s) => s.staff);
  const workspace = useMelo((s) => s.workspace);
  const reviews = useMelo((s) => s.reviewItems);
  const move = useMelo((s) => s.moveJob);
  const convert = useMelo((s) => s.convertQuoteToInvoice);
  const raise = useMelo((s) => s.raiseInvoice);
  const sendQuote = useMelo((s) => s.sendQuoteForSignature);
  const approve = useMelo((s) => s.approveReview);
  const pay = useMelo((s) => s.recordPayment);
  const addNote = useMelo((s) => s.addJobNote);
  const navigate = useNavigate();
  const customer = customers.find((c) => c.id === job.customerId);
  const site = customer?.sites.find((s) => s.id === job.siteId);
  const assignee = staff.find((s) => s.id === job.assigneeId);
  const pendingQuote = reviews.find((r) => r.jobId === job.id && r.kind === "quote" && r.status === "pending");
  const t = totals(job.quote?.items ?? job.items, job.quote?.discount ?? 0);
  const [note, setNote] = useState("");
  const [payOpen, setPayOpen] = useState(false);
  const [sendInv, setSendInv] = useState<{ id: string; intent: "send" | "reminder" } | null>(null);

  if (!customer) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="melo-scroll h-[calc(100dvh-56px)] overflow-y-auto">
      <div className="border-b border-border bg-canvas px-4 py-4 sm:px-6">
        <button type="button" onClick={onBack} className="mb-2 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Pipeline
        </button>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">
                {job.number} · {job.title}
              </h1>
              <StagePill stage={job.stage} />
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              {customer.name} · {site ? `${site.address}, ${site.suburb}` : job.suburb} · {money(job.value)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-semibold tabular">{moneyExact(t.inc || job.value)}</div>
            <div className="text-xs text-muted-foreground">{t.inc ? "inc GST" : "estimate"}</div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-1">
          {STAGES.map((st, i) => (
            <span key={st} className="inline-flex items-center gap-1">
              {i > 0 ? <span className="text-subtle">/</span> : null}
              <button
                type="button"
                onClick={() => move(job.id, st)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-medium",
                  job.stage === st ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
                )}
              >
                {STAGE_LABEL[st]}
              </button>
            </span>
          ))}
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <Tabs defaultValue="overview">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="money">Money</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="grid gap-4 lg:grid-cols-3">
            <section className="rounded-2xl border border-border bg-canvas p-5 lg:col-span-2">
              <div className="text-xs font-medium text-muted-foreground">Scope</div>
              <p className="mt-2 text-sm leading-relaxed">{job.scope}</p>
              {job.attachments.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {job.attachments.map((a) => (
                    <span key={a.id} className="rounded-full bg-muted px-2 py-0.5 text-xs">
                      {a.name}
                    </span>
                  ))}
                </div>
              ) : null}
              {job.workOrder ? (
                <div className="mt-3 text-xs text-muted-foreground">Work order {job.workOrder}</div>
              ) : null}
            </section>
            <aside className="space-y-3">
              <section className="rounded-2xl border border-border bg-canvas p-4">
                <div className="text-xs font-medium text-muted-foreground">Customer</div>
                <div className="mt-1 text-sm font-medium">{customer.name}</div>
                <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Phone className="size-3.5" /> {customer.phone}
                </div>
                <div className="mt-1 flex items-start gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="mt-0.5 size-3.5 shrink-0" />
                  {site ? `${site.address}, ${site.suburb} ${site.postcode}` : job.suburb}
                </div>
                <ChannelChip channel={job.channel} className="mt-3" />
              </section>
              <section className="rounded-2xl border border-border bg-canvas p-4">
                <div className="text-xs font-medium text-muted-foreground">Next action</div>
                <p className="mt-1 text-sm font-medium">{job.nextAction}</p>
                <div className="mt-3 flex items-center justify-between">
                  <StaffFace staff={assignee} />
                  {job.scheduledStart ? (
                    <button
                      type="button"
                      className="text-xs font-medium text-primary"
                      onClick={() => navigate({ to: "/app/calendar" })}
                    >
                      Calendar
                    </button>
                  ) : (
                    <button type="button" className="text-xs font-medium text-primary" onClick={() => navigate({ to: "/app/calendar" })}>
                      Book a tech
                    </button>
                  )}
                </div>
              </section>
            </aside>
          </TabsContent>

          <TabsContent value="money" className="space-y-5">
            {job.quote ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold">
                      {job.quote.number} · {QUOTE_LABEL[job.quote.status]}
                    </div>
                    <div className="text-xs text-muted-foreground">Expires {job.quote.expiry}</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {pendingQuote ? (
                      <Button size="sm" onClick={() => approve(pendingQuote.id)}>
                        Send for signature
                      </Button>
                    ) : job.quote.status !== "accepted" && job.quote.status !== "declined" && job.quote.status !== "expired" ? (
                      <Button size="sm" onClick={() => sendQuote(job.id)}>
                        {job.quote.signature?.status === "awaiting" || job.quote.status === "sent" ? "Resend for signature" : "Send for signature"}
                      </Button>
                    ) : null}
                    {job.quote ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void navigate({ to: "/sign/$quoteId", params: { quoteId: job.quote!.id } })}
                      >
                        {job.quote.signature?.status === "signed" ? "View signed quote" : "Open signing page"}
                      </Button>
                    ) : null}
                    {job.quote.status === "accepted" ? (
                      <Button size="sm" variant={job.invoices.length ? "outline" : "default"} onClick={() => convert(job.id)}>
                        Convert to invoice
                      </Button>
                    ) : null}
                  </div>
                </div>
                <QuoteSheet job={job} customer={customer} workspace={workspace} />
                <OwnerMargin job={job} />
              </div>
            ) : job.items.length ? (
              <div className="space-y-3">
                <div className="text-sm font-semibold">Estimate</div>
                <LineTable items={job.items} />
                <OwnerMargin job={job} />
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                No quote yet. Ledger drafts from the price book when the job is ready.
              </div>
            )}

            <div>
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm font-semibold">Invoices</div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const id = raise(job.id);
                      if (id) setSendInv({ id, intent: "send" });
                    }}
                  >
                    Raise invoice
                  </Button>
                  {job.invoices[0] ? (
                    <Button size="sm" variant="outline" onClick={() => setPayOpen(true)}>
                      Record payment
                    </Button>
                  ) : null}
                </div>
              </div>
              {job.invoices.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                  No invoices. Convert an accepted quote or raise a tax invoice with GST.
                </div>
              ) : (
                <div className="space-y-4">
                  {job.invoices.map((inv) => (
                    <div key={inv.id} className="space-y-3">
                      <InvoiceSheet invoice={inv} job={job} customer={customer} workspace={workspace} />
                      <SendInvoicePanel
                        jobId={job.id}
                        invoiceId={inv.id}
                        intent={inv.status === "sent" || inv.status === "viewed" || inv.status === "overdue" ? "reminder" : "send"}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {job.payments.length > 0 ? (
              <div>
                <div className="mb-2 text-sm font-semibold">Payments</div>
                <ul className="space-y-2">
                  {job.payments.map((p) => (
                    <li key={p.id} className="flex items-center justify-between rounded-xl border border-border bg-canvas px-4 py-2.5 text-sm">
                      <span>
                        {p.method.toUpperCase()} · {p.note} · {dt(p.at, "d MMM yyyy")}
                      </span>
                      <span className="tabular font-medium">{moneyExact(p.amount)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {job.labour.length > 0 ? (
              <div>
                <div className="mb-2 text-sm font-semibold">Labour</div>
                <ul className="space-y-1 text-sm">
                  {job.labour.map((l) => (
                    <li key={l.id} className="text-muted-foreground">
                      {staff.find((s) => s.id === l.staffId)?.name} · {l.hours}h · {l.note}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <PayDialog
              open={payOpen}
              onOpenChange={setPayOpen}
              job={job}
              onPay={(invoiceId, amount, method) => pay(job.id, invoiceId, amount, method)}
            />
            <SendInvoiceDialog
              open={!!sendInv}
              onOpenChange={(v) => {
                if (!v) setSendInv(null);
              }}
              jobId={job.id}
              invoiceId={sendInv?.id ?? null}
              intent={sendInv?.intent ?? "send"}
            />
          </TabsContent>

          <TabsContent value="schedule">
            <section className="rounded-2xl border border-border bg-canvas p-5">
              {job.scheduledStart && job.scheduledEnd ? (
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <CalendarDays className="size-4 text-muted-foreground" />
                      {dt(job.scheduledStart, "EEEE d MMM")}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {timeOf(job.scheduledStart)} – {timeOf(job.scheduledEnd)} · {assignee?.name ?? "Unassigned"}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">Travel buffer {job.travelMins ?? 0} min</div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => navigate({ to: "/app/calendar" })}>
                    Open calendar
                  </Button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">Unscheduled</div>
                    <p className="mt-1 text-sm text-muted-foreground">Book a tech from Calendar. Dispatch will hold a travel buffer.</p>
                  </div>
                  <Button size="sm" onClick={() => navigate({ to: "/app/calendar" })}>
                    Book a tech
                  </Button>
                </div>
              )}
            </section>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <ol className="relative space-y-4 border-l border-border pl-4">
              {job.statusHistory.map((h, i) => (
                <li key={`${h.at}-${i}`}>
                  <span className="absolute -left-1 mt-1.5 size-2 rounded-full bg-primary" />
                  <div className="text-sm font-medium">{STAGE_LABEL[h.stage]}</div>
                  <div className="text-sm text-muted-foreground">{h.note}</div>
                  <div className="text-xs text-subtle">{dt(h.at)}</div>
                </li>
              ))}
            </ol>
            <div className="space-y-2">
              {job.notes.map((n) => (
                <div key={n.id} className="rounded-xl border border-border bg-canvas p-3 text-sm">
                  <div className="text-xs text-muted-foreground">
                    {n.author} · {dt(n.at)}
                  </div>
                  {n.text}
                </div>
              ))}
            </div>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                addNote(job.id, note);
                setNote("");
              }}
            >
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note" />
              <Button type="submit" size="sm" disabled={!note.trim()}>
                Add
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function LineTable({ items }: { items: Job["items"] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-canvas">
      <table className="w-full text-sm">
        <thead className="bg-muted text-left text-xs text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">Description</th>
            <th className="px-3 py-2 font-medium">Qty</th>
            <th className="px-3 py-2 font-medium">Cost</th>
            <th className="px-3 py-2 font-medium">Sell</th>
            <th className="px-3 py-2 font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.id} className="border-t border-border">
              <td className="px-3 py-2">
                {i.description}
                {i.optional ? " (optional)" : ""}
              </td>
              <td className="px-3 py-2 tabular">
                {i.qty} {i.unit}
              </td>
              <td className="px-3 py-2 tabular">{moneyExact(i.cost)}</td>
              <td className="px-3 py-2 tabular">{moneyExact(i.sell)}</td>
              <td className="px-3 py-2 tabular">{moneyExact(i.qty * i.sell)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PayDialog({
  open,
  onOpenChange,
  job,
  onPay,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  job: Job;
  onPay: (invoiceId: string, amount: number, method: "stripe" | "square" | "cash" | "eft" | "card") => void;
}) {
  const invoice = job.invoices[0];
  const t = invoice ? totals(invoice.items, invoice.discount) : null;
  const paid = invoice ? job.payments.filter((p) => p.invoiceId === invoice.id).reduce((n, p) => n + p.amount, 0) : 0;
  const due = t ? Math.max(0, Math.round((t.inc - paid) * 100) / 100) : 0;
  const [amount, setAmount] = useState(String(due || ""));
  const [method, setMethod] = useState<"eft" | "card" | "cash" | "stripe">("eft");

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (v) setAmount(String(due || ""));
      }}
    >
      <DialogContent>
        <DialogTitle>Record payment</DialogTitle>
        <DialogDescription>
          {invoice ? `${invoice.number} · balance ${moneyExact(due)} inc GST` : "No invoice on this job."}
        </DialogDescription>
        {invoice ? (
          <form
            className="mt-4 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              const n = Number(amount);
              if (!n) return;
              onPay(invoice.id, n, method);
              onOpenChange(false);
            }}
          >
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Amount AUD</span>
              <Input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Method</span>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as typeof method)}
                className="flex h-9 w-full rounded-md border border-border bg-canvas px-3 text-sm"
              >
                <option value="eft">EFT</option>
                <option value="card">Card</option>
                <option value="cash">Cash</option>
                <option value="stripe">Stripe link</option>
              </select>
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Record {money(Number(amount) || 0)}</Button>
            </div>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
