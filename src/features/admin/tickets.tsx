import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { useAdmin } from "@/lib/admin/store";
import type { TicketStatus } from "@/lib/admin/types";
import { dt, relative } from "@/lib/format";
import { cn } from "@/lib/utils";

const TONE: Record<TicketStatus, "danger" | "warning" | "success" | "default"> = {
  open: "danger",
  waiting: "warning",
  closed: "success",
};

export function AdminTickets() {
  const tickets = useAdmin((s) => s.tickets);
  const tenants = useAdmin((s) => s.tenants);
  const selectedId = useAdmin((s) => s.selectedTicketId);
  const select = useAdmin((s) => s.selectTicket);
  const reply = useAdmin((s) => s.replyTicket);
  const setStatus = useAdmin((s) => s.setTicketStatus);
  const [draft, setDraft] = useState("");
  const ticket = tickets.find((t) => t.id === selectedId) ?? tickets[0];
  const tenant = tenants.find((t) => t.id === ticket?.tenantId);

  return (
    <div className="flex h-[calc(100dvh-56px)] min-h-0 flex-col md:flex-row">
      <aside className="flex max-h-56 shrink-0 flex-col border-b border-border bg-canvas md:max-h-none md:w-80 md:border-r md:border-b-0">
        <div className="border-b border-border px-4 py-3">
          <h1 className="text-sm font-semibold">Tickets</h1>
          <p className="text-xs text-muted-foreground">{tickets.filter((t) => t.status !== "closed").length} open</p>
        </div>
        <ul className="melo-scroll min-h-0 flex-1 overflow-y-auto">
          {tickets.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => select(t.id)}
                className={cn(
                  "w-full border-b border-border px-4 py-3 text-left hover:bg-muted/50",
                  t.id === ticket?.id && "bg-accent/60",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">{t.subject}</span>
                  <Badge tone={TONE[t.status]}>{t.status}</Badge>
                </div>
                <div className="mt-0.5 truncate text-xs text-muted-foreground">
                  {t.from} · {t.number} · {relative(t.updatedAt)}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </aside>
      {ticket ? (
        <section className="flex min-w-0 flex-1 flex-col bg-background">
          <div className="border-b border-border bg-canvas px-4 py-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-pretty">{ticket.subject}</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {ticket.number} · {tenant?.name} · {ticket.email}
                </p>
              </div>
              <div className="flex gap-1">
                {ticket.status !== "closed" ? (
                  <Button size="sm" variant="outline" onClick={() => setStatus(ticket.id, "closed")}>
                    Close
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setStatus(ticket.id, "open")}>
                    Reopen
                  </Button>
                )}
              </div>
            </div>
          </div>
          <div className="melo-scroll min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
            {ticket.messages.map((m) => (
              <article
                key={m.id}
                className={cn("max-w-xl rounded-xl border border-border bg-canvas p-3", m.from === "melo" && "ml-auto bg-accent")}
              >
                <div className="text-xs font-medium text-muted-foreground">
                  {m.author} · {dt(m.at, "d MMM, h:mm a")}
                </div>
                <p className="mt-1 text-sm leading-relaxed text-pretty">{m.text}</p>
              </article>
            ))}
          </div>
          {ticket.status !== "closed" ? (
            <form
              className="border-t border-border bg-canvas p-3"
              onSubmit={(e) => {
                e.preventDefault();
                reply(ticket.id, draft);
                setDraft("");
              }}
            >
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={`Reply to ${ticket.from}…`}
                className="min-h-24"
              />
              <div className="mt-2 flex justify-end">
                <Button type="submit" disabled={!draft.trim()}>
                  Send reply
                </Button>
              </div>
            </form>
          ) : (
            <div className="border-t border-border px-4 py-3 text-sm text-muted-foreground">This ticket is closed.</div>
          )}
        </section>
      ) : null}
    </div>
  );
}
