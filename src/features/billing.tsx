import { useEffect, useState } from "react";
import { Check, Download, CreditCard } from "lucide-react";
import { MeloMark } from "@/components/brand/melo-mark";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { dt, money, moneyExact } from "@/lib/format";
import {
  PLANS,
  PLAN_ORDER,
  PLAN_COMPARE,
  VOICE_OVERAGE_PER_MIN,
  annualMonthly,
  invoiceTotals,
  isTrialing,
  overageExGst,
  overageMinutes,
  planById,
  planCaps,
  trialDaysLeft,
  upcomingTotals,
} from "@/lib/melo/billing";
import { useMelo } from "@/lib/melo/store";
import { checkoutUrl } from "@/lib/melo/stripe-plans";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import type { BillingCadence, BillingCard, BillingInvoice, Plan } from "@/lib/melo/types";
import { cn } from "@/lib/utils";

function hasCard(card: BillingCard | null | undefined): card is BillingCard {
  return Boolean(card && ((card.last4 && card.last4 !== "0000") || card.brand === "stripe"));
}

export function BillingPane() {
  const billing = useMelo((s) => s.billing);
  const ws = useMelo((s) => s.workspace);
  const toggle = useMelo((s) => s.toggleAddon);
  const reactivate = useMelo((s) => s.reactivatePlan);
  const plan = planById(billing.planId);
  const caps = planCaps(plan, billing.addons, billing.trialEndsAt);
  const upcoming = upcomingTotals(plan, billing.cadence, billing.addons, billing.usage.voiceMinutes, billing.trialEndsAt);
  const overMin = overageMinutes(billing.usage.voiceMinutes, caps.voiceMinutes);
  const overCost = overageExGst(billing.usage.voiceMinutes, caps.voiceMinutes);
  const price =
    billing.cadence === "annual" ? annualMonthly(plan) : plan.priceMonthly;

  const [changeOpen, setChangeOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [invoice, setInvoice] = useState<BillingInvoice | null>(null);

  const addonLines = billing.addons.filter((a) => a.on);

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-10">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Billing</h1>
        <p className="mt-1 text-sm text-muted-foreground text-pretty">
          Melo subscription for {ws.name}. Change plan anytime — upgrades apply now.
        </p>
      </div>

      {isTrialing(billing.trialEndsAt) ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/25 bg-accent px-4 py-3">
          <div>
            <div className="text-sm font-medium">{trialDaysLeft(billing.trialEndsAt)} days left on the Pro trial</div>
            <p className="text-sm text-muted-foreground">Switch to Basic or Agency whenever you like. Trial includes 80 voice minutes, then {money(VOICE_OVERAGE_PER_MIN)} / min.</p>
          </div>
          <Button onClick={() => setChangeOpen(true)}>Change plan</Button>
        </div>
      ) : null}

      {billing.cancelAt ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warning/30 bg-warning-soft px-4 py-3">
          <div>
            <div className="text-sm font-medium text-foreground">Cancels {dt(billing.cancelAt, "d MMM yyyy")}</div>
            <p className="text-sm text-muted-foreground">The firm stays on {plan.name} until then. Reactivate to keep seats and voice minutes.</p>
          </div>
          <Button onClick={reactivate}>Reactivate</Button>
        </div>
      ) : null}

      <section className="rounded-2xl border border-border bg-canvas p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-medium text-muted-foreground">Current plan</h2>
              <Badge tone={billing.cancelAt ? "warning" : isTrialing(billing.trialEndsAt) ? "primary" : "success"}>
                {billing.cancelAt ? "Cancelling" : isTrialing(billing.trialEndsAt) ? "Trial" : "Active"}
              </Badge>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-semibold tracking-tight">{plan.name}</span>
              <span className="text-sm text-muted-foreground">{billing.cadence === "annual" ? "annual" : "monthly"}</span>
            </div>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-3xl font-semibold tracking-tight tabular">{money(price)}</span>
              <span className="text-sm text-muted-foreground">/ month</span>
            </div>
            {billing.cadence === "annual" ? (
              <p className="mt-1 text-xs text-muted-foreground">Billed {money(plan.priceMonthly * 10)} yearly · two months free</p>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">ex GST · GST added on each invoice</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setChangeOpen(true)}>Change plan</Button>
            {billing.cancelAt ? null : (
              <Button variant="outline" onClick={() => setCancelOpen(true)}>
                Cancel
              </Button>
            )}
          </div>
        </div>
        <ul className="mt-5 grid gap-2 sm:grid-cols-2">
          {plan.features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
              <Check className="mt-0.5 size-4 shrink-0 text-success" />
              {f}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-border bg-canvas">
        <div className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-sm font-semibold">Upcoming invoice</h2>
            <p className="text-xs text-muted-foreground">
              Due {dt(billing.renewal, "d MMM yyyy")}
              {hasCard(billing.card)
                ? ` · auto-charged to ${billing.card.brand} ${billing.card.last4}`
                : " · add a card to auto-charge"}
            </p>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold tabular">{moneyExact(upcoming.total)}</div>
            <div className="text-xs text-muted-foreground">inc GST</div>
          </div>
        </div>
        <div className="divide-y divide-border px-5 sm:px-6">
          <Line label={`${plan.name} · ${billing.cadence}`} value={billing.cadence === "annual" ? plan.priceMonthly * 10 : plan.priceMonthly} />
          {addonLines.map((a) => (
            <Line
              key={a.id}
              label={a.name}
              value={billing.cadence === "annual" ? a.priceMonthly * 10 : a.priceMonthly}
            />
          ))}
          {overMin > 0 ? (
            <Line label={`Voice overage · ${overMin} min × ${money(VOICE_OVERAGE_PER_MIN)}`} value={overCost} />
          ) : null}
          <Line label="GST 10%" value={upcoming.gst} muted />
        </div>
      </section>

      <section>
        <div className="mb-3">
          <h2 className="text-sm font-semibold">Usage</h2>
          <p className="text-xs text-muted-foreground">
            Resets {dt(billing.usage.reset, "d MMM yyyy")}. After the cap, extra minutes are {money(VOICE_OVERAGE_PER_MIN)} each — the receptionist keeps answering.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Meter label="Agent seats" used={billing.usage.seats} max={caps.seats} unit="seats" />
          <Meter
            label="Voice minutes"
            used={billing.usage.voiceMinutes}
            max={caps.voiceMinutes}
            unit="min"
            overage={overMin > 0 ? `${overMin} min over · ${money(overCost)} this period` : `Then ${money(VOICE_OVERAGE_PER_MIN)} / min`}
          />
          <Meter label="Automations" used={billing.usage.automations} max={caps.automations} unit="live" />
          <Meter label="Team members" used={billing.usage.teamMembers} max={caps.teamMembers} unit="people" />
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-canvas">
        <div className="border-b border-border px-5 py-4 sm:px-6">
          <h2 className="text-sm font-semibold">Add-ons</h2>
          <p className="text-xs text-muted-foreground">Added to the next invoice. Turn off any time before renewal.</p>
        </div>
        <ul className="divide-y divide-border">
          {billing.addons.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6">
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-sm font-medium">{a.name}</span>
                  <span className="text-sm tabular text-muted-foreground">{money(a.priceMonthly)}/mo</span>
                </div>
                <p className="text-xs text-muted-foreground">{a.note}</p>
              </div>
              <Switch checked={a.on} onCheckedChange={() => toggle(a.id)} aria-label={a.name} />
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-3 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-canvas p-5">
          <h2 className="text-sm font-semibold">Payment method</h2>
          {hasCard(billing.card) ? (
            <div className="mt-4 flex items-center gap-3">
              <CardFace brand={billing.card.brand} />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">
                  {billing.card.brand === "stripe" ? "Card on file with Stripe" : `${billing.card.brand} ···· ${billing.card.last4}`}
                </div>
                <div className="text-xs text-muted-foreground">
                  {billing.card.brand === "stripe"
                    ? "Managed in Stripe. Change plan anytime."
                    : `Expires ${String(billing.card.expMonth).padStart(2, "0")}/${String(billing.card.expYear).slice(-2)}${billing.card.name ? ` · ${billing.card.name}` : ""}`}
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => setPayOpen(true)}>
                Update
              </Button>
            </div>
          ) : (
            <div className="mt-4 flex items-center gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-dashed border-border bg-muted text-muted-foreground">
                <CreditCard className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">No card on file</div>
                <p className="text-xs text-muted-foreground">Add a card before renewal so the office stays on.</p>
              </div>
              <Button size="sm" onClick={() => setPayOpen(true)}>
                Add card
              </Button>
            </div>
          )}
        </section>
        <section className="rounded-2xl border border-border bg-canvas p-5">
          <h2 className="text-sm font-semibold">Billing details</h2>
          <dl className="mt-4 space-y-1.5 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Email</dt>
              <dd className="truncate">{billing.contact}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Business</dt>
              <dd>{ws.name}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">ABN</dt>
              <dd className="tabular">{ws.abn}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Tax</dt>
              <dd>GST registered</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-muted-foreground">{ws.address}</p>
        </section>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold">Invoices</h2>
        <div className="overflow-hidden rounded-2xl border border-border bg-canvas">
          <div className="hidden grid-cols-[1fr_auto_auto_auto] gap-4 border-b border-border px-5 py-2 text-xs font-medium text-muted-foreground sm:grid">
            <span>Date</span>
            <span>Number</span>
            <span className="text-right">Amount</span>
            <span className="w-24" />
          </div>
          {billing.invoices.map((inv) => {
            const tot = invoiceTotals(inv.exGst);
            return (
              <div
                key={inv.id}
                className="grid grid-cols-2 items-center gap-x-3 gap-y-1 border-b border-border px-5 py-3 last:border-b-0 sm:grid-cols-[1fr_auto_auto_auto] sm:gap-4"
              >
                <div>
                  <div className="text-sm">{dt(inv.at, "d MMM yyyy")}</div>
                  <div className="text-xs text-muted-foreground sm:hidden">{inv.number}</div>
                </div>
                <div className="hidden text-sm tabular text-muted-foreground sm:block">{inv.number}</div>
                <div className="text-right">
                  <div className="text-sm tabular">{moneyExact(tot.total)}</div>
                  <Badge tone="success" className="mt-0.5 sm:hidden">
                    Paid
                  </Badge>
                </div>
                <div className="col-span-2 flex items-center justify-end gap-2 sm:col-span-1">
                  <Badge tone="success" className="hidden sm:inline-flex">
                    Paid
                  </Badge>
                  <Button size="xs" variant="ghost" onClick={() => setInvoice(inv)}>
                    <Download />
                    PDF
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <ChangePlanDialog open={changeOpen} onOpenChange={setChangeOpen} />
      <CancelDialog open={cancelOpen} onOpenChange={setCancelOpen} />
      <PayDialog open={payOpen} onOpenChange={setPayOpen} />
      <InvoiceDialog invoice={invoice} onClose={() => setInvoice(null)} />
    </div>
  );
}

function Line({ label, value, muted }: { label: string; value: number; muted?: boolean }) {
  return (
    <div className={cn("flex items-center justify-between py-3 text-sm", muted && "text-muted-foreground")}>
      <span>{label}</span>
      <span className="tabular">{moneyExact(value)}</span>
    </div>
  );
}

function Meter({
  label,
  used,
  max,
  unit,
  overage,
}: {
  label: string;
  used: number;
  max: number;
  unit: string;
  overage?: string;
}) {
  const pct = Math.min(100, Math.round((used / Math.max(max, 1)) * 100));
  const hot = pct >= 80;
  const remaining = Math.max(0, max - used);
  const over = used > max;
  return (
    <div className="rounded-xl border border-border bg-canvas p-4">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm tabular text-muted-foreground">
          {used.toLocaleString("en-AU")} / {max.toLocaleString("en-AU")}
        </span>
      </div>
      <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-[width] duration-200 ease-out", over ? "bg-warning" : hot ? "bg-warning" : "bg-primary")}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className={cn("mt-2 text-xs", over || hot ? "text-warning" : "text-muted-foreground")}>
        {over
          ? overage ?? `${(used - max).toLocaleString("en-AU")} ${unit} over`
          : hot
            ? `${remaining} ${unit} left`
            : `${remaining.toLocaleString("en-AU")} ${unit} remaining`}
        {!over && overage && remaining > 0 ? ` · ${overage}` : null}
      </p>
    </div>
  );
}

function CardFace({ brand }: { brand: string }) {
  return (
    <div className="flex h-10 w-14 shrink-0 items-end rounded-md bg-ink px-1.5 py-1">
      <span className="text-xs font-semibold tracking-wider text-primary-foreground">
        {brand === "mastercard" ? "MC" : brand === "amex" ? "AMEX" : brand === "stripe" ? "STRIPE" : "VISA"}
      </span>
    </div>
  );
}

function ChangePlanDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const billing = useMelo((s) => s.billing);
  const setPlan = useMelo((s) => s.setPlan);
  const { user } = useCurrentUserState();
  const [cadence, setCadence] = useState<BillingCadence>(billing.cadence);

  useEffect(() => {
    if (open) setCadence(billing.cadence);
  }, [open, billing.cadence]);

  const currentIdx = PLAN_ORDER.indexOf(billing.planId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(920px,calc(100%-24px))] max-w-none">
        <DialogTitle>Change plan</DialogTitle>
        <DialogDescription>Change whenever you like. Upgrades apply now. Downgrades take effect on the next invoice.</DialogDescription>
        <div className="mt-4 flex justify-center">
          <Tabs value={cadence} onValueChange={(v) => setCadence(v as BillingCadence)}>
            <TabsList>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="annual">Annual · 2 months free</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {PLANS.map((p) => (
            <PlanCard
              key={p.id}
              plan={p}
              cadence={cadence}
              current={p.id === billing.planId && cadence === billing.cadence}
              samePlan={p.id === billing.planId}
              direction={PLAN_ORDER.indexOf(p.id) - currentIdx}
              onChoose={() => {
                setPlan(p.id, cadence);
                onOpenChange(false);
                window.location.href = checkoutUrl(p.id, { email: user?.primaryEmail, userId: user?.id });
              }}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PlanCard({
  plan,
  cadence,
  current,
  samePlan,
  direction,
  onChoose,
}: {
  plan: Plan;
  cadence: BillingCadence;
  current: boolean;
  samePlan: boolean;
  direction: number;
  onChoose: () => void;
}) {
  const display = cadence === "annual" ? annualMonthly(plan) : plan.priceMonthly;
  let cta = "Switch";
  if (current) cta = "Current plan";
  else if (samePlan && cadence !== "monthly") cta = "Switch to annual";
  else if (samePlan) cta = "Switch to monthly";
  else if (direction > 0) cta = "Upgrade";
  else cta = "Downgrade";

  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border p-4",
        current ? "border-primary bg-accent" : "border-border bg-canvas",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-semibold">{plan.name}</div>
        {plan.id === "growth" ? <Badge tone="primary">Recommended</Badge> : null}
      </div>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-2xl font-semibold tabular">{money(display)}</span>
        <span className="text-xs text-muted-foreground">/ mo</span>
      </div>
      {cadence === "annual" ? (
        <p className="mt-0.5 text-xs text-muted-foreground">{money(plan.priceMonthly * 10)} billed yearly</p>
      ) : (
        <p className="mt-0.5 text-xs text-muted-foreground">ex GST</p>
      )}
      <p className="mt-2 text-xs text-muted-foreground text-pretty">{plan.blurb}</p>
      <ul className="mt-3 space-y-1.5 text-sm">
        {(PLAN_COMPARE.find((c) => c.id === plan.id)?.included ?? []).slice(0, 4).map((f) => (
          <li key={f} className="flex items-start gap-2 text-muted-foreground">
            <Check className="mt-0.5 size-3.5 shrink-0 text-success" />
            {f}
          </li>
        ))}
      </ul>
      <Button className="mt-4 w-full" variant={current ? "outline" : direction > 0 ? "default" : "outline"} disabled={current} onClick={onChoose}>
        {cta}
      </Button>
    </div>
  );
}

function CancelDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const cancel = useMelo((s) => s.cancelPlan);
  const billing = useMelo((s) => s.billing);
  const plan = planById(billing.planId);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Cancel {plan.name}?</DialogTitle>
        <DialogDescription>
          You’ll keep {plan.name} until {dt(billing.renewal, "d MMM yyyy")}. After that the workspace stays readable — calls, quotes and the widget pause until you reactivate.
        </DialogDescription>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Keep {plan.name}
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              cancel();
              onOpenChange(false);
            }}
          >
            Cancel subscription
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PayDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const card = useMelo((s) => s.billing.card);
  const billing = useMelo((s) => s.billing);
  const { user } = useCurrentUserState();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{hasCard(card) ? "Update payment method" : "Add payment method"}</DialogTitle>
        <DialogDescription>Stripe takes the card. Melo never sees the number.</DialogDescription>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              window.location.href = checkoutUrl(billing.planId, { email: user?.primaryEmail, userId: user?.id });
            }}
          >
            <CreditCard />
            Continue to Stripe
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InvoiceDialog({ invoice, onClose }: { invoice: BillingInvoice | null; onClose: () => void }) {
  const ws = useMelo((s) => s.workspace);
  const billing = useMelo((s) => s.billing);
  const plan = planById(billing.planId);
  const tot = invoice ? invoiceTotals(invoice.exGst) : null;

  const print = () => {
    if (!invoice || !tot) return;
    const html = `<!doctype html><html><head><title>${invoice.number}</title>
      <style>body{font-family:Inter,system-ui,sans-serif;color:#111;padding:48px;max-width:720px;margin:auto}
      h1{font-size:20px;margin:0} table{width:100%;border-collapse:collapse;margin-top:24px}
      td,th{text-align:left;padding:8px 0;border-bottom:1px solid #e5e7eb;font-size:14px}
      .muted{color:#6b7280;font-size:13px} .right{text-align:right} .total{font-weight:600;font-size:16px}</style></head>
      <body>
      <p class="muted">Tax invoice</p>
      <h1>Melo Pty Ltd</h1>
      <p class="muted">ABN 49 638 201 774 · Australia</p>
      <p style="margin-top:24px"><strong>Bill to</strong><br/>${ws.name}<br/>ABN ${ws.abn}<br/>${ws.address}<br/>${billing.contact}</p>
      <p class="muted">${invoice.number} · ${dt(invoice.at, "d MMM yyyy")} · Paid</p>
      <table>
        <tr><th>Description</th><th class="right">Amount</th></tr>
        <tr><td>${plan.name} plan</td><td class="right">${moneyExact(invoice.exGst)}</td></tr>
        <tr><td>GST 10%</td><td class="right">${moneyExact(tot.gst)}</td></tr>
        <tr><td class="total">Total AUD</td><td class="right total">${moneyExact(tot.total)}</td></tr>
      </table>
      </body></html>`;
    const w = window.open("", "_blank", "noopener,noreferrer,width=720,height=900");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  };

  return (
    <Dialog open={!!invoice} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        {invoice && tot ? (
          <>
            <div className="flex items-start justify-between pr-6">
              <div className="flex items-center gap-2">
                <MeloMark className="size-8" />
                <div>
                  <DialogTitle>Tax invoice {invoice.number}</DialogTitle>
                  <DialogDescription>Paid {dt(invoice.at, "d MMM yyyy")}</DialogDescription>
                </div>
              </div>
            </div>
            <div className="mt-4 rounded-xl border border-border p-4 text-sm">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="text-xs font-medium text-muted-foreground">From</div>
                  <div className="mt-1 font-medium">Melo Pty Ltd</div>
                  <div className="text-muted-foreground">ABN 49 638 201 774</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground">Bill to</div>
                  <div className="mt-1 font-medium">{ws.name}</div>
                  <div className="text-muted-foreground">ABN {ws.abn}</div>
                </div>
              </div>
              <div className="mt-4 space-y-2 border-t border-border pt-3">
                <div className="flex justify-between">
                  <span>{plan.name} plan</span>
                  <span className="tabular">{moneyExact(invoice.exGst)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>GST 10%</span>
                  <span className="tabular">{moneyExact(tot.gst)}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-2 font-semibold">
                  <span>Total AUD</span>
                  <span className="tabular">{moneyExact(tot.total)}</span>
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={print}>
                <Download />
                Print / save PDF
              </Button>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
