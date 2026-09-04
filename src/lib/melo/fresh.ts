import { createSeed } from "./seed";
import { parseWebsite, study } from "./train";
import { TRIAL_PLAN_ID, trialEndISO } from "./billing";
import type { Industry, MeloData } from "./types";

export type OnboardingInput = {
  ownerName: string;
  businessName: string;
  industry: Industry;
  about: string;
  website?: string;
  services: string[];
  suburbs: string[];
  hours: string;
  afterHours: string;
  tools: string[];
  email: string;
  planId?: string;
};

export function createFreshOffice(o: OnboardingInput): MeloData {
  const seed = createSeed();
  const now = new Date().toISOString();
  const first = o.ownerName.split(" ")[0] || o.ownerName || "there";
  const services = o.services.filter(Boolean);
  const suburbs = o.suburbs.filter(Boolean);
  const tools = o.tools.filter(Boolean);
  const website = (o.website ?? "").trim();
  const site = parseWebsite(website);
  const studied = study(
    {
      website,
      description: [o.about, services.join(", "), suburbs.join(", ")].filter(Boolean).join(". "),
      tools: tools.join(", "),
    },
    seed.integrations,
  );

  const serviceRows =
    studied.services.length > 0
      ? studied.services
      : services.map((name, i) => ({
          id: `svc-${i + 1}`,
          name,
          summary: name,
          priceFrom: 180,
          afterHoursFrom: 280,
          durationMins: 60,
          active: true,
        }));

  const areas = [...suburbs];
  for (const a of studied.areas) {
    if (!areas.some((x) => x.toLowerCase() === a.toLowerCase())) areas.push(a);
  }

  const faqs = o.about
    ? [{ id: "faq-about", q: `What does ${o.businessName} do?`, a: o.about, sourceId: "onboard" }]
    : [];
  for (const f of studied.faqs) {
    if (!faqs.some((x) => x.q.toLowerCase() === f.q.toLowerCase())) {
      faqs.push({ id: `faq-${faqs.length + 1}`, q: f.q, a: f.a, sourceId: f.sourceId });
    }
  }

  return {
    ...seed,
    workspace: {
      name: o.businessName,
      industry: o.industry,
      ownerName: o.ownerName,
      ownerEmail: o.email,
      number: "",
      timezone: "Australia/Sydney",
      abn: "",
      address: suburbs[0] ? `${suburbs[0]} NSW` : "",
      brandName: site.brand || o.businessName,
      brandPrimary: "#2B7FFF",
      widgetGreeting: studied.widgetGreeting || `Hi — ${o.businessName} here. How can I help?`,
    },
    staff: [
      {
        id: "you",
        name: o.ownerName,
        role: "Owner",
        email: o.email,
        phone: "",
        color: "primary",
        skills: services.slice(0, 4),
      },
    ],
    customers: [],
    conversations: [],
    jobs: [],
    holds: [],
    reviewItems: [],
    content: [],
    activity: [
      {
        id: "ac0",
        at: now,
        actor: "Helix",
        agentId: "helix",
        text: site.host
          ? `Studied ${site.host} and the signup quiz. Knowledge is live for Receptionist, Ask Melo and the widget.`
          : `Studied ${o.businessName}. Knowledge is live for Receptionist, Ask Melo and the widget.`,
      },
    ],
    chat: [
      {
        id: "ch0",
        at: now,
        role: "melo",
        text: site.host
          ? `Welcome ${first}. I read ${site.host} and trained Melo on ${o.businessName}. Ask me to quote, book, or draft a reply.`
          : `Welcome ${first}. I trained Melo on ${o.businessName}${services.length ? ` — ${services.slice(0, 3).join(", ")}` : ""}. Ask me to quote, book, or draft a reply.`,
        agentId: "helix",
      },
    ],
    notifications: [],
    liveCall: null,
    recentCalls: [],
    agents: seed.agents.map((a) => ({ ...a, status: "idle" as const, currentTask: null, taskCount: 0 })),
    knowledge: {
      sources: [
        ...(site.host
          ? [{ id: "website", name: site.host, kind: "website" as const, status: "synced" as const, updatedAt: now, coverage: 94 }]
          : []),
        {
          id: "onboard",
          name: "Signup quiz",
          kind: "manual",
          status: "synced",
          updatedAt: now,
          coverage: 72,
        },
      ],
      services: serviceRows,
      areas,
      faqs,
      hours: studied.hours || o.hours || "Mon–Fri 7:30 am – 4:30 pm",
      afterHours: studied.afterHours || o.afterHours || "Emergencies only. Extra call-out applies.",
      bookingRules: studied.bookingRules || "Confirm a window before locking the calendar. Never leave a customer without a next step.",
      greeting: studied.greeting || `${o.businessName}, receptionist speaking.`,
    },
    integrations: seed.integrations.map((i) => {
      const hit =
        studied.toolIds.includes(i.id) ||
        tools.some((t) => i.name.toLowerCase().includes(t.toLowerCase()) || t.toLowerCase().includes(i.name.toLowerCase()));
      return {
        ...i,
        status: "available" as const,
        detail: hit ? "Listed at signup — connect to go live" : i.detail.replace(/Northside Plumbing/g, o.businessName),
      };
    }),
    automations: seed.automations.map((a) => ({ ...a, on: false })),
    sequences: seed.sequences.map((s) => ({ ...s, enrolled: 0, active: true })),
    voice: {
      ...seed.voice,
      greeting: `${o.businessName}, this is the receptionist speaking. How can I help?`,
    },
    billing: {
      ...seed.billing,
      planId: o.planId || TRIAL_PLAN_ID,
      contact: o.email,
      card: null,
      trialEndsAt: (o.planId || TRIAL_PLAN_ID) === TRIAL_PLAN_ID ? trialEndISO() : null,
      invoices: [],
      usage: { seats: 1, voiceMinutes: 0, automations: 0, teamMembers: 1, reset: seed.billing.usage.reset },
    },
    training: {
      website,
      description: o.about,
      tools: tools.join(", "),
      lastRunAt: now,
      runs: [
        {
          id: "tr-onboard",
          at: now,
          website,
          services: serviceRows.map((s) => s.name),
          areas,
          toolsMatched: tools,
          faqsAdded: faqs.length,
        },
      ],
    },
  };
}
