import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Mail, MessageSquare } from "lucide-react";
import { InvoiceSheet } from "@/components/melo/quote-sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input, Textarea } from "@/components/ui/input";
import { dt, moneyExact } from "@/lib/format";
import {
  fillTemplate,
  invoiceContext,
  invoiceTone,
  pickTemplate,
  sendable,
} from "@/lib/melo/invoice-templates";
import { useMelo } from "@/lib/melo/store";
import { totals } from "@/lib/melo/totals";
import type { Channel, Invoice } from "@/lib/melo/types";
import { cn } from "@/lib/utils";
import { INVOICE_LABEL } from "@/components/melo/status";

const SEND_CHANNELS: { id: "email" | "sms" | "whatsapp"; label: string }[] = [
  { id: "email", label: "Email" },
  { id: "sms", label: "SMS" },
  { id: "whatsapp", label: "WhatsApp" },
];

export function SendInvoiceDialog({
  open,
  onOpenChange,
  jobId,
  invoiceId,
  intent = "send",
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  jobId: string | null;
  invoiceId: string | null;
  intent?: "send" | "reminder";
}) {
  const jobs = useMelo((s) => s.jobs);
  const customers = useMelo((s) => s.customers);
  const workspace = useMelo((s) => s.workspace);
  const templates = useMelo((s) => s.invoiceTemplates);
  const send = useMelo((s) => s.sendInvoice);
  const setSettingsTab = useMelo((s) => s.setSettingsTab);
  const navigate = useNavigate();

  const job = jobs.find((j) => j.id === jobId);
  const invoice = job?.invoices.find((i) => i.id === invoiceId);
  const customer = job ? customers.find((c) => c.id === job.customerId) : undefined;

  const defaultChannel: "email" | "sms" | "whatsapp" =
    job?.channel === "sms" || job?.channel === "whatsapp" || job?.channel === "email" ? job.channel : "email";

  const [channel, setChannel] = useState<"email" | "sms" | "whatsapp">(defaultChannel);
  const [templateId, setTemplateId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const paid = job && invoice ? job.payments.filter((p) => p.invoiceId === invoice.id).reduce((n, p) => n + p.amount, 0) : 0;
  const ctx = useMemo(() => {
    if (!job || !invoice || !customer) return null;
    return invoiceContext({ invoice, job, customer, workspace, paid });
  }, [job, invoice, customer, workspace, paid]);

  useEffect(() => {
    if (!open || !invoice) return;
    const ch = defaultChannel;
    setChannel(ch);
    const tpl = pickTemplate(templates, invoice, ch, intent);
    setTemplateId(tpl?.id ?? templates[0]?.id ?? "");
    if (tpl && ctx) {
      setSubject(fillTemplate(tpl.subject, ctx));
      setBody(fillTemplate(tpl.body, ctx));
    }
  }, [open, invoice?.id, intent]); // eslint-disable-line react-hooks/exhaustive-deps

  function applyTemplate(id: string, ch: Channel) {
    const tpl = templates.find((t) => t.id === id) ?? pickTemplate(templates, invoice!, ch, intent);
    if (!tpl || !ctx) return;
    setTemplateId(tpl.id);
    setSubject(fillTemplate(tpl.subject, ctx));
    setBody(fillTemplate(tpl.body, ctx));
  }

  if (!job || !invoice || !customer || !ctx) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogTitle>Send invoice</DialogTitle>
          <DialogDescription>Pick an invoice first.</DialogDescription>
        </DialogContent>
      </Dialog>
    );
  }

  const t = totals(invoice.items, invoice.discount);
  const due = Math.max(0, Math.round((t.inc - paid) * 100) / 100);
  const to = channel === "email" ? customer.email : customer.phone;
  const matching = templates.filter((tpl) => tpl.channel === (channel === "email" ? "email" : "sms"));
  const canSend = sendable(invoice.status) && body.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="melo-scroll max-h-[min(92vh,880px)] w-[min(920px,calc(100%-24px))] overflow-y-auto">
        <DialogTitle>{intent === "reminder" ? "Send reminder" : "Send invoice"}</DialogTitle>
        <DialogDescription>
          {invoice.number} · {customer.name} · {moneyExact(due || t.inc)} inc GST
        </DialogDescription>

        <div className="mt-4 grid gap-5 lg:grid-cols-2">
          <div className="space-y-3">
            <div>
              <div className="mb-1.5 text-sm font-medium">Channel</div>
              <div className="flex flex-wrap gap-1.5">
                {SEND_CHANNELS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setChannel(c.id);
                      const tpl = pickTemplate(templates, invoice, c.id, intent);
                      if (tpl) applyTemplate(tpl.id, c.id);
                    }}
                    className={cn(
                      "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium",
                      channel === c.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {c.id === "email" ? <Mail className="size-3.5" /> : <MessageSquare className="size-3.5" />}
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <label className="block">
              <span className="mb-1 block text-sm font-medium">To</span>
              <Input value={to} readOnly />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium">Template</span>
              <select
                value={templateId}
                onChange={(e) => applyTemplate(e.target.value, channel)}
                className="flex h-9 w-full rounded-md border border-border bg-canvas px-3 text-sm"
              >
                {matching.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.name}
                  </option>
                ))}
              </select>
            </label>

            {channel === "email" ? (
              <label className="block">
                <span className="mb-1 block text-sm font-medium">Subject</span>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
              </label>
            ) : null}

            <label className="block">
              <span className="mb-1 block text-sm font-medium">Message</span>
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} className="min-h-40" />
            </label>

            <p className="text-xs text-muted-foreground">
              Edit this send only. Saved templates live in Settings.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Tax invoice</div>
              <Badge tone={invoiceTone(invoice.status)}>{INVOICE_LABEL[invoice.status]}</Badge>
            </div>
            <InvoiceSheet invoice={invoice} job={job} customer={customer} workspace={workspace} className="p-4" />
            <div className="text-xs text-muted-foreground">
              Issued {dt(invoice.issuedAt, "d MMM yyyy")} · due {ctx.due}
              {invoice.sentAt ? ` · last sent ${dt(invoice.sentAt, "d MMM, h:mm a")}` : ""}
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              onOpenChange(false);
              setSettingsTab("templates");
              void navigate({ to: "/app/settings" });
            }}
          >
            Edit templates
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              disabled={!canSend}
              onClick={() => {
                send({ jobId: job.id, invoiceId: invoice.id, templateId, channel, subject, body });
                onOpenChange(false);
              }}
            >
              {intent === "reminder" ? "Send reminder" : `Send ${invoice.number}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function invoiceBalance(invoice: Invoice, payments: { invoiceId: string; amount: number }[]) {
  const t = totals(invoice.items, invoice.discount);
  const paid = payments.filter((p) => p.invoiceId === invoice.id).reduce((n, p) => n + p.amount, 0);
  return { inc: t.inc, paid, due: Math.max(0, Math.round((t.inc - paid) * 100) / 100) };
}
