import { parseOfficeJson } from "@/lib/melo/office-sync";
import { isAfterHoursSydney } from "@/lib/voice/intent";
import { bootComputer, logComputer, onboardedUserIds, recentLogHas, setComputer } from "./db";
import type { MeloData } from "@/lib/melo/types";

const g = globalThis as typeof globalThis & { __meloComputerTimer?: ReturnType<typeof setInterval> };

export function ensureComputerDaemon() {
  if (g.__meloComputerTimer) return;
  g.__meloComputerTimer = setInterval(() => {
    void tickAllOffices().catch(() => undefined);
  }, 25_000);
  void tickAllOffices().catch(() => undefined);
}

export async function tickAllOffices() {
  const ids = await onboardedUserIds();
  let jobs = 0;
  for (const id of ids) {
    jobs += await tickOffice(id);
  }
  return { offices: ids.length, jobs };
}

export async function tickOffice(userId: string) {
  const computer = await bootComputer(userId);
  if (computer.status === "paused") {
    await setComputer(userId, { currentTask: "Paused" });
    return 0;
  }

  const after = isAfterHoursSydney();
  if (computer.mode === "hours" && after && !computer.actAfterHours) {
    await setComputer(userId, { currentTask: "Business hours only — phone still answers" });
    return 0;
  }

  let did = 0;
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  const acc = await sql<{ office_json: string; business_name: string }>`
    select office_json, business_name from accounts where user_id = ${userId} limit 1
  `;
  const office = parseOfficeJson(acc[0]?.office_json ?? "") as Partial<MeloData> | null;
  const brand = acc[0]?.business_name || office?.workspace?.name || "the office";

  const inboxDb = await import("@/lib/channels/db");
  const incoming = await inboxDb.pullInbox(userId);
  if (incoming.length) {
    const next = applyInbox(office ?? emptyOffice(brand), incoming);
    await sql`update accounts set office_json = ${JSON.stringify(next)} where user_id = ${userId}`;
    for (const row of incoming) {
      await logComputer({
        userId,
        kind: "inbox",
        agent: "receptionist",
        text: `Took ${row.channel} from ${row.from_name || row.from_address}: ${row.subject || "message"}`,
        detail: row.body.slice(0, 280),
      });
      did += 1;
    }
  }

  const live = await inboxDb.listLiveCalls(userId);
  const ringing = live.filter((c) => c.phase === "live" || c.phase === "queued");
  if (ringing[0] && !(await recentLogHas(userId, ringing[0].id, 3))) {
    await logComputer({
      userId,
      kind: "call",
      agent: "receptionist",
      text: `On a live call with ${ringing[0].from_number}`,
      detail: ringing[0].id,
    });
    did += 1;
  }

  const jobs = office?.jobs ?? [];
  for (const job of jobs) {
    const sig = job.quote?.signature;
    if (sig?.status !== "awaiting") continue;
    const sentAt = sig.sentAt || job.quote?.sentAt;
    if (!sentAt) continue;
    const ageH = (Date.now() - new Date(sentAt).getTime()) / 36e5;
    if (ageH < 4) continue;
    const key = job.quote?.number || job.id;
    if (await recentLogHas(userId, key, 360)) continue;
    await logComputer({
      userId,
      kind: "quote",
      agent: "ledger",
      text: `Chased ${key} — still awaiting e-signature`,
      detail: job.title,
    });
    did += 1;
  }

  const task = ringing[0]
    ? `On a live call · ${ringing[0].from_number}`
    : incoming.length
      ? `Filed ${incoming.length} inbound ${incoming.length === 1 ? "thread" : "threads"}`
      : after
        ? "After hours — receptionist is on the desk"
        : "Watching the desk";

  if (!did && !(await recentLogHas(userId, "Still on", 8))) {
    await logComputer({
      userId,
      kind: "tick",
      agent: "helix",
      text: after ? "Still on. After hours — taking calls and messages." : "Still on. Desk is quiet.",
    });
  }

  await setComputer(userId, { currentTask: task, bumpJobs: Math.max(did, 1) });
  return did;
}

function emptyOffice(brand: string): Partial<MeloData> {
  return {
    workspace: {
      name: brand,
      industry: "trades",
      ownerName: "",
      ownerEmail: "",
      number: "",
      timezone: "Australia/Sydney",
      abn: "",
      address: "",
      brandName: brand,
      brandPrimary: "#2B7FFF",
      widgetGreeting: `Hi — ${brand} here.`,
    },
    conversations: [],
    jobs: [],
    activity: [],
    reviewItems: [],
    customers: [],
  };
}

function applyInbox(office: Partial<MeloData>, rows: { id: string; channel: string; from_name: string; from_address: string; subject: string; body: string; at: string }[]): Partial<MeloData> {
  const conversations = [...(office.conversations ?? [])];
  const customers = [...(office.customers ?? [])];
  const activity = [...(office.activity ?? [])];
  const reviewItems = [...(office.reviewItems ?? [])];

  for (const row of rows) {
    let customer = customers.find((c) => c.phone === row.from_address || c.email === row.from_address);
    if (!customer) {
      customer = {
        id: `cus-${row.id.slice(0, 8)}`,
        name: row.from_name || row.from_address,
        phone: row.from_address,
        email: row.from_address.includes("@") ? row.from_address : "",
        sites: [],
        tags: ["inbound"],
        since: row.at,
        notes: "",
      };
      customers.unshift(customer);
    }
    const channel = (["voice", "sms", "whatsapp", "instagram", "email", "widget", "messenger", "facebook", "imessage"].includes(row.channel)
      ? row.channel
      : "voice") as MeloData["conversations"][number]["channel"];
    let conv = conversations.find((c) => c.customerId === customer.id && c.channel === channel);
    const msg = {
      id: `msg-${row.id.slice(0, 10)}`,
      at: row.at,
      from: "customer" as const,
      author: customer.name,
      text: row.body || row.subject,
      channel,
    };
    if (conv) {
      conv = { ...conv, messages: [...conv.messages, msg], preview: msg.text.slice(0, 80), updatedAt: row.at, unread: conv.unread + 1 };
      const idx = conversations.findIndex((c) => c.id === conv!.id);
      conversations[idx] = conv;
    } else {
      conversations.unshift({
        id: `conv-${row.id.slice(0, 8)}`,
        customerId: customer.id,
        channel,
        subject: row.subject || "Inbound",
        preview: msg.text.slice(0, 80),
        updatedAt: row.at,
        unread: 1,
        assignedAgentId: "receptionist",
        messages: [msg],
      });
    }
    activity.unshift({
      id: `ac-${row.id.slice(0, 8)}`,
      at: row.at,
      actor: "Receptionist",
      agentId: "receptionist",
      text: `Computer took ${row.channel} from ${customer.name}.`,
    });
    reviewItems.unshift({
      id: `rev-${row.id.slice(0, 8)}`,
      kind: "message",
      title: `${customer.name} · ${row.subject || "inbound"}`,
      summary: row.body.slice(0, 240),
      agentId: "receptionist",
      status: "pending",
      createdAt: row.at,
      sources: [row.channel],
      preview: row.body.slice(0, 160),
      conversationId: conv?.id ?? `conv-${row.id.slice(0, 8)}`,
      history: [{ at: row.at, text: "Filed by Melo Computer" }],
    });
  }

  return { ...office, conversations, customers, activity, reviewItems };
}
