import { money } from "@/lib/format";
import type { Knowledge } from "./types";

export type Citation = { id: string; title: string };

export type KnowledgeAnswer = {
  text: string;
  citations: Citation[];
};

function src(k: Knowledge, id: string): Citation {
  const s = k.sources.find((x) => x.id === id);
  return { id, title: s?.name ?? id };
}

export function answerFromKnowledge(query: string, k: Knowledge): KnowledgeAnswer {
  const q = query.toLowerCase();
  const drain = k.services.find((s) => s.id === "blocked-drain");
  const leak = k.services.find((s) => s.id === "leak");
  const hot = k.services.find((s) => s.id === "hot-water");
  const emergency = k.services.find((s) => s.id === "emergency");

  if (q.match(/price|cost|how much|quote|charge/) && q.match(/drain|block/)) {
    return {
      text: `Blocked drain work starts from ${money(drain?.priceFrom ?? 180)} during business hours, or ${money(drain?.afterHoursFrom ?? 280)} after hours (inc GST). Final price depends on access and whether we need to jet or camera the line. We can lock a written quote before we start.`,
      citations: [src(k, "price-book"), src(k, "website")],
    };
  }
  if (q.match(/price|cost|how much/) && q.match(/hot water|heater/)) {
    return {
      text: `Hot water repairs start from ${money(hot?.priceFrom ?? 220)} inc GST. After-hours attendance is from ${money(hot?.afterHoursFrom ?? 320)}. If a replacement is needed we quote parts separately.`,
      citations: [src(k, "price-book")],
    };
  }
  if (q.match(/price|cost|how much/) && q.match(/leak/)) {
    return {
      text: `Leak detection and repair starts from ${money(leak?.priceFrom ?? 180)} inc GST. After-hours is from ${money(leak?.afterHoursFrom ?? 280)}.`,
      citations: [src(k, "price-book")],
    };
  }
  if (q.match(/after.?hours|emergency|tonight|now/)) {
    return {
      text: `${k.afterHours} Emergency attendance starts from ${money(emergency?.afterHoursFrom ?? 280)} inc GST. The Receptionist can book the first available technician and take a deposit if needed.`,
      citations: [src(k, "booking-rules"), src(k, "price-book")],
    };
  }
  if (q.match(/newtown|marrickville|burwood|bondi|area|suburb|do you (come|service)|cover/)) {
    return {
      text: `We cover ${k.areas.join(", ")}. Same-day windows are usually available Inner West and Burwood; Bondi is typically next-day unless it is an emergency.`,
      citations: [src(k, "website"), src(k, "booking-rules")],
    };
  }
  if (q.match(/hours|open|when/)) {
    return {
      text: k.hours,
      citations: [src(k, "website"), src(k, "booking-rules")],
    };
  }
  if (q.match(/book|available|thursday|slot|window/)) {
    return {
      text: k.bookingRules,
      citations: [src(k, "booking-rules"), src(k, "job-system")],
    };
  }
  if (q.match(/blocked drain|drain/)) {
    return {
      text: drain
        ? `${drain.summary} From ${money(drain.priceFrom)} inc GST, typical duration ${drain.durationMins} minutes.`
        : "We clear blocked drains across the Inner West.",
      citations: [src(k, "website"), src(k, "price-book")],
    };
  }

  const faq = k.faqs.find((f) => q.includes(f.q.toLowerCase().slice(0, 18)) || f.q.toLowerCase().split(" ").some((w) => w.length > 4 && q.includes(w)));
  if (faq) {
    return { text: faq.a, citations: [src(k, faq.sourceId)] };
  }

  return {
    text: `${k.greeting} ${k.hours} Service areas: ${k.areas.slice(0, 4).join(", ")}. Ask about a suburb, a price, or a booking window and I will cite the source.`,
    citations: [src(k, "website")],
  };
}

export function coverageOf(k: Knowledge): number {
  if (!k.sources.length) return 0;
  return Math.round(k.sources.reduce((s, x) => s + x.coverage, 0) / k.sources.length);
}
