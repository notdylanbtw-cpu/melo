import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Phone, Search } from "lucide-react";
import { toast } from "sonner";
import { ChannelChip, ChannelDot, CHANNELS } from "@/components/melo/channel";
import { EmptyState } from "@/components/melo/empty";
import { AgentPortrait } from "@/components/melo/portrait";
import { StagePill } from "@/components/melo/status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { dt, relative } from "@/lib/format";
import { INDUSTRY_LABELS } from "@/lib/melo/terminology";
import { useMelo } from "@/lib/melo/store";
import { pullChannelInbox, sendChannelMessage } from "@/lib/channels/actions";
import type { Channel, Conversation } from "@/lib/melo/types";
import { cn } from "@/lib/utils";

export function InboxPage() {
  const conversations = useMelo((s) => s.conversations);
  const selectedId = useMelo((s) => s.selectedConversationId);
  const select = useMelo((s) => s.selectConversation);
  const send = useMelo((s) => s.sendInbox);
  const ingest = useMelo((s) => s.ingestPulledInbox);
  const customers = useMelo((s) => s.customers);
  const jobs = useMelo((s) => s.jobs);
  const agents = useMelo((s) => s.agents);
  const labels = INDUSTRY_LABELS[useMelo((s) => s.workspace.industry)];
  const owner = useMelo((s) => s.workspace.ownerName);
  const conv = conversations.find((c) => c.id === selectedId) ?? conversations[0];
  const customer = customers.find((c) => c.id === conv?.customerId);
  const job = jobs.find((j) => j.id === conv?.jobId);
  const [draft, setDraft] = useState("");
  const [q, setQ] = useState("");
  const [channel, setChannel] = useState<Channel | "all">("all");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [mobileThread, setMobileThread] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    void pullChannelInbox()
      .then((rows) => {
        if (Array.isArray(rows) && rows.length) ingest(rows);
      })
      .catch(() => undefined);
  }, [ingest]);

  const filtered = conversations.filter((c) => {
    if (channel !== "all" && c.channel !== channel) return false;
    if (unreadOnly && c.unread === 0) return false;
    const cust = customers.find((x) => x.id === c.customerId);
    const hay = `${c.subject} ${cust?.name ?? ""} ${c.preview}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  if (!conv) return null;

  const suggestions = suggestedReplies(conv);

  const openThread = (id: string) => {
    select(id);
    setMobileThread(true);
    setDraft("");
  };

  return (
    <div className="flex h-[calc(100dvh-56px)] min-h-0">
      <div className={cn("flex w-full shrink-0 flex-col border-r border-border bg-canvas md:w-[300px]", mobileThread && "hidden md:flex")}>
        <div className="border-b border-border p-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-semibold">Inbox</div>
            <span className="text-xs text-muted-foreground">{conversations.reduce((n, c) => n + c.unread, 0)} unread</span>
          </div>
          <div className="relative">
            <Search className="absolute top-2.5 left-2.5 size-3.5 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} className="pl-8" placeholder="Search threads" />
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            <FilterChip active={channel === "all"} onClick={() => setChannel("all")}>
              All
            </FilterChip>
            {CHANNELS.map((ch) => (
              <FilterChip key={ch} active={channel === ch} onClick={() => setChannel(ch)}>
                {ch === "whatsapp" ? "WhatsApp" : ch[0]!.toUpperCase() + ch.slice(1)}
              </FilterChip>
            ))}
            <FilterChip active={unreadOnly} onClick={() => setUnreadOnly((v) => !v)}>
              Unread
            </FilterChip>
          </div>
        </div>
        <div className="melo-scroll flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <EmptyState title="No threads" hint="Try another channel or clear search." />
          ) : (
            filtered.map((c) => {
              const cust = customers.find((x) => x.id === c.customerId);
              const active = c.id === conv.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => openThread(c.id)}
                  className={cn(
                    "flex w-full gap-2.5 border-b border-border px-3 py-3 text-left",
                    active ? "bg-accent" : "hover:bg-muted",
                  )}
                >
                  <ChannelDot channel={c.channel} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">{cust?.name}</span>
                      {c.unread ? <span className="size-1.5 rounded-full bg-primary" /> : null}
                      <span className="ml-auto shrink-0 text-[11px] text-subtle">{relative(c.updatedAt)}</span>
                    </div>
                    <div className="truncate text-xs text-muted-foreground">{c.subject}</div>
                    <div className="truncate text-xs text-subtle">{c.preview}</div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className={cn("min-w-0 flex-1 flex-col bg-background", mobileThread ? "flex" : "hidden md:flex")}>
        <div className="flex items-center justify-between gap-2 border-b border-border bg-canvas px-3 py-3 sm:px-4">
          <div className="flex min-w-0 items-center gap-2">
            <Button size="icon" variant="ghost" className="md:hidden" onClick={() => setMobileThread(false)} aria-label="Back to inbox">
              <ArrowLeft />
            </Button>
            <div className="min-w-0">
              <div className="font-semibold">{customer?.name}</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ChannelChip channel={conv.channel} />
                <span className="truncate">{conv.subject}</span>
              </div>
            </div>
          </div>
          {job ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                useMelo.getState().selectJob(job.id);
                void navigate({ to: "/app/pipeline" });
              }}
            >
              {job.number}
            </Button>
          ) : null}
        </div>
        <div className="melo-scroll flex-1 space-y-3 overflow-y-auto p-4">
          {conv.messages.map((m) => {
            const mine = m.from !== "customer";
            const agent = agents.find((a) => a.name === m.author);
            return (
              <div key={m.id} className="flex gap-2">
                {agent ? (
                  <AgentPortrait agent={agent} size={28} />
                ) : (
                  <span className="flex size-7 items-center justify-center rounded-full bg-muted text-[10px] font-semibold">
                    {m.author.slice(0, 1)}
                  </span>
                )}
                <div className={cn("max-w-[75%] rounded-xl px-3 py-2 text-sm", mine ? "border border-border bg-canvas" : "bg-accent")}>
                  <div className="text-[11px] font-medium text-muted-foreground">
                    {m.author} · {dt(m.at, "h:mm a")}
                  </div>
                  <div className="mt-0.5 leading-relaxed">{m.text}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="border-t border-border bg-canvas p-3">
          {suggestions.length ? (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setDraft(s)}
                  className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          ) : null}
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const text = draft.trim();
              if (!text) return;
              send(conv.id, text);
              setDraft("");
              const to = customer?.phone || customer?.email || "";
              if (to && conv.channel !== "email" && conv.channel !== "widget") {
                void sendChannelMessage({ data: { channel: conv.channel, to, text } }).catch((err: Error) => toast.error(err.message));
              }
            }}
          >
            <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={`Reply as ${owner}…`} />
            <Button type="submit">Send</Button>
          </form>
        </div>
      </div>

      <aside className="hidden w-[280px] shrink-0 flex-col border-l border-border bg-canvas p-4 lg:flex">
        <div className="text-sm font-semibold">{customer?.name}</div>
        <div className="mt-1 text-xs text-muted-foreground">{customer?.phone || "No phone"}</div>
        <div className="text-xs text-muted-foreground">{customer?.email || "No email"}</div>
        {customer?.sites[0] ? (
          <div className="mt-3 text-sm">
            {customer.sites[0].address}
            <div className="text-muted-foreground">
              {customer.sites[0].suburb} {customer.sites[0].state} {customer.sites[0].postcode}
            </div>
          </div>
        ) : null}
        {customer?.tags?.length ? (
          <div className="mt-3 flex flex-wrap gap-1">
            {customer.tags.map((t) => (
              <Badge key={t} tone="outline">
                {t}
              </Badge>
            ))}
          </div>
        ) : null}
        <div className="mt-4 flex flex-col gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={!customer?.phone}
            onClick={() => toast.success(`Ringing ${customer?.name} · simulated`)}
          >
            <Phone className="size-3.5" />
            Call
          </Button>
          {job ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                useMelo.getState().selectJob(job.id);
                void navigate({ to: "/app/pipeline" });
              }}
            >
              Open {job.number}
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={() => void navigate({ to: "/app/calendar" })}>
              {labels.book}
            </Button>
          )}
        </div>
        <div className="mt-4 text-xs font-medium text-muted-foreground">Notes</div>
        <p className="mt-1 text-sm leading-relaxed">{customer?.notes || "—"}</p>
        {job ? (
          <div className="mt-4 rounded-lg border border-border p-3">
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">Pipeline</div>
              <StagePill stage={job.stage} />
            </div>
            <div className="mt-1 text-sm font-medium">
              {job.number} · {job.title}
            </div>
            <div className="text-xs text-muted-foreground">{job.nextAction}</div>
          </div>
        ) : null}
        {customer?.since ? (
          <div className="mt-auto pt-6 text-[11px] text-subtle">Customer since {customer.since}</div>
        ) : null}
      </aside>
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-2 py-0.5 text-[11px] font-medium",
        active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function suggestedReplies(conv: Conversation): string[] {
  if (conv.id === "conv-mia") {
    return ["Quote is A$420 inc GST. Sam can do Thursday 7:30 am — lock it?", "Sending Q-2041 on WhatsApp now."];
  }
  if (conv.id === "conv-tom") {
    return ["Calling you back now about the Marrickville overflow.", "First window I have is 7:30 am — can you be home?"];
  }
  if (conv.id === "conv-james") {
    return ["Dez is booked for 10:00 am. He’ll text when he’s 20 minutes away."];
  }
  if (conv.id === "conv-ravi") {
    return ["Looks like a cartridge — Friday morning in Enmore from A$180 inc GST?"];
  }
  return ["I can quote or book a window — what works?"];
}
