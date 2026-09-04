import type { AdminData, ContentEvent, DailyPoint, Tenant, Ticket } from "./types";

const T: Tenant[] = [
  { id: "northside", name: "Northside Plumbing", industry: "Plumbing", owner: "Alex Chen", email: "alex@northsideplumbing.com.au", plan: "growth", mrr: 449, status: "active", startedAt: "2026-03-12", seats: 7, suburb: "Annandale", lastActiveAt: "2026-09-04T08:04:00+10:00" },
  { id: "bondi-e", name: "Bondi Electrical", industry: "Electrical", owner: "Priya Shah", email: "priya@bondielectrical.com.au", plan: "firm", mrr: 999, status: "active", startedAt: "2025-11-02", seats: 14, suburb: "Bondi", lastActiveAt: "2026-09-04T07:40:00+10:00" },
  { id: "inner-hvac", name: "Inner West HVAC", industry: "HVAC", owner: "Marc Nguyen", email: "marc@innerwesthvac.com.au", plan: "growth", mrr: 449, status: "active", startedAt: "2026-01-18", seats: 6, suburb: "Marrickville", lastActiveAt: "2026-09-03T18:12:00+10:00" },
  { id: "glebe-gas", name: "Glebe Gas & Hot Water", industry: "Gasfitting", owner: "Helen Cho", email: "helen@glebegas.com.au", plan: "starter", mrr: 249, status: "active", startedAt: "2026-06-04", seats: 3, suburb: "Glebe", lastActiveAt: "2026-09-04T09:10:00+10:00" },
  { id: "parra-plumb", name: "Parramatta Pipe Co", industry: "Plumbing", owner: "Tom Brennan", email: "tom@parrapipe.com.au", plan: "growth", mrr: 449, status: "trial", startedAt: "2026-08-28", seats: 5, suburb: "Parramatta", lastActiveAt: "2026-09-04T06:55:00+10:00" },
  { id: "coogee-roof", name: "Coogee Roofing", industry: "Roofing", owner: "Samira Ali", email: "samira@coogeeroofing.com.au", plan: "starter", mrr: 249, status: "active", startedAt: "2026-04-21", seats: 3, suburb: "Coogee", lastActiveAt: "2026-09-02T16:40:00+10:00" },
  { id: "newtown-lock", name: "Newtown Locksmiths", industry: "Locksmith", owner: "James Wilson", email: "james@newtownlocks.com.au", plan: "starter", mrr: 249, status: "active", startedAt: "2026-05-11", seats: 2, suburb: "Newtown", lastActiveAt: "2026-09-03T22:01:00+10:00" },
  { id: "balmain-build", name: "Balmain Build", industry: "Building", owner: "Mia Thompson", email: "mia@balmainbuild.com.au", plan: "firm", mrr: 999, status: "active", startedAt: "2025-09-30", seats: 18, suburb: "Balmain", lastActiveAt: "2026-09-04T08:50:00+10:00" },
  { id: "ashfield-clean", name: "Ashfield Cleaning Co", industry: "Cleaning", owner: "Ravi Patel", email: "ravi@ashfieldclean.com.au", plan: "starter", mrr: 249, status: "past_due", startedAt: "2026-02-14", seats: 3, suburb: "Ashfield", lastActiveAt: "2026-08-29T11:20:00+10:00" },
  { id: "randwick-land", name: "Randwick Landscapes", industry: "Landscaping", owner: "Dez Okonkwo", email: "dez@randwickland.com.au", plan: "growth", mrr: 449, status: "active", startedAt: "2026-07-09", seats: 8, suburb: "Randwick", lastActiveAt: "2026-09-04T07:05:00+10:00" },
  { id: "mosman-paint", name: "Mosman Painting", industry: "Painting", owner: "Isla Grant", email: "isla@mosmanpainting.com.au", plan: "starter", mrr: 249, status: "cancelled", startedAt: "2026-01-07", seats: 2, suburb: "Mosman", lastActiveAt: "2026-08-12T09:00:00+10:00" },
  { id: "leich-elec", name: "Leichhardt Electric", industry: "Electrical", owner: "Chris Daly", email: "chris@leichelectric.com.au", plan: "growth", mrr: 449, status: "active", startedAt: "2026-03-01", seats: 6, suburb: "Leichhardt", lastActiveAt: "2026-09-03T14:33:00+10:00" },
  { id: "surry-pest", name: "Surry Hills Pest", industry: "Pest control", owner: "Nina Rossi", email: "nina@surrypest.com.au", plan: "starter", mrr: 249, status: "active", startedAt: "2026-08-19", seats: 3, suburb: "Surry Hills", lastActiveAt: "2026-09-04T10:12:00+10:00" },
  { id: "drummoyne-kit", name: "Drummoyne Kitchens", industry: "Joinery", owner: "Owen Blake", email: "owen@drummoynekitchens.com.au", plan: "firm", mrr: 999, status: "active", startedAt: "2025-12-08", seats: 11, suburb: "Drummoyne", lastActiveAt: "2026-09-04T09:40:00+10:00" },
];

const tenants: Tenant[] = T;

const series: DailyPoint[] = [
  { date: "2026-08-22", newSubs: 1, churned: 0, mrr: 4724, content: 18, tickets: 2, voiceMinutes: 410 },
  { date: "2026-08-23", newSubs: 0, churned: 0, mrr: 4724, content: 21, tickets: 1, voiceMinutes: 388 },
  { date: "2026-08-24", newSubs: 2, churned: 0, mrr: 5082, content: 27, tickets: 3, voiceMinutes: 452 },
  { date: "2026-08-25", newSubs: 0, churned: 1, mrr: 4903, content: 19, tickets: 2, voiceMinutes: 401 },
  { date: "2026-08-26", newSubs: 1, churned: 0, mrr: 5082, content: 24, tickets: 1, voiceMinutes: 467 },
  { date: "2026-08-27", newSubs: 0, churned: 0, mrr: 5082, content: 31, tickets: 4, voiceMinutes: 512 },
  { date: "2026-08-28", newSubs: 1, churned: 0, mrr: 5431, content: 22, tickets: 2, voiceMinutes: 439 },
  { date: "2026-08-29", newSubs: 0, churned: 0, mrr: 5431, content: 16, tickets: 1, voiceMinutes: 298 },
  { date: "2026-08-30", newSubs: 0, churned: 0, mrr: 5431, content: 14, tickets: 0, voiceMinutes: 241 },
  { date: "2026-08-31", newSubs: 1, churned: 0, mrr: 5610, content: 29, tickets: 3, voiceMinutes: 488 },
  { date: "2026-09-01", newSubs: 2, churned: 0, mrr: 5968, content: 33, tickets: 2, voiceMinutes: 521 },
  { date: "2026-09-02", newSubs: 0, churned: 0, mrr: 5968, content: 26, tickets: 1, voiceMinutes: 474 },
  { date: "2026-09-03", newSubs: 1, churned: 0, mrr: 6147, content: 38, tickets: 4, voiceMinutes: 556 },
  { date: "2026-09-04", newSubs: 1, churned: 0, mrr: 6326, content: 17, tickets: 2, voiceMinutes: 312 },
];

const content: ContentEvent[] = [
  { id: "c1", tenantId: "northside", kind: "gbp", title: "Blocked drains Newtown", at: "2026-09-03T07:02:00+10:00", agent: "Quill" },
  { id: "c2", tenantId: "northside", kind: "quote", title: "Q-2041 Mia Thompson laundry leak", at: "2026-09-02T21:18:00+10:00", agent: "Ledger" },
  { id: "c3", tenantId: "bondi-e", kind: "blog", title: "Switchboard upgrades in Bondi this spring", at: "2026-09-04T07:11:00+10:00", agent: "Quill" },
  { id: "c4", tenantId: "inner-hvac", kind: "service_page", title: "Ducted reverse-cycle Marrickville", at: "2026-09-03T16:40:00+10:00", agent: "Quill" },
  { id: "c5", tenantId: "glebe-gas", kind: "sms", title: "Missed-call recovery · 3 enrolled", at: "2026-09-04T08:22:00+10:00", agent: "Scout" },
  { id: "c6", tenantId: "parra-plumb", kind: "widget", title: "After-hours overflow answer", at: "2026-09-04T06:58:00+10:00", agent: "Receptionist" },
  { id: "c7", tenantId: "balmain-build", kind: "quote", title: "Q-8812 kitchen reno deposit", at: "2026-09-03T11:05:00+10:00", agent: "Ledger" },
  { id: "c8", tenantId: "randwick-land", kind: "gbp", title: "Spring turf installs Randwick", at: "2026-09-04T07:08:00+10:00", agent: "Quill" },
  { id: "c9", tenantId: "leich-elec", kind: "blog", title: "Safety switch tests this month", at: "2026-09-02T15:20:00+10:00", agent: "Quill" },
  { id: "c10", tenantId: "surry-pest", kind: "sms", title: "Termite inspection follow-up", at: "2026-09-04T10:14:00+10:00", agent: "Scout" },
  { id: "c11", tenantId: "bondi-e", kind: "widget", title: "Emergency call booking", at: "2026-09-03T23:41:00+10:00", agent: "Receptionist" },
  { id: "c12", tenantId: "northside", kind: "blog", title: "Emergency plumber Marrickville", at: "2026-09-02T09:00:00+10:00", agent: "Quill" },
  { id: "c13", tenantId: "drummoyne-kit", kind: "service_page", title: "Stone benchtops Drummoyne", at: "2026-09-04T09:42:00+10:00", agent: "Quill" },
  { id: "c14", tenantId: "coogee-roof", kind: "gbp", title: "Storm damage windows Coogee", at: "2026-09-01T13:10:00+10:00", agent: "Quill" },
  { id: "c15", tenantId: "newtown-lock", kind: "sms", title: "Lockout after-hours quote", at: "2026-09-03T22:04:00+10:00", agent: "Scout" },
  { id: "c16", tenantId: "balmain-build", kind: "gbp", title: "Before/after terrace restoration", at: "2026-09-04T08:51:00+10:00", agent: "Quill" },
];

const tickets: Ticket[] = [
  {
    id: "t1",
    number: "SUP-1842",
    tenantId: "northside",
    from: "Alex Chen",
    email: "alex@northsideplumbing.com.au",
    subject: "Gmail needs reconnect — inbound not landing",
    status: "open",
    priority: "high",
    createdAt: "2026-09-04T08:16:00+10:00",
    updatedAt: "2026-09-04T08:16:00+10:00",
    messages: [
      { id: "m1", at: "2026-09-04T08:16:00+10:00", from: "customer", author: "Alex Chen", text: "Inbox stopped pulling Gmail last night. WhatsApp is fine. Can you check the connector? We’re missing Helen Cho’s filter thread." },
    ],
  },
  {
    id: "t2",
    number: "SUP-1839",
    tenantId: "bondi-e",
    from: "Priya Shah",
    email: "priya@bondielectrical.com.au",
    subject: "Voice minutes cap this week",
    status: "waiting",
    priority: "normal",
    createdAt: "2026-09-03T16:02:00+10:00",
    updatedAt: "2026-09-03T17:40:00+10:00",
    messages: [
      { id: "m2", at: "2026-09-03T16:02:00+10:00", from: "customer", author: "Priya Shah", text: "Hit the included minutes after a storm weekend. Can we add a block without changing plan?" },
      { id: "m3", at: "2026-09-03T17:40:00+10:00", from: "melo", author: "Melo", text: "Yes — extra minutes are A$0.55 each after the cap. The receptionist keeps answering. Want me to flag usage in Billing?" },
    ],
  },
  {
    id: "t3",
    number: "SUP-1833",
    tenantId: "parra-plumb",
    from: "Tom Brennan",
    email: "tom@parrapipe.com.au",
    subject: "Trial — widget not on the site yet",
    status: "open",
    priority: "normal",
    createdAt: "2026-09-04T07:01:00+10:00",
    updatedAt: "2026-09-04T07:01:00+10:00",
    messages: [
      { id: "m4", at: "2026-09-04T07:01:00+10:00", from: "customer", author: "Tom Brennan", text: "Snippet is in WordPress but the bubble doesn’t show on mobile. Using the Astra theme." },
    ],
  },
  {
    id: "t4",
    number: "SUP-1828",
    tenantId: "ashfield-clean",
    from: "Ravi Patel",
    email: "ravi@ashfieldclean.com.au",
    subject: "Card declined — past due",
    status: "open",
    priority: "high",
    createdAt: "2026-09-02T09:44:00+10:00",
    updatedAt: "2026-09-03T10:12:00+10:00",
    messages: [
      { id: "m5", at: "2026-09-02T09:44:00+10:00", from: "customer", author: "Ravi Patel", text: "Visa ended. New card is in the app but still showing past due." },
      { id: "m6", at: "2026-09-03T10:12:00+10:00", from: "melo", author: "Melo", text: "Retry ran last night and failed (insufficient funds). We’ll retry tonight. You can also pay INV MEL-991 from Billing." },
    ],
  },
  {
    id: "t5",
    number: "SUP-1821",
    tenantId: "inner-hvac",
    from: "Marc Nguyen",
    email: "marc@innerwesthvac.com.au",
    subject: "Xero tax codes on quotes",
    status: "open",
    priority: "normal",
    createdAt: "2026-09-03T11:28:00+10:00",
    updatedAt: "2026-09-03T11:28:00+10:00",
    messages: [
      { id: "m7", at: "2026-09-03T11:28:00+10:00", from: "customer", author: "Marc Nguyen", text: "Quotes going to Xero as GST-free. We need GST on Supply. Mapping looks right on our side." },
    ],
  },
  {
    id: "t6",
    number: "SUP-1814",
    tenantId: "mosman-paint",
    from: "Isla Grant",
    email: "isla@mosmanpainting.com.au",
    subject: "Cancel at period end",
    status: "closed",
    priority: "low",
    createdAt: "2026-08-12T09:20:00+10:00",
    updatedAt: "2026-08-12T14:05:00+10:00",
    messages: [
      { id: "m8", at: "2026-08-12T09:20:00+10:00", from: "customer", author: "Isla Grant", text: "Quiet season — pause until October?" },
      { id: "m9", at: "2026-08-12T14:05:00+10:00", from: "melo", author: "Melo", text: "Paused plans aren’t in v1. Cancelled at period end (12 Aug). You can reactivate from Billing anytime." },
    ],
  },
  {
    id: "t7",
    number: "SUP-1809",
    tenantId: "balmain-build",
    from: "Mia Thompson",
    email: "mia@balmainbuild.com.au",
    subject: "Custom MCP for Simpro",
    status: "waiting",
    priority: "normal",
    createdAt: "2026-09-01T15:50:00+10:00",
    updatedAt: "2026-09-02T09:05:00+10:00",
    messages: [
      { id: "m10", at: "2026-09-01T15:50:00+10:00", from: "customer", author: "Mia Thompson", text: "We want Ledger to raise invoices in Simpro, not only Xero. Can Helix call our MCP?" },
      { id: "m11", at: "2026-09-02T09:05:00+10:00", from: "melo", author: "Melo", text: "Yes — Connect → MCP → Add server. Grant Ledger the Money + your Simpro MCP. I can jump on a screen-share if the handshake fails." },
    ],
  },
  {
    id: "t8",
    number: "SUP-1802",
    tenantId: "glebe-gas",
    from: "Helen Cho",
    email: "helen@glebegas.com.au",
    subject: "After-hours greeting sounds American",
    status: "open",
    priority: "low",
    createdAt: "2026-09-04T09:18:00+10:00",
    updatedAt: "2026-09-04T09:18:00+10:00",
    messages: [
      { id: "m12", at: "2026-09-04T09:18:00+10:00", from: "customer", author: "Helen Cho", text: "Isla is fine in the day. Overnight sample dropped to a US voice after we trained Melo on the website. Settings still say Isla." },
    ],
  },
];

export function createAdminSeed(): AdminData {
  return { tenants, series, content, tickets };
}

export const ADMIN_SEED = createAdminSeed();
