import { money, timeOf } from "@/lib/format";
import { answerFromKnowledge } from "./knowledge";
import { parseMoneyAsk } from "./price-ask";
import type { ChatChip, ChatMessage, MeloData } from "./types";
import { uid } from "@/lib/utils";

export type AskResult = {
  text: string;
  chips?: ChatChip[];
  agentId?: string;
};

function nowIso() {
  return new Date().toISOString();
}

export function toChat(result: AskResult): ChatMessage {
  return {
    id: uid("chat"),
    at: nowIso(),
    role: "melo",
    text: result.text,
    chips: result.chips,
    agentId: result.agentId ?? "helix",
  };
}

export function localAsk(input: string, data: MeloData): AskResult | null {
  const q = input.toLowerCase();
  const mentioned = mention(q);

  if (q.includes("who is free") || (q.includes("free") && q.includes("thursday"))) {
    return {
      agentId: "dispatch",
      text: "Thursday still has two clean windows:\n\n• Sam · 7:30 am · Inner West (travel buffer 7:05). Fits Mia Thompson’s Newtown laundry leak.\n• Dez · 10:00 am · Burwood run (after Artarmon). Fits a drain or callback.\n\nBondi at 2:00 pm with Sam is already held for Priya Nair. Say the word and I’ll book it through Review.",
      chips: [
        { id: "book-sam", label: "Book Sam · 7:30 am", action: "book", payload: { staffId: "sam", start: "2026-09-03T07:30:00+10:00", jobId: "job-1041" } },
        { id: "book-dez", label: "Book Dez · 10:00 am", action: "book", payload: { staffId: "dez", start: "2026-09-03T10:00:00+10:00", jobId: "job-1042" } },
      ],
    };
  }

  if (q.includes("overnight") || q.includes("what happened")) {
    return {
      agentId: "brief",
      text: "Overnight brief for Northside:\n\n• 3 after-hours calls — Mia (WhatsApp leak, quoted), a missed call from Tom, then Tom again at 11:41 pm.\n• 1 booked — James Wilson, Burwood blocked drain, Dez 10:00 am. Receptionist is on that call now.\n• 1 callback — Tom Brennan, Marrickville overflow. Promised 7:30 am.\n\nMoney sitting in Review: Q-2041 Mia Thompson A$420. Quill also filed a Newtown drain GBP post.",
      chips: [
        { id: "open-tom", label: "Open Tom’s thread", action: "open_inbox", payload: { id: "conv-tom" } },
        { id: "open-q", label: "Review Q-2041", action: "open_review", payload: { id: "rev-q2041" } },
      ],
    };
  }

  if (q.includes("draft a quote") || q.includes("draft quote") || q.includes("quote for mia")) {
    return {
      agentId: "ledger",
      text: `Q-2041 is already drafted for Mia Thompson — laundry leak at 14 King St, Newtown.\n\n${quoteLines(data)}\n\nAutopilot for Ledger is Ask me, so it is waiting in Review. Send for signature and Mia’s e-sign approves the job — Thursday 7:30 am with Sam stays held.\n\nOr say: “create a quote for email name@domain.com blocked drain Newtown” and I’ll price it from the book.`,
      chips: [{ id: "rev", label: "Send Q-2041 for signature", action: "open_review", payload: { id: "rev-q2041" } }],
    };
  }

  if (/\b(create|draft|make|raise|send|write)\b/.test(q) && /\b(quote|invoice|estimate)\b/.test(q) && !parseMoneyAsk(input)) {
    return {
      agentId: "ledger",
      text: "I’ll price it from the book and file send for your approval. Include the email and the work, e.g. “create a quote for email tombrennan@fastmail.com overflow after hours” or “create an invoice for email helen.cho@artarmon.legal 4 hours labour”.",
    };
  }

  if (mentioned === "quill" || q.includes("@quill")) {
    return {
      agentId: "quill",
      text: "Quill here. Highest-demand draft this morning is “Blocked drains Newtown” — four drain calls this week, sitting in Review. I also have “Emergency plumber Marrickville” scheduled for Friday. Tell me to rewrite, localise, or push a GBP photo.",
      chips: [{ id: "c", label: "Open content", action: "run", payload: { run: "reach" } }],
    };
  }

  if (mentioned === "scout" || q.includes("@scout")) {
    return {
      agentId: "scout",
      text: "Scout here. Three quiet threads: Helen Cho wants labour added on Q-2033, Ravi Patel’s Instagram mixer drip is drafted, and Tom Brennan is in missed-call recovery. I will not send customer messages until you approve — autopilot is Draft only.",
      chips: [{ id: "s", label: "Open Scout drafts", action: "open_review", payload: { id: "rev-msg1" } }],
    };
  }

  if (mentioned === "ledger" || q.includes("@ledger") || q.includes("invoice") || q.includes("send invoice")) {
    return {
      agentId: "ledger",
      text: "Ledger here. INV-3204 is drafted for Helen Cho — water filter install, A$911 inc GST, ready to send. INV-3199 is the A$3,200 deposit on Q-2033, waiting on you. INV-3102 (Priya) is paid. Nothing overdue. I’ll fill the tax-invoice template and drop it in her email.",
      chips: [
        { id: "invs", label: "Open invoices", action: "run", payload: { run: "invoices" } },
        { id: "l", label: "Open Q-2041", action: "open_review", payload: { id: "rev-q2041" } },
      ],
    };
  }

  if (mentioned === "dispatch" || q.includes("@dispatch")) {
    return {
      agentId: "dispatch",
      text: "Dispatch here. Sam: Newtown 7:30, Bondi 2:00 with a 35-minute travel hold. Dez: Burwood 10:00 after Artarmon. Friday 9:00 with Sam is still open for unscheduled work.",
      chips: [{ id: "d", label: "Open calendar", action: "run", payload: { run: "calendar" } }],
    };
  }

  if (mentioned === "receptionist" || q.includes("@receptionist")) {
    const call = data.liveCall;
    return {
      agentId: "receptionist",
      text: call && call.phase !== "ended"
        ? `On the line with ${data.customers.find((c) => c.id === call.customerId)?.name ?? "a customer"} — ${call.reason} in ${call.suburb}. I can warm-transfer or book from here.`
        : "Front desk is clear. I can take the next call, quote from the price book, or book a window.",
      chips: [{ id: "rec", label: "Open Reception", action: "run", payload: { run: "reception" } }],
    };
  }

  if (q.includes("callback") || q.includes("tom brennan")) {
    return {
      agentId: "scout",
      text: "Tom Brennan called twice overnight from Marrickville — overflow. Promised a 7:30 am callback. Number +61 422 091 445. Scout has him in missed-call recovery and will not text until you say so.",
      chips: [
        { id: "tom", label: "Open Tom’s thread", action: "open_inbox", payload: { id: "conv-tom" } },
        { id: "book-tom", label: "Book Sam · 7:30 am", action: "book", payload: { staffId: "sam", start: "2026-09-03T07:30:00+10:00", jobId: "job-1041" } },
      ],
    };
  }

  if (q.includes("working on") || q.includes("what are you") || (q.includes("status") && mentioned)) {
    const agent = data.agents.find((a) => a.id === mentioned || a.name.toLowerCase() === mentioned);
    const target = agent ?? data.agents.find((a) => a.status === "working");
    return {
      agentId: target?.id ?? "helix",
      text: target
        ? `${target.name} is ${target.status === "working" ? "on it" : target.status}: ${target.currentTask ?? "idle, waiting on a brief"}. Autopilot is ${target.autopilot === "act" ? "Act within rules" : target.autopilot === "draft" ? "Draft only" : "Ask me"}.`
        : "Helix is coordinating. Specialists report in Review.",
      chips: [{ id: "firm", label: "Open Firm", action: "run", payload: { run: "firm" } }],
    };
  }

  if (q.includes("blocked drain") || q.includes("price") || q.includes("newtown") || q.includes("after hours") || q.includes("hot water") || q.includes("do you")) {
    const a = answerFromKnowledge(input, data.knowledge);
    return {
      agentId: "receptionist",
      text: `${a.text}\n\nSources: ${a.citations.map((c) => c.title).join(" · ")}`,
      chips: [{ id: "k", label: "Open Knowledge", action: "run", payload: { run: "knowledge" } }],
    };
  }

  return null;
}

function mention(q: string): string | null {
  const names = ["quill", "scout", "ledger", "dispatch", "receptionist", "helix", "brief"];
  for (const name of names) {
    if (q.includes(`@${name}`)) return name;
  }
  return null;
}

function quoteLines(data: MeloData): string {
  const job = data.jobs.find((j) => j.id === "job-1041");
  if (!job?.quote) return "A$420 inc GST.";
  const ex = job.quote.items.reduce((s, i) => s + i.qty * i.sell, 0);
  const gst = Math.round(ex * 0.1 * 100) / 100;
  const lines = job.quote.items.map((i) => `• ${i.description} — ${money(i.qty * i.sell)}`).join("\n");
  return `${lines}\n• GST — ${money(gst)}\nTotal ${money(ex + gst)} inc GST.`;
}

export function systemPrompt(data: MeloData): string {
  const services = data.knowledge.services
    .map((s) => `${s.name}: from ${money(s.priceFrom)} (after hours ${money(s.afterHoursFrom)})`)
    .join("; ");
  return `You are Helix, floor manager of Melo, the AI office firm for ${data.workspace.name} (${data.workspace.industry}) in Sydney. Owner is ${data.workspace.ownerName}. Number ${data.workspace.number}. Speak as a calm operations manager, not a chatbot. Australian English. Never mention underlying models.

Knowledge (one brain): Areas ${data.knowledge.areas.join(", ")}. Hours: ${data.knowledge.hours}. After hours: ${data.knowledge.afterHours}. Services: ${services}. Booking: ${data.knowledge.bookingRules}.

Staff: ${data.staff.map((s) => `${s.name} (${s.role})`).join(", ")}.
Today's jobs: ${data.jobs
    .filter((j) => j.scheduledStart?.startsWith("2026-09-03"))
    .map((j) => `${j.number} ${j.title} ${j.suburb} ${j.scheduledStart ? timeOf(j.scheduledStart) : ""}`)
    .join("; ")}.

Keep answers short. Offer a next action. Money and customer-facing sends go to Review unless autopilot is Act.

If the owner asks to create a quote or invoice for an email address, price line items from the price book (services above), add GST, and wait for approval before sending. Do not invent prices outside the book.`;
}
