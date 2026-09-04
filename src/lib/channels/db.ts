import { getSql } from "@/lib/db";
import { randomUUID } from "node:crypto";
import { hydrateTwilio, type TwilioCreds } from "@/lib/voice/twilio";
import { platformTwilio } from "@/lib/platform";

export type ChannelKind = "voice" | "whatsapp" | "messenger" | "facebook" | "instagram" | "imessage" | "widget";

export type ChannelAccount = {
  id: string;
  userId: string;
  kind: ChannelKind;
  status: "available" | "connected" | "needs_attention";
  externalId: string;
  credentials: Record<string, string>;
  webhookSecret: string;
  detail: string;
  connectedAt: string | null;
};

function parseCreds(raw: string): Record<string, string> {
  try {
    const v = JSON.parse(raw) as unknown;
    if (!v || typeof v !== "object") return {};
    return Object.fromEntries(Object.entries(v as Record<string, unknown>).map(([k, val]) => [k, String(val ?? "")]));
  } catch {
    return {};
  }
}

export async function upsertChannel(row: {
  userId: string;
  kind: ChannelKind;
  status: ChannelAccount["status"];
  externalId: string;
  credentials: Record<string, string>;
  webhookSecret?: string;
  detail: string;
}) {
  const sql = await getSql();
  const existing = await sql<{ id: string }>`
    select id from channel_accounts where user_id = ${row.userId} and kind = ${row.kind} limit 1
  `;
  const id = existing[0]?.id ?? randomUUID();
  const secret = row.webhookSecret ?? randomUUID().replace(/-/g, "").slice(0, 24);
  if (existing[0]) {
    await sql`
      update channel_accounts set
        status = ${row.status},
        external_id = ${row.externalId},
        credentials = ${JSON.stringify(row.credentials)},
        detail = ${row.detail},
        connected_at = now()
      where id = ${id}
    `;
  } else {
    await sql`
      insert into channel_accounts (id, user_id, kind, status, external_id, credentials, webhook_secret, detail, connected_at)
      values (${id}, ${row.userId}, ${row.kind}, ${row.status}, ${row.externalId}, ${JSON.stringify(row.credentials)}, ${secret}, ${row.detail}, now())
    `;
  }
  return getChannel(row.userId, row.kind);
}

export async function getChannel(userId: string, kind: ChannelKind) {
  const sql = await getSql();
  const rows = await sql<{
    id: string;
    user_id: string;
    kind: string;
    status: string;
    external_id: string;
    credentials: string;
    webhook_secret: string;
    detail: string;
    connected_at: string | null;
  }>`select * from channel_accounts where user_id = ${userId} and kind = ${kind} limit 1`;
  const r = rows[0];
  if (!r) return null;
  const credentials = parseCreds(r.credentials);
  const hydrated =
    r.kind === "voice" || r.kind === "whatsapp"
      ? (hydrateTwilio(credentials, r.external_id, platformTwilio()) as unknown as Record<string, string>)
      : credentials;
  return {
    id: r.id,
    userId: r.user_id,
    kind: r.kind as ChannelKind,
    status: r.status as ChannelAccount["status"],
    externalId: r.external_id,
    credentials: hydrated,
    webhookSecret: r.webhook_secret,
    detail: r.detail,
    connectedAt: r.connected_at,
  } satisfies ChannelAccount;
}

export async function listChannels(userId: string) {
  const sql = await getSql();
  const rows = await sql<{
    id: string;
    user_id: string;
    kind: string;
    status: string;
    external_id: string;
    credentials: string;
    webhook_secret: string;
    detail: string;
    connected_at: string | null;
  }>`select * from channel_accounts where user_id = ${userId}`;
  return rows.map((r) => ({
    id: r.id,
    userId: r.user_id,
    kind: r.kind as ChannelKind,
    status: r.status as ChannelAccount["status"],
    externalId: r.external_id,
    credentials: parseCreds(r.credentials),
    webhookSecret: r.webhook_secret,
    detail: r.detail,
    connectedAt: r.connected_at,
  }));
}

export async function findVoiceByNumber(to: string) {
  const sql = await getSql();
  const rows = await sql<{
    id: string;
    user_id: string;
    credentials: string;
    external_id: string;
    detail: string;
  }>`select id, user_id, credentials, external_id, detail from channel_accounts where kind = 'voice' and status = 'connected'`;
  const want = to.replace(/[^\d+]/g, "");
  const hit = rows.find((r) => {
    const n = r.external_id.replace(/[^\d+]/g, "");
    return n === want || n.endsWith(want.replace("+", "")) || want.endsWith(n.replace("+", ""));
  });
  if (!hit) return null;
  return {
    userId: hit.user_id,
    creds: hydrateTwilio(parseCreds(hit.credentials), hit.external_id, platformTwilio()),
    number: hit.external_id,
  };
}

export async function findByKindExternal(kind: ChannelKind, externalId: string) {
  const sql = await getSql();
  const rows = await sql<{ user_id: string; credentials: string; webhook_secret: string; external_id: string }>`
    select user_id, credentials, webhook_secret, external_id from channel_accounts
    where kind = ${kind} and status = 'connected'
  `;
  return (
    rows.find((r) => r.external_id === externalId) ??
    rows[0]
  );
}

export async function upsertLiveCall(input: {
  id: string;
  userId: string;
  fromNumber: string;
  toNumber: string;
  phase: string;
  reason?: string;
  transcript?: { at: string; speaker: string; text: string }[];
  summary?: string;
}) {
  const sql = await getSql();
  const existing = await sql<{ id: string; transcript: string }>`select id, transcript from live_calls where id = ${input.id} limit 1`;
  const transcript = JSON.stringify(input.transcript ?? []);
  if (existing[0]) {
    await sql`
      update live_calls set
        phase = ${input.phase},
        reason = ${input.reason ?? ""},
        transcript = ${input.transcript ? transcript : existing[0].transcript},
        summary = ${input.summary ?? null}
      where id = ${input.id}
    `;
  } else {
    await sql`
      insert into live_calls (id, user_id, from_number, to_number, phase, reason, transcript)
      values (${input.id}, ${input.userId}, ${input.fromNumber}, ${input.toNumber}, ${input.phase}, ${input.reason ?? ""}, ${transcript})
    `;
  }
}

export async function appendTranscript(callId: string, line: { at: string; speaker: string; text: string }) {
  const sql = await getSql();
  const rows = await sql<{ transcript: string }>`select transcript from live_calls where id = ${callId} limit 1`;
  let list: { at: string; speaker: string; text: string }[] = [];
  try {
    list = JSON.parse(rows[0]?.transcript || "[]") as typeof list;
  } catch {
    list = [];
  }
  list.push(line);
  await sql`update live_calls set transcript = ${JSON.stringify(list)} where id = ${callId}`;
}

export async function listLiveCalls(userId: string) {
  const sql = await getSql();
  return sql<{
    id: string;
    from_number: string;
    to_number: string;
    phase: string;
    reason: string;
    started_at: string;
    transcript: string;
    summary: string | null;
  }>`select * from live_calls where user_id = ${userId} order by started_at desc limit 20`;
}

export async function insertInbox(row: {
  userId: string;
  channel: string;
  fromName: string;
  fromAddress: string;
  subject: string;
  body: string;
}) {
  const sql = await getSql();
  const id = randomUUID();
  await sql`
    insert into channel_inbox (id, user_id, channel, from_name, from_address, subject, body)
    values (${id}, ${row.userId}, ${row.channel}, ${row.fromName}, ${row.fromAddress}, ${row.subject}, ${row.body})
  `;
  return id;
}

export async function pullInbox(userId: string) {
  const sql = await getSql();
  const rows = await sql<{
    id: string;
    channel: string;
    from_name: string;
    from_address: string;
    subject: string;
    body: string;
    at: string;
  }>`select id, channel, from_name, from_address, subject, body, at from channel_inbox where user_id = ${userId} and pulled = false order by at asc`;
  if (rows.length) {
    const ids = rows.map((r) => r.id);
    for (const id of ids) {
      await sql`update channel_inbox set pulled = true where id = ${id}`;
    }
  }
  return rows;
}

export async function accountBySlug(slug: string) {
  const sql = await getSql();
  const rows = await sql<{
    user_id: string;
    business_name: string;
    widget_slug: string;
    about: string;
    hours: string;
    after_hours: string;
    services: string;
    suburbs: string;
  }>`select user_id, business_name, widget_slug, about, hours, after_hours, services, suburbs from accounts where widget_slug = ${slug} limit 1`;
  const row = rows[0];
  if (!row) return null;
  const parse = (raw: string): string[] => {
    try {
      const v = JSON.parse(raw || "[]") as unknown;
      return Array.isArray(v) ? v.map(String) : [];
    } catch {
      return [];
    }
  };
  return {
    ...row,
    services: parse(row.services),
    suburbs: parse(row.suburbs),
  };
}

export async function setWidgetSlug(userId: string, slug: string, ownerPhone?: string) {
  const sql = await getSql();
  if (ownerPhone) {
    await sql`update accounts set widget_slug = ${slug}, owner_phone = ${ownerPhone} where user_id = ${userId}`;
  } else {
    await sql`update accounts set widget_slug = ${slug} where user_id = ${userId}`;
  }
}

export async function getAccountExtras(userId: string) {
  const sql = await getSql();
  const rows = await sql<{
    widget_slug: string;
    owner_phone: string;
    business_name: string;
    hours: string;
    after_hours: string;
    about: string;
    eleven_api_key: string;
    eleven_voice_id: string;
  }>`select widget_slug, owner_phone, business_name, hours, after_hours, about, eleven_api_key, eleven_voice_id from accounts where user_id = ${userId} limit 1`;
  return rows[0] ?? null;
}
