import { dt, moneyExact } from "@/lib/format";
import { totals } from "@/lib/melo/totals";
import type { Customer, Invoice, Job, Workspace } from "@/lib/melo/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { INVOICE_LABEL } from "@/components/melo/status";
import { SignaturePreview } from "@/components/melo/signature-pad";

export function QuoteSheet({
  job,
  customer,
  workspace,
  className,
}: {
  job: Job;
  customer: Customer;
  workspace: Workspace;
  className?: string;
}) {
  const quote = job.quote;
  const items = quote?.items ?? job.items;
  const t = totals(items, quote?.discount ?? 0);
  const site = customer.sites.find((s) => s.id === job.siteId);

  return (
    <article className={cn("rounded-2xl border border-border bg-canvas p-6", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {workspace.brandName.slice(0, 1)}
          </span>
          <div>
            <div className="text-sm font-semibold">{workspace.brandName}</div>
            <div className="text-xs text-muted-foreground">ABN {workspace.abn}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Quote</div>
          <div className="text-lg font-semibold tabular">{quote?.number ?? job.number}</div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <div className="text-xs font-medium text-muted-foreground">Bill to</div>
          <div className="mt-1 text-sm font-medium">{customer.name}</div>
          <div className="text-sm text-muted-foreground">
            {site ? `${site.address}, ${site.suburb} ${site.postcode}` : job.suburb}
          </div>
          <div className="text-sm text-muted-foreground">{customer.phone}</div>
        </div>
        <div className="sm:text-right">
          <div className="text-xs font-medium text-muted-foreground">Job</div>
          <div className="mt-1 text-sm font-medium">{job.number} · {job.title}</div>
          <div className="text-sm text-muted-foreground">Valid until {quote?.expiry ?? "—"}</div>
          <div className="text-sm text-muted-foreground">{quote?.terms}</div>
        </div>
      </div>

      <LineRows items={items} />

      <Totals t={t} />

      <QuoteContract quote={quote} customerName={customer.name} />
    </article>
  );
}

function QuoteContract({ quote, customerName }: { quote?: Job["quote"]; customerName: string }) {
  if (!quote) return null;
  const signed = quote.status === "accepted" || quote.signature?.status === "signed";
  const awaiting = !signed && (quote.signature?.status === "awaiting" || quote.status === "sent");
  return (
    <div className="mt-6 border-t border-border pt-4">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Contract</div>
      <p className="mt-1 text-sm text-muted-foreground text-pretty">
        Signing this quote approves the job. It accepts the scope, price and terms and authorises {quote.number} to proceed.
      </p>
      {signed && quote.signature ? (
        <div className="mt-3 space-y-1.5">
          <Badge tone="success">Signed — job approved</Badge>
          <SignaturePreview
            image={quote.signature.image}
            name={quote.signature.signerName ?? customerName}
            at={quote.signature.signedAt ? `Signed ${dt(quote.signature.signedAt, "d MMM yyyy, h:mm a")}` : undefined}
          />
        </div>
      ) : awaiting ? (
        <div className="mt-3">
          <Badge tone="warning">Awaiting {customerName.split(" ")[0]}’s signature</Badge>
          <div className="mt-2 h-16 rounded-lg border border-dashed border-border bg-muted/40" />
        </div>
      ) : quote.status === "declined" ? (
        <div className="mt-3">
          <Badge tone="danger">Declined</Badge>
        </div>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">Send for e-signature. The client’s sign-off is the job approval.</p>
      )}
    </div>
  );
}

export function InvoiceSheet({
  invoice,
  job,
  customer,
  workspace,
  className,
}: {
  invoice: Invoice;
  job: Job;
  customer: Customer;
  workspace: Workspace;
  className?: string;
}) {
  const t = totals(invoice.items, invoice.discount);
  const paid = job.payments.filter((p) => p.invoiceId === invoice.id).reduce((n, p) => n + p.amount, 0);
  const due = Math.max(0, Math.round((t.inc - paid) * 100) / 100);
  const site = customer.sites.find((s) => s.id === job.siteId);

  return (
    <article className={cn("rounded-2xl border border-border bg-canvas p-6", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {workspace.brandName.slice(0, 1)}
          </span>
          <div>
            <div className="text-sm font-semibold">{workspace.brandName}</div>
            <div className="text-xs text-muted-foreground">ABN {workspace.abn}</div>
            <div className="text-xs text-muted-foreground">{workspace.address}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Tax invoice</div>
          <div className="text-lg font-semibold tabular">{invoice.number}</div>
          <div className="mt-1">
            <Badge tone={invoice.status === "paid" ? "success" : invoice.status === "overdue" ? "danger" : "warning"}>
              {INVOICE_LABEL[invoice.status]}
            </Badge>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <div className="text-xs font-medium text-muted-foreground">Bill to</div>
          <div className="mt-1 text-sm font-medium">{customer.name}</div>
          <div className="text-sm text-muted-foreground">
            {site ? `${site.address}, ${site.suburb} ${site.postcode}` : job.suburb}
          </div>
        </div>
        <div className="sm:text-right text-sm">
          <div className="text-muted-foreground">Issued {dt(invoice.issuedAt, "d MMM yyyy")}</div>
          <div className="text-muted-foreground">Due {dt(invoice.dueAt.includes("T") ? invoice.dueAt : `${invoice.dueAt}T09:00:00+10:00`, "d MMM yyyy")}</div>
          <div className="text-muted-foreground capitalize">{invoice.kind} · Xero {invoice.xeroSync}</div>
        </div>
      </div>

      <LineRows items={invoice.items} />
      <Totals t={t} />

      <dl className="mt-3 ml-auto w-full max-w-xs space-y-1.5 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Paid</dt>
          <dd className="tabular">{moneyExact(paid)}</dd>
        </div>
        <div className="flex justify-between font-medium">
          <dt>Balance due</dt>
          <dd className="tabular">{moneyExact(due)}</dd>
        </div>
      </dl>
    </article>
  );
}

export function OwnerMargin({ job }: { job: Job }) {
  const items = job.quote?.items ?? job.items;
  const t = totals(items, job.quote?.discount ?? 0);
  return (
    <div className="grid grid-cols-3 gap-2 text-sm">
      {[
        ["Cost", moneyExact(t.cost)],
        ["Margin", moneyExact(t.margin)],
        ["Margin %", `${t.marginPct}%`],
      ].map(([k, v]) => (
        <div key={k} className="rounded-lg bg-muted px-3 py-2">
          <div className="text-xs text-muted-foreground">{k}</div>
          <div className="font-medium tabular">{v}</div>
        </div>
      ))}
    </div>
  );
}

function LineRows({ items }: { items: Job["items"] }) {
  return (
    <table className="mt-6 w-full text-sm">
      <thead>
        <tr className="border-b border-border text-left text-xs text-muted-foreground">
          <th className="py-2 font-medium">Description</th>
          <th className="py-2 font-medium">Qty</th>
          <th className="py-2 text-right font-medium">Amount</th>
        </tr>
      </thead>
      <tbody>
        {items.map((i) => (
          <tr key={i.id} className="border-b border-border">
            <td className="py-2.5">{i.description}</td>
            <td className="py-2.5 tabular text-muted-foreground">
              {i.qty} {i.unit}
            </td>
            <td className="py-2.5 text-right tabular">{moneyExact(i.qty * i.sell)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Totals({ t }: { t: ReturnType<typeof totals> }) {
  return (
    <dl className="mt-4 ml-auto w-full max-w-xs space-y-1.5 text-sm">
      <div className="flex justify-between">
        <dt className="text-muted-foreground">Ex GST</dt>
        <dd className="tabular">{moneyExact(t.ex)}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-muted-foreground">GST 10%</dt>
        <dd className="tabular">{moneyExact(t.gst)}</dd>
      </div>
      <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
        <dt>Total AUD</dt>
        <dd className="tabular">{moneyExact(t.inc)}</dd>
      </div>
    </dl>
  );
}
