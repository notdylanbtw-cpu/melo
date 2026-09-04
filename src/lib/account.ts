import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import type { Industry } from "@/lib/melo/types";

export type AccountRecord = {
  userId: string;
  ownerName: string;
  businessName: string;
  industry: Industry;
  email: string | null;
  about: string;
  website: string;
  services: string[];
  suburbs: string[];
  hours: string;
  afterHours: string;
  tools: string[];
  onboardingComplete: boolean;
  totpEnabled: boolean;
  isHq: boolean;
  planId: string;
  trialEndsAt: string | null;
  billingStatus: string;
  officeJson: string;
};

type Row = {
  user_id: string;
  owner_name: string;
  business_name: string;
  industry: string;
  email: string | null;
  about: string;
  website: string;
  services: string;
  suburbs: string;
  hours: string;
  after_hours: string;
  tools: string;
  onboarding_complete: boolean | string | number;
  totp_secret: string | null;
  totp_enabled: boolean | string | number;
  is_hq: boolean | string | number;
  plan_id?: string;
  trial_ends_at?: string | null;
  billing_status?: string;
  office_json?: string;
};

function asBool(v: boolean | string | number | null | undefined) {
  return v === true || v === "t" || v === "true" || v === 1 || v === "1";
}

function asList(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw) as unknown;
    return Array.isArray(v) ? v.map(String).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function toAccount(row: Row): AccountRecord {
  return {
    userId: row.user_id,
    ownerName: row.owner_name,
    businessName: row.business_name,
    industry: (row.industry as Industry) || "trades",
    email: row.email,
    about: row.about,
    website: row.website ?? "",
    services: asList(row.services),
    suburbs: asList(row.suburbs),
    hours: row.hours,
    afterHours: row.after_hours,
    tools: asList(row.tools),
    onboardingComplete: asBool(row.onboarding_complete),
    totpEnabled: asBool(row.totp_enabled),
    isHq: asBool(row.is_hq),
    planId: row.plan_id || "growth",
    trialEndsAt: row.trial_ends_at ?? null,
    billingStatus: row.billing_status || "unpaid",
    officeJson: row.office_json ?? "",
  };
}

async function loadOrCreate(userId: string): Promise<Row> {
  const sql = await getSql();
  const existing = await sql<Row>`select * from accounts where user_id = ${userId} limit 1`;
  if (existing[0]) return existing[0];
  await sql`insert into accounts (user_id) values (${userId})`;
  const created = await sql<Row>`select * from accounts where user_id = ${userId} limit 1`;
  return created[0]!;
}

export const getAccount = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const row = await loadOrCreate(context.userId);
    return toAccount(row);
  });

export const completeOnboarding = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: {
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
    email?: string;
    planId?: string;
  }) => input)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await loadOrCreate(context.userId);
    const planId = data.planId || "growth";
    const trial = planId === "growth" ? new Date(Date.now() + 7 * 86400000).toISOString() : null;
    await sql`
      update accounts set
        owner_name = ${data.ownerName.trim()},
        business_name = ${data.businessName.trim()},
        industry = ${data.industry},
        email = ${data.email ?? null},
        about = ${data.about.trim()},
        website = ${(data.website ?? "").trim()},
        services = ${JSON.stringify(data.services)},
        suburbs = ${JSON.stringify(data.suburbs)},
        hours = ${data.hours.trim()},
        after_hours = ${data.afterHours.trim()},
        tools = ${JSON.stringify(data.tools)},
        onboarding_complete = true,
        plan_id = ${planId},
        trial_ends_at = ${trial},
        billing_status = ${planId === "growth" ? "trial" : "unpaid"}
      where user_id = ${context.userId}
    `;
    const row = await loadOrCreate(context.userId);
    return toAccount(row);
  });

export const saveOfficeSnapshot = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { json: string }) => input)
  .handler(async ({ context, data }) => {
    if (data.json.length > 4_000_000) throw new Error("Office is too large to save.");
    const sql = await getSql();
    await loadOrCreate(context.userId);
    await sql`update accounts set office_json = ${data.json} where user_id = ${context.userId}`;
    return { ok: true as const };
  });

export const applyCheckout = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { planId: string }) => input)
  .handler(async ({ context, data }) => {
    const planId = ["starter", "growth", "firm"].includes(data.planId) ? data.planId : "growth";
    const trial = planId === "growth" ? new Date(Date.now() + 7 * 86400000).toISOString() : null;
    const sql = await getSql();
    await loadOrCreate(context.userId);
    await sql`
      update accounts set
        plan_id = ${planId},
        trial_ends_at = ${trial},
        billing_status = ${planId === "growth" ? "trial" : "active"}
      where user_id = ${context.userId}
    `;
    return { ok: true as const, planId, trialEndsAt: trial };
  });

export const persistOfficeCopy = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { about: string; website?: string; hours: string; afterHours: string; services: string[]; suburbs: string[] }) => input)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`
      update accounts set
        about = ${data.about.trim()},
        website = ${(data.website ?? "").trim()},
        hours = ${data.hours.trim()},
        after_hours = ${data.afterHours.trim()},
        services = ${JSON.stringify(data.services)},
        suburbs = ${JSON.stringify(data.suburbs)}
      where user_id = ${context.userId}
    `;
    return { ok: true as const };
  });

export const beginTotp = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { generateSecret } = await import("@/lib/totp");
    const secret = generateSecret();
    const sql = await getSql();
    await sql`update accounts set totp_secret = ${secret}, totp_enabled = false where user_id = ${context.userId}`;
    return { secret };
  });

export const confirmTotp = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((code: string) => code)
  .handler(async ({ context, data: code }) => {
    const { verifyTotp } = await import("@/lib/totp");
    const row = await loadOrCreate(context.userId);
    if (!row.totp_secret) return { ok: false as const, error: "Start 2FA first." };
    if (!verifyTotp(row.totp_secret, code)) {
      return { ok: false as const, error: "That code didn’t match." };
    }
    const sql = await getSql();
    await sql`update accounts set totp_enabled = true where user_id = ${context.userId}`;
    return { ok: true as const };
  });

export const checkTotp = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((code: string) => code)
  .handler(async ({ context, data: code }) => {
    const { verifyTotp } = await import("@/lib/totp");
    const row = await loadOrCreate(context.userId);
    if (!asBool(row.totp_enabled) || !row.totp_secret) return { ok: true as const };
    if (!verifyTotp(row.totp_secret, code)) {
      return { ok: false as const, error: "That code didn’t match." };
    }
    return { ok: true as const };
  });

export const claimHq = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    await loadOrCreate(context.userId);
    const row = await loadOrCreate(context.userId);
    if (asBool(row.is_hq)) return { ok: true as const, isHq: true };
    const others = await sql<{ n: number }>`select count(*)::int as n from accounts where is_hq = true`;
    const n = Number(others[0]?.n ?? 0);
    if (n === 0) {
      await sql`update accounts set is_hq = true where user_id = ${context.userId}`;
      return { ok: true as const, isHq: true };
    }
    return { ok: false as const, isHq: false };
  });

export const saveElevenLabs = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { apiKey: string; voiceId?: string }) => input)
  .handler(async ({ context, data }) => {
    const key = data.apiKey.trim();
    if (!key.startsWith("sk_")) throw new Error("That doesn’t look like an ElevenLabs key. It should start with sk_.");
    const res = await fetch("https://api.elevenlabs.io/v1/user", { headers: { "xi-api-key": key } });
    if (!res.ok) throw new Error("ElevenLabs rejected that key.");
    const voiceId = (data.voiceId ?? "").trim();
    const sql = await getSql();
    await loadOrCreate(context.userId);
    await sql`
      update accounts set
        eleven_api_key = ${key},
        eleven_voice_id = ${voiceId}
      where user_id = ${context.userId}
    `;
    return { ok: true as const, last4: key.slice(-4) };
  });

export const getElevenLabs = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    await loadOrCreate(context.userId);
    const rows = await sql<{ eleven_api_key: string; eleven_voice_id: string }>`
      select eleven_api_key, eleven_voice_id from accounts where user_id = ${context.userId} limit 1
    `;
    const key = rows[0]?.eleven_api_key?.trim() || "";
    const { defaultElevenVoiceId } = await import("@/lib/voice/tts");
    return {
      connected: Boolean(key),
      last4: key.slice(-4),
      voiceId: rows[0]?.eleven_voice_id || defaultElevenVoiceId(),
    };
  });
