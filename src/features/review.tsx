import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AgentPortrait } from "@/components/melo/portrait";
import { OwnerMargin, QuoteSheet, InvoiceSheet } from "@/components/melo/quote-sheet";
import { SendInvoiceDialog } from "@/components/melo/send-invoice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { dt, money } from "@/lib/format";
import { useMelo } from "@/lib/melo/store";
import type { ReviewItem, ReviewKind } from "@/lib/melo/types";
import { cn } from "@/lib/utils";

const FILTERS: { id: "all" | ReviewKind; label: string }[] = [
  { id: "all", label: "All" },
  { id: "quote", label: "Quotes" },
  { id: "content", label: "Content" },
  { id: "money", label: "Money" },
  { id: "message", label: "Messages" },
];

export function ReviewPage() {
  const items = useMelo((s) => s.reviewItems);
  const selectedId = useMelo((s) => s.selectedReviewId);
  const select = useMelo((s) => s.selectReview);
  const approve = useMelo((s) => s.approveReview);
  const reject = useMelo((s) => s.rejectReview);
  const agents = useMelo((s) => s.agents);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const list = items.filter((i) => (filter === "all" ? true : i.kind === filter));
  const item = list.find((i) => i.id === selectedId) ?? list[0];
  const agent = agents.find((a) => a.id === item?.agentId);
  const pending = items.filter((r) => r.status === "pending").length;
  const navigate = useNavigate();
  const [sendOpen, setSendOpen] = useState(false);
  const jobs = useMelo((s) => s.jobs);
  const moneyInvoice = item?.kind === "money" && item.jobId
    ? jobs.find((j) => j.id === item.jobId)?.invoices[0]
    : undefined;

  return (
    <div className="flex h-[calc(100dvh-56px)] min-h-0 flex-col md:flex-row">
      <div className="flex w-full shrink-0 flex-col border-b border-border bg-canvas md:w-80 md:border-r md:border-b-0">
        <div className="border-b border-border p-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Review</div>
            <span className="text-xs text-muted-foreground">{pending} waiting</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-medium",
                  filter === f.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="melo-scroll flex max-h-48 flex-1 overflow-y-auto md:max-h-none">
          {list.map((r) => {
            const a = agents.find((x) => x.id === r.agentId);
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => select(r.id)}
                className={cn("flex w-full gap-2.5 border-b border-border px-3 py-3 text-left", r.id === item?.id ? "bg-accent" : "hover:bg-muted")}
              >
                {a ? <AgentPortrait agent={a} size={32} /> : null}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium">{r.title}</span>
                    <StatusDot status={r.status} />
                  </div>
                  <div className="truncate text-xs text-muted-foreground">{r.summary}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      {item ? (
        <div className="melo-scroll min-w-0 flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="mx-auto max-w-3xl">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                {agent ? <AgentPortrait agent={agent} size={44} /> : null}
                <div>
                  <h1 className="text-xl font-semibold tracking-tight">{item.title}</h1>
                  <p className="text-sm text-muted-foreground">
                    {agent?.name} · {item.kind} · {dt(item.createdAt, "d MMM, h:mm a")}
                  </p>
                </div>
              </div>
              <Badge tone={item.status === "pending" ? "warning" : item.status === "approved" ? "success" : "danger"}>
                {item.status === "pending" ? "Needs Alex" : item.status}
              </Badge>
            </div>

            <div className="mt-6">
              <Artefact item={item} />
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <div className="text-xs font-medium text-muted-foreground">Sources</div>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {item.sources.map((s) => (
                    <span key={s} className="rounded-full bg-muted px-2 py-0.5 text-xs">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground">History</div>
                <ul className="mt-1.5 space-y-1 text-sm text-muted-foreground">
                  {item.history.map((h, i) => (
                    <li key={i}>
                      {dt(h.at, "d MMM, h:mm a")} — {h.text}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {item.status === "pending" ? (
              <div className="mt-6 flex flex-wrap gap-2">
                <Button variant="danger" onClick={() => reject(item.id)}>
                  Reject
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (item.jobId) {
                      useMelo.getState().selectJob(item.jobId);
                      void navigate({ to: "/app/pipeline" });
                    } else if (item.kind === "content") {
                      void navigate({ to: "/app/reach" });
                    } else if (item.conversationId) {
                      useMelo.getState().selectConversation(item.conversationId);
                      void navigate({ to: "/app/inbox" });
                    }
                  }}
                >
                  Edit
                </Button>
                <Button
                  onClick={() => {
                    if (item.kind === "money" && moneyInvoice) {
                      setSendOpen(true);
                      return;
                    }
                    approve(item.id);
                  }}
                >
                  {item.kind === "money" ? "Send invoice" : item.kind === "quote" ? "Send for signature" : "Approve & send"}
                </Button>
              </div>
            ) : (
              <p className="mt-6 text-sm text-muted-foreground">This item is {item.status}.</p>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">Nothing in this filter.</div>
      )}
      <SendInvoiceDialog
        open={sendOpen}
        onOpenChange={setSendOpen}
        jobId={item?.jobId ?? null}
        invoiceId={moneyInvoice?.id ?? null}
        intent="send"
      />
    </div>
  );
}

function StatusDot({ status }: { status: ReviewItem["status"] }) {
  return (
    <span
      className={cn(
        "size-1.5 shrink-0 rounded-full",
        status === "pending" ? "bg-warning" : status === "approved" ? "bg-success" : "bg-danger",
      )}
    />
  );
}

function Artefact({ item }: { item: ReviewItem }) {
  const jobs = useMelo((s) => s.jobs);
  const customers = useMelo((s) => s.customers);
  const workspace = useMelo((s) => s.workspace);
  const content = useMelo((s) => s.content);
  const conversations = useMelo((s) => s.conversations);
  const navigate = useNavigate();
  const selectJob = useMelo((s) => s.selectJob);

  if (item.kind === "quote" && item.jobId) {
    const job = jobs.find((j) => j.id === item.jobId);
    const customer = job ? customers.find((c) => c.id === job.customerId) : undefined;
    if (job && customer) {
      return (
        <div className="space-y-3">
          <QuoteSheet job={job} customer={customer} workspace={workspace} />
          <OwnerMargin job={job} />
          <p className="text-sm text-muted-foreground">
            Sending asks {customer.name.split(" ")[0]} to e-sign. Their signature approves the job and contracts the scope.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="text-xs text-primary hover:underline"
              onClick={() => {
                selectJob(job.id);
                void navigate({ to: "/app/pipeline" });
              }}
            >
              Open {job.number} in Pipeline
            </button>
            {job.quote ? (
              <button
                type="button"
                className="text-xs text-primary hover:underline"
                onClick={() => void navigate({ to: "/sign/$quoteId", params: { quoteId: job.quote!.id } })}
              >
                Preview signing page
              </button>
            ) : null}
          </div>
        </div>
      );
    }
  }

  if (item.kind === "content") {
    const post = content.find((c) => c.id === item.contentId) ?? content[0];
    return (
      <article className="rounded-2xl border border-border bg-canvas p-5">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Google Business Profile</div>
        <h2 className="mt-2 text-lg font-semibold tracking-tight">{post?.title ?? item.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {post?.suburb} · {post?.demand} demand
        </p>
        <p className="mt-4 text-sm leading-relaxed text-pretty">{post?.body ?? item.preview}</p>
      </article>
    );
  }

  if (item.kind === "message") {
    const conv = conversations.find((c) => c.id === item.conversationId);
    const customer = customers.find((c) => c.id === conv?.customerId);
    return (
      <div className="rounded-2xl border border-border bg-canvas p-5">
        <div className="text-xs font-medium text-muted-foreground">
          Draft to {customer?.name ?? "customer"} · {conv?.channel ?? "message"}
        </div>
        <p className="mt-4 max-w-md rounded-2xl rounded-tl-md bg-accent px-4 py-3 text-sm leading-relaxed">{item.preview}</p>
        <p className="mt-3 text-xs text-muted-foreground">Won’t send until you approve. Scout autopilot is Draft only.</p>
      </div>
    );
  }

  if (item.kind === "money") {
    const job = jobs.find((j) => j.id === item.jobId);
    const customer = job ? customers.find((c) => c.id === job.customerId) : undefined;
    const invoice = job?.invoices[0];
    if (job && customer && invoice) {
      return (
        <div className="space-y-3">
          <InvoiceSheet invoice={invoice} job={job} customer={customer} workspace={workspace} />
          <p className="text-sm text-muted-foreground text-pretty">{item.preview}</p>
        </div>
      );
    }
    const deposit = job ? Math.round(job.value * ((job.quote?.depositPct ?? 50) / 100)) : 3200;
    return (
      <div className="rounded-2xl border border-border bg-canvas p-5">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Payment request</div>
        <div className="mt-2 text-3xl font-semibold tabular">{money(deposit)}</div>
        <p className="mt-1 text-sm text-muted-foreground">
          {job?.quote?.depositPct ?? 50}% deposit{job?.quote ? ` on ${job.quote.number}` : ""}
        </p>
        <p className="mt-2 text-sm text-muted-foreground text-pretty">{item.preview}</p>
        {job ? (
          <p className="mt-3 text-xs text-muted-foreground">
            {job.number} · {job.title} · {job.suburb}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-canvas p-5 text-sm leading-relaxed">{item.preview}</div>
  );
}
