import { dt, moneyExact } from "@/lib/format";
import { totals } from "@/lib/melo/totals";
import type {
  Channel,
  Customer,
  Invoice,
  InvoiceTemplate,
  Job,
  Workspace,
} from "@/lib/melo/types";

export const TEMPLATE_TOKENS = [
  "first_name",
  "customer",
  "invoice_number",
  "amount",
  "due",
  "job",
  "job_number",
  "business",
  "owner",
  "abn",
  "payment_link",
  "site",
] as const;

export const DEFAULT_INVOICE_TEMPLATES: InvoiceTemplate[] = [
  {
    id: "tpl-invoice-email",
    name: "Tax invoice",
    kind: "invoice",
    channel: "email",
    subject: "Tax invoice {{invoice_number}} from {{business}} — {{amount}}",
    body: `Hi {{first_name}},

Please find tax invoice {{invoice_number}} for {{job}} ({{job_number}}) at {{site}}.

Amount due: {{amount}} inc GST
Due: {{due}}

Pay online: {{payment_link}}

EFT is fine too — details are on the invoice. Reply if anything looks off.

{{owner}}
{{business}}
ABN {{abn}}`,
  },
  {
    id: "tpl-invoice-sms",
    name: "Tax invoice",
    kind: "invoice",
    channel: "sms",
    subject: "",
    body: "Hi {{first_name}}, {{business}} invoice {{invoice_number}} for {{job}} is {{amount}} due {{due}}. Pay: {{payment_link}} — {{owner}}",
  },
  {
    id: "tpl-deposit-email",
    name: "Deposit request",
    kind: "deposit",
    channel: "email",
    subject: "Deposit invoice {{invoice_number}} — {{job}}",
    body: `Hi {{first_name}},

To lock in {{job}} ({{job_number}}) please pay the deposit on invoice {{invoice_number}}.

Deposit due: {{amount}} inc GST
Due: {{due}}

Pay: {{payment_link}}

We’ll schedule the crew once it lands. Shout if accounts need a Xero copy.

{{owner}}
{{business}}`,
  },
  {
    id: "tpl-deposit-sms",
    name: "Deposit request",
    kind: "deposit",
    channel: "sms",
    subject: "",
    body: "Hi {{first_name}}, deposit {{invoice_number}} for {{job}} is {{amount}} due {{due}}. Pay: {{payment_link}} — {{business}}",
  },
  {
    id: "tpl-reminder-email",
    name: "Payment reminder",
    kind: "reminder",
    channel: "email",
    subject: "Friendly reminder — {{invoice_number}} {{amount}} due {{due}}",
    body: `Hi {{first_name}},

Just a nudge on invoice {{invoice_number}} for {{job}}. {{amount}} is due {{due}}.

Pay: {{payment_link}}

If it’s already paid, ignore this — and thank you.

{{owner}}
{{business}}`,
  },
  {
    id: "tpl-reminder-sms",
    name: "Payment reminder",
    kind: "reminder",
    channel: "sms",
    subject: "",
    body: "Hi {{first_name}}, reminder that {{invoice_number}} for {{job}} ({{amount}}) is due {{due}}. Pay: {{payment_link}} — {{business}}",
  },
  {
    id: "tpl-overdue-email",
    name: "Overdue notice",
    kind: "overdue",
    channel: "email",
    subject: "Overdue — {{invoice_number}} {{amount}}",
    body: `Hi {{first_name}},

Invoice {{invoice_number}} for {{job}} is now overdue. Balance {{amount}} was due {{due}}.

Pay today: {{payment_link}}

If there’s a problem with the work or the invoice, reply and I’ll sort it.

{{owner}}
{{business}}
ABN {{abn}}`,
  },
  {
    id: "tpl-overdue-sms",
    name: "Overdue notice",
    kind: "overdue",
    channel: "sms",
    subject: "",
    body: "Hi {{first_name}}, {{invoice_number}} for {{job}} is overdue ({{amount}}, due {{due}}). Pay: {{payment_link}} — {{business}}",
  },
];

export function paymentLink(invoice: Invoice, workspace: Workspace): string {
  const host = workspace.name.toLowerCase().replace(/[^a-z0-9]+/g, "") || "melo";
  return `https://pay.${host}.com.au/${invoice.number.toLowerCase()}`;
}

export function invoiceContext(opts: {
  invoice: Invoice;
  job: Job;
  customer: Customer;
  workspace: Workspace;
  paid?: number;
}): Record<string, string> {
  const { invoice, job, customer, workspace, paid = 0 } = opts;
  const t = totals(invoice.items, invoice.discount);
  const dueAmt = Math.max(0, Math.round((t.inc - paid) * 100) / 100);
  const site = customer.sites.find((s) => s.id === job.siteId);
  return {
    first_name: customer.name.split(" ")[0] ?? customer.name,
    customer: customer.company ? `${customer.name} (${customer.company})` : customer.name,
    invoice_number: invoice.number,
    amount: moneyExact(dueAmt || t.inc),
    due: dt(invoice.dueAt.includes("T") ? invoice.dueAt : `${invoice.dueAt}T09:00:00+10:00`, "d MMM yyyy"),
    job: job.title,
    job_number: job.number,
    business: workspace.brandName,
    owner: workspace.ownerName,
    abn: workspace.abn,
    payment_link: paymentLink(invoice, workspace),
    site: site ? `${site.address}, ${site.suburb}` : job.suburb,
  };
}

export function fillTemplate(text: string, ctx: Record<string, string>): string {
  return text.replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (_, key: string) => ctx[key.toLowerCase()] ?? "");
}

export function templateChannel(channel: Channel): "email" | "sms" {
  return channel === "email" ? "email" : "sms";
}

export function pickTemplate(
  templates: InvoiceTemplate[],
  invoice: Invoice,
  channel: Channel,
  intent: "send" | "reminder" = "send",
): InvoiceTemplate | undefined {
  const ch = templateChannel(channel);
  const kind =
    intent === "reminder"
      ? invoice.status === "overdue"
        ? "overdue"
        : "reminder"
      : invoice.status === "overdue"
        ? "overdue"
        : invoice.kind === "deposit"
          ? "deposit"
          : "invoice";
  return (
    templates.find((t) => t.kind === kind && t.channel === ch) ??
    templates.find((t) => t.kind === "invoice" && t.channel === ch) ??
    templates[0]
  );
}

export function sendable(status: Invoice["status"]): boolean {
  return status !== "paid" && status !== "void";
}

export function invoiceTone(status: Invoice["status"]): "default" | "primary" | "success" | "warning" | "danger" {
  if (status === "paid") return "success";
  if (status === "overdue") return "danger";
  if (status === "draft" || status === "awaiting_approval" || status === "part_paid") return "warning";
  if (status === "sent" || status === "viewed") return "primary";
  return "default";
}
