import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { SendInvoiceDialog, SendInvoicePanel, invoiceBalance } from "@/components/melo/send-invoice";
import { InvoiceSheet } from "@/components/melo/quote-sheet";
import { EmptyState } from "@/components/melo/empty";
import { INVOICE_LABEL } from "@/components/melo/status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { dt, money, moneyExact } from "@/lib/format";
import { invoiceTone, sendable } from "@/lib/melo/invoice-templates";
import { useMelo } from "@/lib/melo/store";
import type { InvoiceStatus } from "@/lib/melo/types";
import { cn } from "@/lib/utils";

const FILTERS: { id: "all" | "draft" | "sent" | "overdue" | "paid"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "draft", label: "To send" },
  { id: "sent", label: "Sent" },
  { id: "overdue", label: "Overdue" },
  { id: "paid", label: "Paid" },
];

function matchesFilter(status: InvoiceStatus, filter: (typeof FILTERS)[number]["id"]) {
  if (filter === "all") return true;
  if (filter === "draft") return status === "draft" || status === "awaiting_approval";
  if (filter === "sent") return status === "sent" || status === "viewed" || status === "part_paid";
  if (filter === "overdue") return status === "overdue";
  return status === "paid";
}

export function InvoicesPage() {
  const jobs = useMelo((s) => s.jobs);
  const customers = useMelo((s) => s.customers);
  const selectJob = useMelo((s) => s.selectJob);
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const workspace = useMelo((s) => s.workspace);
  const [send, setSend] = useState<{ jobId: string; invoiceId: string; intent: "send" | "reminder" } | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return jobs.flatMap((job) => {
      const customer = customers.find((c) => c.id === job.customerId);
      if (!customer) return [];
      return job.invoices
        .filter((inv) => matchesFilter(inv.status, filter))
        .filter((inv) => {
          if (!needle) return true;
          return `${inv.number} ${customer.name} ${job.title} ${job.number}`.toLowerCase().includes(needle);
        })
        .map((invoice) => ({ job, customer, invoice, bal: invoiceBalance(invoice, job.payments) }));
    });
  }, [jobs, customers, q, filter]);

  const all = jobs.flatMap((j) => j.invoices.map((invoice) => ({ job: j, invoice, bal: invoiceBalance(invoice, j.payments) })));
  const outstanding = all.filter((r) => r.invoice.status !== "paid" && r.invoice.status !== "void" && r.invoice.status !== "draft").reduce((n, r) => n + r.bal.due, 0);
  const toSend = all.filter((r) => r.invoice.status === "draft" || r.invoice.status === "awaiting_approval").length;
  const overdue = all.filter((r) => r.invoice.status === "overdue").reduce((n, r) => n + r.bal.due, 0);
  const collected = all.filter((r) => r.invoice.status === "paid").reduce((n, r) => n + r.bal.inc, 0);
  const opened = rows.find((r) => r.invoice.id === openId) ?? rows[0] ?? null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-border px-4 py-3 sm:px-6">
        <div className="flex flex-wrap gap-4 text-sm">
          <Stat label="Outstanding" value={money(outstanding)} />
          <Stat label="To send" value={String(toSend)} />
          <Stat label="Overdue" value={money(overdue)} />
          <Stat label="Collected" value={money(collected)} />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search invoices, customers, jobs" className="max-w-xs" />
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium",
                filter === f.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="melo-scroll min-h-0 flex-1 overflow-y-auto">
        {rows.length === 0 ? (
          <EmptyState
            title="No invoices here"
            hint="Raise one from a job, or convert an accepted quote. Ledger will draft GST and a send template."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="sticky top-0 bg-canvas text-left text-xs text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="px-4 py-2.5 font-medium sm:px-6">Invoice</th>
                  <th className="px-3 py-2.5 font-medium">Customer</th>
                  <th className="px-3 py-2.5 font-medium">Job</th>
                  <th className="px-3 py-2.5 font-medium">Due</th>
                  <th className="px-3 py-2.5 text-right font-medium">Amount</th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 text-right font-medium sm:px-6"> </th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ job, customer, invoice, bal }) => (
                  <tr
                    key={invoice.id}
                    className={cn("border-b border-border hover:bg-muted/40", openId === invoice.id && "bg-muted/50")}
                    onClick={() => setOpenId(invoice.id)}
                  >
                    <td className="px-4 py-3 sm:px-6">
                      <div className="font-medium tabular">{invoice.number}</div>
                      <div className="text-xs capitalize text-muted-foreground">{invoice.kind}</div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-medium">{customer.name}</div>
                      <div className="text-xs text-muted-foreground">{customer.company ?? customer.email}</div>
                    </td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        className="text-left hover:text-primary"
                        onClick={() => selectJob(job.id)}
                      >
                        <div>{job.number}</div>
                        <div className="text-xs text-muted-foreground">{job.title}</div>
                      </button>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">{dt(invoice.dueAt, "d MMM yyyy")}</td>
                    <td className="px-3 py-3 text-right tabular">
                      <div className="font-medium">{moneyExact(bal.inc)}</div>
                      {bal.due !== bal.inc ? <div className="text-xs text-muted-foreground">{moneyExact(bal.due)} due</div> : null}
                    </td>
                    <td className="px-3 py-3">
                      <Badge tone={invoiceTone(invoice.status)}>{INVOICE_LABEL[invoice.status]}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right sm:px-6" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1.5">
                        {sendable(invoice.status) ? (
                          <Button
                            size="sm"
                            variant={invoice.status === "draft" || invoice.status === "awaiting_approval" ? "default" : "outline"}
                            onClick={() =>
                              setSend({
                                jobId: job.id,
                                invoiceId: invoice.id,
                                intent: invoice.status === "sent" || invoice.status === "viewed" || invoice.status === "overdue" ? "reminder" : "send",
                              })
                            }
                          >
                            {invoice.status === "draft" || invoice.status === "awaiting_approval" ? "Send" : "Remind"}
                          </Button>
                        ) : null}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            selectJob(job.id);
                            void navigate({ to: "/app/pipeline" });
                          }}
                        >
                          Job
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {opened ? (
          <div className="grid gap-4 border-t border-border p-4 sm:p-6 lg:grid-cols-2">
            <InvoiceSheet invoice={opened.invoice} job={opened.job} customer={opened.customer} workspace={workspace} />
            <SendInvoicePanel
              jobId={opened.job.id}
              invoiceId={opened.invoice.id}
              intent={
                opened.invoice.status === "sent" || opened.invoice.status === "viewed" || opened.invoice.status === "overdue"
                  ? "reminder"
                  : "send"
              }
            />
          </div>
        ) : null}
      </div>

      <SendInvoiceDialog
        open={!!send}
        onOpenChange={(v) => {
          if (!v) setSend(null);
        }}
        jobId={send?.jobId ?? null}
        invoiceId={send?.invoiceId ?? null}
        intent={send?.intent ?? "send"}
      />
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
