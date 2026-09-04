import { gstOf, incGst } from "@/lib/format";
import type { BillingAddon, BillingCadence, Plan } from "./types";

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Basic",
    cadence: "monthly",
    priceMonthly: 179,
    seats: 3,
    voiceMinutes: 400,
    automations: 10,
    teamMembers: 3,
    blurb: "Reception, inbox and a calendar for a solo operator.",
    features: ["Receptionist", "Inbox", "Calendar", "Knowledge", "Website widget"],
  },
  {
    id: "growth",
    name: "Pro",
    cadence: "monthly",
    priceMonthly: 349,
    seats: 7,
    voiceMinutes: 1500,
    automations: 40,
    teamMembers: 8,
    blurb: "The full firm — quotes, reach, review and dispatch.",
    features: ["Everything in Basic", "Full firm of AI agents", "Pipeline & quotes", "Reach", "Review", "Automations"],
  },
  {
    id: "firm",
    name: "Agency",
    cadence: "monthly",
    priceMonthly: 799,
    seats: 20,
    voiceMinutes: 5000,
    automations: 200,
    teamMembers: 25,
    blurb: "API keys, white-label, dedicated onboarding, the full stack.",
    features: ["Everything in Pro", "Specialist packs", "Custom connectors", "API keys", "Priority voice", "SSO-ready workspace"],
  },
];

export const TRIAL_PLAN_ID = "growth";
export const TRIAL_DAYS = 7;

export type PlanCompare = {
  id: string;
  included: string[];
  excluded: string[];
};

export const PLAN_COMPARE: PlanCompare[] = [
  {
    id: "starter",
    included: [
      "24/7 AI receptionist",
      "Inbox — phone, SMS, WhatsApp, Instagram, web",
      "Calendar",
      "Train on your website",
      "Website widget",
      "400 voice minutes / mo",
      "3 team members",
    ],
    excluded: [
      "Full firm of AI agents (Dispatch, Scout, Quill, Ledger, Brief, Helix)",
      "Quotes, e-signature, invoices",
      "Reach & review requests",
      "Automations",
      "Priority voice",
    ],
  },
  {
    id: "growth",
    included: [
      "Everything in Basic",
      "Full firm of AI agents",
      "Quotes with e-signature",
      "Invoices",
      "Reach & review",
      "40 automations",
      "1,500 voice minutes / mo",
      "8 team members",
    ],
    excluded: ["Specialist packs", "Custom connectors", "API keys", "Priority voice", "SSO"],
  },
  {
    id: "firm",
    included: [
      "Everything in Pro",
      "5,000 voice minutes / mo",
      "25 team members",
      "200 automations",
      "Specialist packs",
      "Custom connectors",
      "API keys",
      "Priority voice",
      "SSO-ready workspace",
    ],
    excluded: [],
  },
];

export function compareFor(planId: string): PlanCompare {
  return PLAN_COMPARE.find((p) => p.id === planId) ?? PLAN_COMPARE[1]!;
}

export type CompareCell = boolean | string;

export const COMPARE_GROUPS: { name: string; rows: { label: string; starter: CompareCell; growth: CompareCell; firm: CompareCell }[] }[] = [
  {
    name: "Volume",
    rows: [
      { label: "Voice minutes / mo", starter: "400", growth: "1,500", firm: "5,000" },
      { label: "Team members", starter: "3", growth: "8", firm: "25" },
      { label: "Automations", starter: false, growth: "40", firm: "200" },
    ],
  },
  {
    name: "Front office",
    rows: [
      { label: "24/7 AI receptionist", starter: true, growth: true, firm: true },
      { label: "Transfers & barge-in", starter: true, growth: true, firm: true },
      { label: "Phone, SMS, WhatsApp, Instagram, web", starter: true, growth: true, firm: true },
      { label: "Website widget & forms", starter: true, growth: true, firm: true },
      { label: "Train on your website", starter: true, growth: true, firm: true },
    ],
  },
  {
    name: "The firm",
    rows: [
      { label: "AI receptionist", starter: true, growth: true, firm: true },
      { label: "AI firm — Dispatch, Scout, Quill, Ledger, Brief, Helix", starter: false, growth: true, firm: true },
      { label: "Specialist packs", starter: false, growth: false, firm: true },
      { label: "API keys", starter: false, growth: false, firm: true },
      { label: "Custom connectors", starter: false, growth: false, firm: true },
    ],
  },
  {
    name: "Back office",
    rows: [
      { label: "Calendar", starter: true, growth: true, firm: true },
      { label: "Quotes with e-signature", starter: false, growth: true, firm: true },
      { label: "Invoices", starter: false, growth: true, firm: true },
      { label: "Reach (follow-up)", starter: false, growth: true, firm: true },
      { label: "Review requests", starter: false, growth: true, firm: true },
    ],
  },
  {
    name: "Support",
    rows: [
      { label: "Priority voice", starter: false, growth: false, firm: true },
      { label: "SSO-ready workspace", starter: false, growth: false, firm: true },
    ],
  },
];

export function trialEndISO(from = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() + TRIAL_DAYS);
  return d.toISOString();
}

export function isTrialing(iso?: string | null): boolean {
  return Boolean(iso && new Date(iso).getTime() > Date.now());
}

export function trialDaysLeft(iso?: string | null): number {
  if (!iso) return 0;
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000));
}

export const PLAN_ORDER = PLANS.map((p) => p.id);


export function planById(id: string): Plan {
  return PLANS.find((p) => p.id === id) ?? PLANS[1]!;
}

export function periodExGst(plan: Plan, cadence: BillingCadence, addons: BillingAddon[]): number {
  const base = cadence === "annual" ? plan.priceMonthly * 10 : plan.priceMonthly;
  const extra = addons
    .filter((a) => a.on)
    .reduce((sum, a) => sum + (cadence === "annual" ? a.priceMonthly * 10 : a.priceMonthly), 0);
  return base + extra;
}

export function invoiceTotals(exGst: number) {
  return { exGst, gst: gstOf(exGst), total: incGst(exGst) };
}

export function upcomingTotals(plan: Plan, cadence: BillingCadence, addons: BillingAddon[]) {
  return invoiceTotals(periodExGst(plan, cadence, addons));
}

export function annualMonthly(plan: Plan) {
  return Math.round((plan.priceMonthly * 10) / 12);
}

export function planCaps(plan: Plan, addons: BillingAddon[]) {
  const on = (id: string) => addons.some((a) => a.id === id && a.on);
  return {
    seats: plan.seats + (on("seat") ? 1 : 0),
    voiceMinutes: plan.voiceMinutes + (on("voice-block") ? 500 : 0),
    automations: plan.automations,
    teamMembers: plan.teamMembers,
  };
}

export function cardBrandFromNumber(digits: string): "visa" | "mastercard" | "amex" {
  if (digits.startsWith("34") || digits.startsWith("37")) return "amex";
  if (digits.startsWith("5")) return "mastercard";
  return "visa";
}
