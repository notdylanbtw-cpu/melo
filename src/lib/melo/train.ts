import type { Integration, KnowledgeService } from "./types";
import { uid } from "@/lib/utils";

export type StudyInput = {
  website: string;
  description: string;
  tools: string;
};

export type StudyResult = {
  brand?: string;
  host?: string;
  services: KnowledgeService[];
  areas: string[];
  hours?: string;
  afterHours?: string;
  greeting?: string;
  widgetGreeting?: string;
  bookingRules?: string;
  faqs: { q: string; a: string; sourceId: string }[];
  toolIds: string[];
  unknownTools: string[];
  notes: string[];
};

const SUBURBS = [
  "Newtown", "Marrickville", "Enmore", "Burwood", "Bondi", "Inner West", "Annandale", "Glebe",
  "Artarmon", "Leichhardt", "Balmain", "Rozelle", "Petersham", "Stanmore", "Dulwich Hill",
  "Ashfield", "Croydon", "Concord", "Strathfield", "Parramatta", "Chatswood", "North Sydney",
  "Mosman", "Manly", "Maroubra", "Alexandria", "Erskineville", "Redfern", "Surry Hills",
  "Paddington", "Randwick", "Coogee", "Summer Hill", "Haberfield", "Five Dock", "Drummoyne",
  "Pyrmont", "Ultimo", "Mascot", "Bondi Junction", "Rose Bay",
];

const SERVICE_CATALOG: { id: string; name: string; keys: string[]; priceFrom: number; afterHoursFrom: number; durationMins: number; summary: string }[] = [
  { id: "blocked-drain", name: "Blocked drains", keys: ["blocked drain", "block drain", "drain", "blockage", "gully", "jetting"], priceFrom: 180, afterHoursFrom: 280, durationMins: 75, summary: "Toilets, gully traps and main lines. Jetting and camera available." },
  { id: "leak", name: "Leak detection & repair", keys: ["leak", "drip", "burst pipe"], priceFrom: 180, afterHoursFrom: 280, durationMins: 90, summary: "Ceiling, laundry and under-house leaks." },
  { id: "hot-water", name: "Hot water repairs", keys: ["hot water", "hotwater", "heater", "hws"], priceFrom: 220, afterHoursFrom: 320, durationMins: 90, summary: "Electric and gas. Replacement quoted separately." },
  { id: "emergency", name: "Emergency plumbing", keys: ["emergency", "overflow", "burst", "after hours", "after-hours"], priceFrom: 280, afterHoursFrom: 280, durationMins: 90, summary: "Overflows, bursts and no-water events." },
  { id: "gas", name: "Gas fitting", keys: ["gas fitting", "gas", "cooktop"], priceFrom: 240, afterHoursFrom: 340, durationMins: 120, summary: "Licensed gas. Cooktops, heaters, compliance." },
  { id: "camera", name: "Drain camera", keys: ["camera inspection", "cctv", "drain camera"], priceFrom: 250, afterHoursFrom: 350, durationMins: 60, summary: "CCTV inspection of drains and reports." },
  { id: "tapware", name: "Taps & mixers", keys: ["tap", "mixer", "cartridge"], priceFrom: 160, afterHoursFrom: 260, durationMins: 60, summary: "Tap and mixer repairs and replacements." },
  { id: "filter", name: "Water filters", keys: ["water filter", "filter install"], priceFrom: 280, afterHoursFrom: 380, durationMins: 90, summary: "Under-bench and whole-of-house filters." },
  { id: "electrical", name: "Electrical", keys: ["electrical", "switchboard", "power point"], priceFrom: 180, afterHoursFrom: 280, durationMins: 90, summary: "General electrical and switchboards." },
  { id: "solar", name: "Solar", keys: ["solar"], priceFrom: 0, afterHoursFrom: 0, durationMins: 180, summary: "Solar install and service — quoted per job." },
];

const TOOL_ALIASES: { id: string; keys: string[] }[] = [
  { id: "xero", keys: ["xero"] },
  { id: "myob", keys: ["myob"] },
  { id: "qbo", keys: ["quickbooks", "qbo"] },
  { id: "stripe", keys: ["stripe"] },
  { id: "square", keys: ["square"] },
  { id: "servicem8", keys: ["servicem8", "service m8", "service-m8"] },
  { id: "jobber", keys: ["jobber"] },
  { id: "fergus", keys: ["fergus"] },
  { id: "simpro", keys: ["simpro"] },
  { id: "gcal", keys: ["google calendar", "gcal", "g calendar"] },
  { id: "outlook", keys: ["outlook calendar", "outlook"] },
  { id: "gmail", keys: ["gmail", "google mail"] },
  { id: "olmail", keys: ["office 365 mail"] },
  { id: "whatsapp", keys: ["whatsapp"] },
  { id: "instagram", keys: ["instagram", "ig"] },
  { id: "slack", keys: ["slack"] },
  { id: "teams", keys: ["teams", "microsoft teams"] },
  { id: "zapier", keys: ["zapier", "make.com"] },
  { id: "twilio", keys: ["twilio"] },
  { id: "telnyx", keys: ["telnyx"] },
  { id: "shopify", keys: ["shopify"] },
  { id: "wordpress", keys: ["wordpress"] },
  { id: "webflow", keys: ["webflow"] },
  { id: "gbp", keys: ["google business", "gbp", "google profile"] },
  { id: "hubspot", keys: ["hubspot"] },
  { id: "pipedrive", keys: ["pipedrive"] },
];

export const SUGGESTED_TOOLS = [
  "Xero", "Stripe", "ServiceM8", "Google Calendar", "WhatsApp", "Gmail", "Slack", "Jobber", "Square", "Twilio",
];

export function parseWebsite(raw: string): { host?: string; brand?: string; href?: string } {
  const trimmed = raw.trim();
  if (!trimmed) return {};
  try {
    const href = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const u = new URL(href);
    const host = u.hostname.replace(/^www\./i, "");
    const brand = host
      .split(".")[0]
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    return { host, brand, href };
  } catch {
    return {};
  }
}

export function study(input: StudyInput, knownIntegrations: Integration[]): StudyResult {
  const notes: string[] = [];
  const site = parseWebsite(input.website);
  const blob = `${input.description} ${input.website}`.toLowerCase();
  const desc = input.description.trim();

  const services: KnowledgeService[] = [];
  for (const cat of SERVICE_CATALOG) {
    if (cat.keys.some((k) => blob.includes(k))) {
      const priced = extractPrice(desc, cat.keys[0]) ?? cat.priceFrom;
      services.push({
        id: cat.id,
        name: cat.name,
        summary: cat.summary,
        priceFrom: priced || cat.priceFrom,
        afterHoursFrom: cat.afterHoursFrom,
        durationMins: cat.durationMins,
        active: true,
      });
    }
  }

  const areas = SUBURBS.filter((a) => blob.includes(a.toLowerCase()));

  const hours = extractHours(desc);
  const after =
    /\b(after.?hours|emergency|24\/7|overnight)\b/i.test(desc)
      ? "After hours and weekends for genuine emergencies. Otherwise first window next morning."
      : undefined;

  const toolIds: string[] = [];
  const unknownTools: string[] = [];
  const bits = input.tools
    .split(/[,/\n]+/)
    .map((t) => t.trim())
    .filter(Boolean);
  for (const bit of bits) {
    const low = bit.toLowerCase();
    const hit = TOOL_ALIASES.find((t) => t.keys.some((k) => low.includes(k)));
    if (hit) {
      if (!toolIds.includes(hit.id)) toolIds.push(hit.id);
    } else if (!knownIntegrations.some((i) => i.name.toLowerCase() === low)) {
      unknownTools.push(bit);
    }
  }

  const faqs: StudyResult["faqs"] = [];
  const src = "train";
  if (areas.length) {
    faqs.push({
      q: `Do you service ${areas[0]}?`,
      a: `Yes — ${areas.slice(0, 6).join(", ")}${areas.length > 6 ? " and nearby suburbs" : ""}.`,
      sourceId: src,
    });
  }
  if (services.length) {
    faqs.push({
      q: "What work do you do?",
      a: `We handle ${services.map((s) => s.name.toLowerCase()).join(", ")}.`,
      sourceId: src,
    });
  }
  if (after) {
    faqs.push({
      q: "Do you work after hours?",
      a: after,
      sourceId: src,
    });
  }
  if (site.host) {
    faqs.push({
      q: "Where can I read more?",
      a: `Details live on ${site.host}.`,
      sourceId: "website",
    });
  }
  if (desc) {
    const first = desc.split(/(?<=\.)\s/)[0]?.slice(0, 220);
    if (first && first.length > 24) {
      faqs.push({ q: "Tell me about the business", a: first, sourceId: src });
    }
  }

  if (site.host) notes.push(`Read ${site.host}`);
  if (services.length) notes.push(`${services.length} service${services.length === 1 ? "" : "s"} from your description`);
  else notes.push("No named services yet — add drains, leaks, hot water or similar");
  if (areas.length) notes.push(`Areas: ${areas.slice(0, 5).join(", ")}`);
  if (toolIds.length) notes.push(`Matched ${toolIds.length} tool${toolIds.length === 1 ? "" : "s"} in Connect`);
  if (unknownTools.length) notes.push(`Noted ${unknownTools.join(", ")} as custom tools`);

  const names = services.map((s) => s.name.toLowerCase());
  const greeting = site.brand ? `${site.brand}, this is the receptionist.` : undefined;
  const widgetGreeting = site.brand
    ? `Hi — ${site.brand} here.${names.length ? ` ${names.slice(0, 3).join(", ")}? I can quote or book.` : " How can I help?"}`
    : undefined;

  return {
    brand: site.brand,
    host: site.host,
    services,
    areas,
    hours,
    afterHours: after,
    greeting,
    widgetGreeting,
    bookingRules: /\b(same.?day|90.?min|travel)\b/i.test(desc)
      ? "Standard jobs in 90-minute windows with a travel buffer. Same-day where the run allows."
      : undefined,
    faqs,
    toolIds,
    unknownTools,
    notes,
  };
}

function extractPrice(text: string, near: string): number | undefined {
  const idx = text.toLowerCase().indexOf(near);
  const window = idx >= 0 ? text.slice(Math.max(0, idx - 40), idx + 60) : text;
  const m = window.match(/\$\s?(\d{2,4})/);
  return m ? Number(m[1]) : undefined;
}

function extractHours(text: string): string | undefined {
  const m = text.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm))\s*(?:–|-|to)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i);
  if (!m) return undefined;
  const days = /saturday|sunday|weekend/i.test(text) ? "Monday to Saturday" : "Monday to Friday";
  return `Workshop hours ${days} ${m[1]} – ${m[2]} Sydney time.`;
}

export function mergeServices(existing: KnowledgeService[], incoming: KnowledgeService[]): KnowledgeService[] {
  const out = [...existing];
  for (const s of incoming) {
    const i = out.findIndex((x) => x.id === s.id || x.name.toLowerCase() === s.name.toLowerCase());
    if (i >= 0) {
      out[i] = { ...out[i], ...s, id: out[i].id, active: true };
    } else {
      out.push({ ...s, id: s.id || uid("svc") });
    }
  }
  return out;
}
