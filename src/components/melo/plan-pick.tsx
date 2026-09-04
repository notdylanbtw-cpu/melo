import { Check, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PLAN_COMPARE, PLANS, TRIAL_DAYS, TRIAL_PLAN_ID } from "@/lib/melo/billing";
import { money } from "@/lib/format";
import { cn } from "@/lib/utils";

export const PLAN_STORAGE_KEY = "melo-chosen-plan";

export function readChosenPlan(): string {
  if (typeof window === "undefined") return TRIAL_PLAN_ID;
  return window.localStorage.getItem(PLAN_STORAGE_KEY) || TRIAL_PLAN_ID;
}

export function saveChosenPlan(id: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PLAN_STORAGE_KEY, id);
}

export function PlanPick({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {PLANS.map((plan) => {
        const cmp = PLAN_COMPARE.find((p) => p.id === plan.id)!;
        const selected = value === plan.id;
        const trial = plan.id === TRIAL_PLAN_ID;
        return (
          <button
            key={plan.id}
            type="button"
            onClick={() => onChange(plan.id)}
            className={cn(
              "flex flex-col rounded-2xl border p-4 text-left transition-colors",
              selected ? "border-primary bg-accent ring-1 ring-primary" : "border-border bg-canvas hover:bg-muted/40",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-sm font-semibold">{plan.name}</div>
                <p className="mt-0.5 text-xs text-muted-foreground">{plan.blurb}</p>
              </div>
              {trial ? <Badge tone="primary">Best</Badge> : null}
            </div>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-2xl font-semibold tabular">{money(plan.priceMonthly)}</span>
              <span className="text-xs text-muted-foreground">/ mo</span>
            </div>
            {trial ? (
              <p className="mt-1 text-xs font-medium text-primary">{TRIAL_DAYS}-day free trial</p>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">ex GST · billed monthly</p>
            )}
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Included</p>
            <ul className="mt-1.5 space-y-1">
              {cmp.included.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-success" />
                  {f}
                </li>
              ))}
            </ul>
            {cmp.excluded.length ? (
              <>
                <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Not included</p>
                <ul className="mt-1.5 space-y-1">
                  {cmp.excluded.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Minus className="mt-0.5 size-3.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="mt-3 text-xs text-muted-foreground">Nothing held back.</p>
            )}
            <span
              className={cn(
                "mt-4 inline-flex h-9 items-center justify-center rounded-md text-sm font-medium",
                selected ? "bg-primary text-primary-foreground" : "border border-border",
              )}
            >
              {selected ? (trial ? `Start ${TRIAL_DAYS}-day trial` : `Selected`) : trial ? `Try ${plan.name} free` : `Choose ${plan.name}`}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function PlanChoice({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Which plan?</p>
      <p className="text-xs text-muted-foreground">Change it anytime in Billing.</p>
      <div className="space-y-2">
        {PLANS.map((plan) => {
          const selected = value === plan.id;
          const trial = plan.id === TRIAL_PLAN_ID;
          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => onChange(plan.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left",
                selected ? "border-primary bg-accent ring-1 ring-primary" : "border-border hover:bg-muted/40",
              )}
            >
              <span className={cn("grid size-4 shrink-0 place-items-center rounded-full border", selected ? "border-primary" : "border-border")}>
                {selected ? <span className="size-2 rounded-full bg-primary" /> : null}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{plan.name}</span>
                  {trial ? <Badge tone="primary">{TRIAL_DAYS}-day trial</Badge> : null}
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{plan.blurb}</span>
              </span>
              <span className="shrink-0 text-sm font-semibold tabular">{money(plan.priceMonthly)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function planCta(planId: string) {
  return planId === TRIAL_PLAN_ID ? `Start ${TRIAL_DAYS}-day trial` : "Continue";
}
