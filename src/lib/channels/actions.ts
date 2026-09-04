import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";

export type ChannelKind = "voice" | "whatsapp" | "messenger" | "facebook" | "instagram" | "imessage" | "widget";

export const listChannelAccounts = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { getRequest } = await import("@tanstack/react-start/server");
    const db = await import("./db");
    const { publicOrigin, slugify } = await import("./origin");
    const extras = await db.getAccountExtras(context.userId);
    let slug = extras?.widget_slug ?? "";
    if (!slug) {
      slug = slugify(extras?.business_name || "office");
      await db.setWidgetSlug(context.userId, slug);
    }
    const channels = await db.listChannels(context.userId);
    const req = getRequest();
    const origin = req ? publicOrigin(req) : "";
    return {
      channels: channels.map((c) => ({
        kind: c.kind,
        status: c.status,
        externalId: c.externalId,
        detail: c.detail,
        connectedAt: c.connectedAt,
      })),
      widgetSlug: slug,
      origin,
      widgetSnippet: origin ? `<script src="${origin}/widget.js" data-melo="${slug}" async></script>` : "",
      widgetUrl: origin ? `${origin}/w/${slug}` : "",
      formUrl: origin ? `${origin}/api/widget/${slug}` : "",
      ownerPhone: extras?.owner_phone ?? "",
    };
  });

export const connectTwilio = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { accountSid: string; authToken: string; phoneNumber: string; ownerPhone: string }) => input)
  .handler(async ({ context, data }) => {
    const { getRequest } = await import("@tanstack/react-start/server");
    const db = await import("./db");
    const twilio = await import("@/lib/voice/twilio");
    const { publicOrigin, slugify } = await import("./origin");
    const creds: import("@/lib/voice/twilio").TwilioCreds = {
      accountSid: data.accountSid.trim(),
      authToken: data.authToken.trim(),
      phoneNumber: twilio.digits(data.phoneNumber),
      ownerPhone: twilio.digits(data.ownerPhone),
    };
    if (!creds.accountSid.startsWith("AC")) throw new Error("Account SID should start with AC");
    const info = await twilio.verifyTwilio(creds);
    const matched = info.matched;
    if (!matched?.sid) throw new Error("No incoming number on that Twilio account. Buy a number in Twilio first.");
    creds.phoneNumber = matched.phone || creds.phoneNumber;
    creds.phoneSid = matched.sid;
    const req = getRequest();
    if (!req) throw new Error("Missing request");
    const origin = publicOrigin(req);
    await twilio.pointNumberAtMelo(creds, origin, matched.sid);
    await db.upsertChannel({
      userId: context.userId,
      kind: "voice",
      status: "connected",
      externalId: creds.phoneNumber,
      credentials: {
        accountSid: creds.accountSid,
        authToken: creds.authToken,
        phoneNumber: creds.phoneNumber,
        phoneSid: creds.phoneSid ?? "",
        ownerPhone: creds.ownerPhone ?? "",
      },
      detail: `${creds.phoneNumber} · receptionist live`,
    });
    await db.setWidgetSlug(context.userId, (await db.getAccountExtras(context.userId))?.widget_slug || slugify("office"), creds.ownerPhone);
    return {
      ok: true as const,
      number: creds.phoneNumber,
      voiceUrl: `${origin}/api/voice/inbound`,
      friendlyName: info.friendlyName,
    };
  });

export const testTwilioCall = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { getRequest } = await import("@tanstack/react-start/server");
    const db = await import("./db");
    const { placeCall, twiml } = await import("@/lib/voice/twilio");
    const { playTwiML } = await import("@/lib/voice/tts");
    const { publicOrigin } = await import("./origin");
    const ch = await db.getChannel(context.userId, "voice");
    if (!ch || ch.status !== "connected") throw new Error("Connect Twilio first");
    const creds = ch.credentials as unknown as import("@/lib/voice/twilio").TwilioCreds;
    if (!creds.ownerPhone) throw new Error("Add your mobile so Melo can ring you");
    const req = getRequest();
    if (!req) throw new Error("Missing request");
    const origin = publicOrigin(req);
    await placeCall(
      creds,
      creds.ownerPhone,
      twiml(`${playTwiML(origin, context.userId, "This is Melo. Your receptionist is connected and ready to answer the office line.")}`),
    );
    return { ok: true as const };
  });

export const connectMetaChannel = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { kind: ChannelKind; token: string; externalId: string; extra?: string }) => input)
  .handler(async ({ context, data }) => {
    const db = await import("./db");
    const token = data.token.trim();
    const externalId = data.externalId.trim();
    if (!token || !externalId) throw new Error("Token and ID are required");
    const url =
      data.kind === "whatsapp"
        ? `https://graph.facebook.com/v21.0/${externalId}?fields=display_phone_number,verified_name&access_token=${encodeURIComponent(token)}`
        : `https://graph.facebook.com/v21.0/${externalId}?fields=name&access_token=${encodeURIComponent(token)}`;
    const res = await fetch(url);
    const json = (await res.json()) as { name?: string; display_phone_number?: string; verified_name?: string; error?: { message?: string } };
    if (!res.ok) throw new Error(json.error?.message || "Meta rejected those credentials");
    const label = json.verified_name || json.display_phone_number || json.name || externalId;
    await db.upsertChannel({
      userId: context.userId,
      kind: data.kind,
      status: "connected",
      externalId,
      credentials: { token, extra: data.extra ?? "" },
      detail: `${label} · live`,
    });
    return { ok: true as const, label };
  });

export const connectIMessage = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { provider: "sendblue" | "loopmessage"; apiKey: string; from: string }) => input)
  .handler(async ({ context, data }) => {
    const db = await import("./db");
    await db.upsertChannel({
      userId: context.userId,
      kind: "imessage",
      status: "connected",
      externalId: data.from.trim(),
      credentials: { provider: data.provider, apiKey: data.apiKey.trim(), from: data.from.trim() },
      detail: `${data.provider} · ${data.from.trim()}`,
    });
    return { ok: true as const };
  });

export const disconnectChannel = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((kind: ChannelKind) => kind)
  .handler(async ({ context, data: kind }) => {
    const db = await import("./db");
    await db.upsertChannel({
      userId: context.userId,
      kind,
      status: "available",
      externalId: "",
      credentials: {},
      detail: "Disconnected",
    });
    return { ok: true as const };
  });

export const listOfficeCalls = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const db = await import("./db");
    const rows = await db.listLiveCalls(context.userId);
    return rows.map((r) => {
      let transcript: { at: string; speaker: string; text: string }[] = [];
      try {
        transcript = JSON.parse(r.transcript || "[]") as typeof transcript;
      } catch {
        transcript = [];
      }
      return {
        id: r.id,
        from: r.from_number,
        to: r.to_number,
        phase: r.phase,
        reason: r.reason,
        startedAt: r.started_at,
        summary: r.summary,
        transcript,
      };
    });
  });

export const pullChannelInbox = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const db = await import("./db");
    return db.pullInbox(context.userId);
  });

export const transferLiveCall = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { callSid: string; to: string; name?: string }) => input)
  .handler(async ({ context, data }) => {
    const { getRequest } = await import("@tanstack/react-start/server");
    const db = await import("./db");
    const { digits, redirectCall } = await import("@/lib/voice/twilio");
    const { publicOrigin } = await import("./origin");
    const ch = await db.getChannel(context.userId, "voice");
    if (!ch) throw new Error("Twilio is not connected");
    const creds = ch.credentials as unknown as import("@/lib/voice/twilio").TwilioCreds;
    const req = getRequest();
    if (!req) throw new Error("Missing request");
    const origin = publicOrigin(req);
    const url = `${origin}/api/voice/transfer?to=${encodeURIComponent(digits(data.to))}&name=${encodeURIComponent(data.name ?? "the team")}&user=${encodeURIComponent(context.userId)}`;
    await redirectCall(creds, data.callSid, url);
    return { ok: true as const };
  });

export const endLiveCall = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((callSid: string) => callSid)
  .handler(async ({ context, data: callSid }) => {
    const db = await import("./db");
    const { hangupCall } = await import("@/lib/voice/twilio");
    const ch = await db.getChannel(context.userId, "voice");
    if (!ch) throw new Error("Twilio is not connected");
    await hangupCall(ch.credentials as unknown as import("@/lib/voice/twilio").TwilioCreds, callSid);
    return { ok: true as const };
  });

export const holdLiveCall = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { callSid: string; hold: boolean }) => input)
  .handler(async ({ context, data }) => {
    const { getRequest } = await import("@tanstack/react-start/server");
    const db = await import("./db");
    const { redirectCall } = await import("@/lib/voice/twilio");
    const { publicOrigin } = await import("./origin");
    const ch = await db.getChannel(context.userId, "voice");
    if (!ch) throw new Error("Twilio is not connected");
    const req = getRequest();
    if (!req) throw new Error("Missing request");
    const origin = publicOrigin(req);
    await redirectCall(
      ch.credentials as unknown as import("@/lib/voice/twilio").TwilioCreds,
      data.callSid,
      data.hold ? `${origin}/api/voice/hold?user=${encodeURIComponent(context.userId)}` : `${origin}/api/voice/inbound?resume=1`,
    );
    return { ok: true as const };
  });

export const sendChannelMessage = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { channel: ChannelKind | "sms"; to: string; text: string }) => input)
  .handler(async ({ context, data }) => {
    const db = await import("./db");
    const { sendSms } = await import("@/lib/voice/twilio");
    if (data.channel === "sms" || data.channel === "voice") {
      const ch = await db.getChannel(context.userId, "voice");
      if (!ch) throw new Error("Connect Twilio to send SMS");
      await sendSms(ch.credentials as unknown as import("@/lib/voice/twilio").TwilioCreds, data.to, data.text);
      return { ok: true as const };
    }
    if (data.channel === "whatsapp") {
      const ch = await db.getChannel(context.userId, "whatsapp");
      if (!ch) throw new Error("Connect WhatsApp first");
      const res = await fetch(`https://graph.facebook.com/v21.0/${ch.externalId}/messages`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${ch.credentials.token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: data.to.replace(/\D/g, ""),
          type: "text",
          text: { body: data.text },
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      return { ok: true as const };
    }
    if (data.channel === "messenger" || data.channel === "instagram" || data.channel === "facebook") {
      const ch = await db.getChannel(context.userId, data.channel);
      if (!ch) throw new Error(`Connect ${data.channel} first`);
      const res = await fetch(`https://graph.facebook.com/v21.0/me/messages?access_token=${encodeURIComponent(ch.credentials.token)}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ recipient: { id: data.to }, message: { text: data.text } }),
      });
      if (!res.ok) throw new Error(await res.text());
      return { ok: true as const };
    }
    if (data.channel === "imessage") {
      const ch = await db.getChannel(context.userId, "imessage");
      if (!ch) throw new Error("Connect iMessage first");
      if (ch.credentials.provider === "sendblue") {
        const res = await fetch("https://api.sendblue.co/api/send-message", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "sb-api-key-id": ch.credentials.apiKey,
            "sb-api-secret-key": ch.credentials.extra ?? ch.credentials.apiKey,
          },
          body: JSON.stringify({ number: data.to, content: data.text, from_number: ch.credentials.from }),
        });
        if (!res.ok) throw new Error(await res.text());
      } else {
        const res = await fetch("https://server.loopmessage.com/api/v1/message/send/", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: ch.credentials.apiKey,
            "loop-secret-key": ch.credentials.extra ?? "",
          },
          body: JSON.stringify({ recipient: data.to, text: data.text, sender_name: ch.credentials.from }),
        });
        if (!res.ok) throw new Error(await res.text());
      }
      return { ok: true as const };
    }
    throw new Error("Channel cannot send");
  });
