import { incGst, money } from "@/lib/format";
import { uid } from "@/lib/utils";
import { totals } from "./totals";
import type { Knowledge, LineItem } from "./types";

export type MoneyAsk = {
  kind: "quote" | "invoice";
  email: string;
  description: string;
};

const EMAIL_RE = /[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}/i;

const SERVICE_KEYS: { id: string; keys: string[] }[] = [
  { id: "blocked-drain", keys: ["blocked drain", "block drain", "drain", "blockage", "gully", "jetting", "toilet"] },
  { id: "leak", keys: ["leak", "drip", "wet ceiling", "pipe burst"] },
  { id: "hot-water", keys: ["hot water", "hotwater", "heater", "hws", "cylinder"] },
  { id: "gas", keys: ["gas fitting", "cooktop", "gas"] },
  { id: "emergency", keys: ["emergency", "overflow", "burst", "no water"] },
];

export function parseMoneyAsk(input: string): MoneyAsk | null {
  const emailMatch = input.match(EMAIL_RE);
  if (!emailMatch) return null;
  const q = input.toLowerCase();
  const invoiceAt = q.search(/\b(tax\s+invoice|invoice|bill)\b/);
  const quoteAt = q.search(/\b(quote|quotation|estimate)\b/);
  const isInvoice = invoiceAt >= 0;
  const isQuote = quoteAt >= 0;
  if (!isInvoice && !isQuote) return null;
  if (/\b(status|where is|what happened|open the|find)\b/.test(q) && !/\b(create|draft|make|raise|send|price)\b/.test(q)) {
    return null;
  }
  const kind: "quote" | "invoice" =
    isInvoice && (!isQuote || invoiceAt < quoteAt) ? "invoice" : "quote";
  const description = input
    .replace(emailMatch[0], " ")
    .replace(/\b(create|me|a|an|the|please|can you|could you|draft|make|raise|send|write|prepare|build|new|price)\b/gi, " ")
    .replace(/\b(quote|quotation|estimate|tax invoice|invoice|bill)\b/gi, " ")
    .replace(/\b(for email|email|for|to)\b/gi, " ")
    .replace(/[:*()/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return { kind, email: emailMatch[0].toLowerCase(), description };
}

export function nameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "Customer";
  return local
    .replace(/[._+\-]+/g, " ")
    .replace(/\d+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase()) || "New customer";
}

export type PricedScope = {
  title: string;
  suburb: string;
  afterHours: boolean;
  serviceIds: string[];
  items: LineItem[];
};

export function priceFromBook(description: string, knowledge: Knowledge): PricedScope {
  const q = description.toLowerCase();
  const afterHours = /\b(after.?hours|after hours|tonight|urgent|weekend|emergency)\b/.test(q);
  const hoursMatch = q.match(/(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours)\b/);
  const hours = hoursMatch ? Number(hoursMatch[1]) : null;
  const wantMaterials = /\b(material|materials|fitting|fittings|parts|waste|pipe|pipes|sealant)\b/.test(q);
  const suburb = knowledge.areas.find((a) => q.includes(a.toLowerCase())) ?? "";

  const matched = SERVICE_KEYS.filter((s) => s.keys.some((k) => q.includes(k)))
    .map((s) => knowledge.services.find((x) => x.id === s.id && x.active))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));
  const services = matched.filter((s, i) => matched.findIndex((x) => x.id === s.id) === i);

  const items: LineItem[] = [];
  if (afterHours) {
    items.push({
      id: uid("li"),
      kind: "callout",
      description: "After-hours / priority call-out",
      qty: 1,
      unit: "ea",
      cost: 0,
      sell: 90,
    });
  }

  if (services.length) {
    for (const service of services) {
      const typicalHrs = Math.round((service.durationMins / 60) * 2) / 2 || 1.5;
      const labourHrs = hours ?? typicalHrs;
      const floorInc = afterHours ? service.afterHoursFrom : service.priceFrom;
      const floorEx = Math.round((floorInc / 1.1) * 100) / 100;
      items.push({
        id: uid("li"),
        kind: "labour",
        description: `Labour — ${service.name.toLowerCase()}${afterHours ? " (after hours)" : ""}`,
        qty: labourHrs,
        unit: "hr",
        cost: 55,
        sell: 140,
      });
      const labourEx = labourHrs * 140;
      const extras = afterHours ? 90 : 0;
      if (labourEx + extras < floorEx) {
        items.push({
          id: uid("li"),
          kind: "other",
          description: `Price book — ${service.name} (from ${money(floorInc)} inc GST)`,
          qty: 1,
          unit: "ea",
          cost: 0,
          sell: Math.round((floorEx - labourEx - extras) * 100) / 100,
        });
      }
    }
  } else {
    const label = description.trim() ? description.trim().slice(0, 48) : "plumbing attendance";
    items.push({
      id: uid("li"),
      kind: "labour",
      description: `Labour — ${label}${afterHours ? " (after hours)" : ""}`,
      qty: hours ?? 1.5,
      unit: "hr",
      cost: 55,
      sell: 140,
    });
  }

  if (wantMaterials) {
    items.push({
      id: uid("li"),
      kind: "material",
      description: "Materials — fittings & consumables",
      qty: 1,
      unit: "lot",
      cost: 32,
      sell: 81.82,
    });
  }

  if (!items.length) {
    items.push({
      id: uid("li"),
      kind: "labour",
      description: "Labour — plumbing attendance",
      qty: hours ?? 1.5,
      unit: "hr",
      cost: 55,
      sell: 140,
    });
  }

  const titleSrc = description
    .replace(/(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours)\b/gi, "")
    .replace(/\b(labour|labor)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  const title =
    services[0]?.name ??
    (titleSrc ? titleSrc.replace(/^./, (c) => c.toUpperCase()).slice(0, 48) : "Plumbing work");

  return {
    title,
    suburb,
    afterHours,
    serviceIds: services.map((s) => s.id),
    items,
  };
}

export function pricedSummary(items: LineItem[]): string {
  const t = totals(items);
  const lines = items.map((i) => `• ${i.description} — ${money(i.qty * i.sell)}`).join("\n");
  return `${lines}\n• GST — ${money(t.gst)}\nTotal ${money(t.inc)} inc GST`;
}

export { incGst };
