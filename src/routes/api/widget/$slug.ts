import { createFileRoute } from "@tanstack/react-router";
import { accountBySlug, insertInbox } from "@/lib/channels/db";

export const Route = createFileRoute("/api/widget/$slug")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const acc = await accountBySlug(params.slug);
        if (!acc) return Response.json({ ok: false, error: "Unknown widget" }, { status: 404 });
        const after = isAfterHours();
        const greeting = after
          ? `Hello! This is Melo, a digital assistant, and you’ve reached ${acc.business_name} after hours. How can I help you today?`
          : `Hello! This is Melo, a digital assistant for ${acc.business_name}. How can I help you today?`;
        return Response.json({
          ok: true,
          brand: acc.business_name,
          greeting,
          hours: acc.hours,
          afterHours: after,
        });
      },
      POST: async ({ request, params }) => {
        const acc = await accountBySlug(params.slug);
        if (!acc) return Response.json({ ok: false, error: "Unknown widget" }, { status: 404 });
        const body = (await request.json().catch(() => ({}))) as {
          text?: string;
          name?: string;
          phone?: string;
          email?: string;
          source?: string;
        };
        const text = (body.text || "").trim();
        if (!text) return Response.json({ ok: false, error: "Message required" }, { status: 400 });
        const from = body.name?.trim() || body.phone?.trim() || body.email?.trim() || "Website visitor";
        await insertInbox({
          userId: acc.user_id,
          channel: "widget",
          fromName: from,
          fromAddress: body.phone || body.email || "",
          subject: body.source === "form" ? "Website form" : "Website chat",
          body: [text, body.phone ? `Phone: ${body.phone}` : "", body.email ? `Email: ${body.email}` : ""]
            .filter(Boolean)
            .join("\n"),
        });
        try {
          const { logComputer } = await import("@/lib/computer/db");
          const { ensureComputerDaemon } = await import("@/lib/computer/engine");
          ensureComputerDaemon();
          await logComputer({
            userId: acc.user_id,
            kind: "inbox",
            agent: "receptionist",
            text: `Website visitor — ${from}`,
            detail: text.slice(0, 240),
          });
        } catch {
          /* */
        }
        const reply = (await smartReply(text, acc, params.slug)) || widgetReply(text, acc, params.slug);
        return Response.json({ ok: true, reply });
      },
    },
  },
});

function isAfterHours() {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Australia/Sydney" }));
  const day = now.getDay();
  const h = now.getHours();
  if (day === 0 || day === 6) return true;
  return h < 7 || h >= 17;
}

async function smartReply(
  text: string,
  acc: {
    business_name: string;
    about: string;
    hours: string;
    after_hours: string;
    services: string[];
    suburbs: string[];
  },
  slug: string,
) {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "grok-4.5",
        max_tokens: 220,
        temperature: 0.35,
        messages: [
          {
            role: "system",
            content: `You are Melo, the digital assistant on ${acc.business_name}'s website. Speak as the business. Short replies, 2–4 sentences. Never mention other AI brands. Hours: ${acc.hours || "business hours"}. After hours: ${acc.after_hours || "leave a mobile"}. Services: ${acc.services.join(", ") || "the work on the site"}. Areas: ${acc.suburbs.join(", ") || "the local area"}. About: ${acc.about || ""}. If they want a quote or booking, ask for name, mobile and suburb. Book link: /book/${slug}.`,
          },
          { role: "user", content: text },
        ],
      }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return json.choices?.[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  }
}

function widgetReply(
  text: string,
  acc: {
    business_name: string;
    about: string;
    hours: string;
    after_hours: string;
    services: string[];
    suburbs: string[];
  },
  slug: string,
) {
  const q = text.toLowerCase();
  if (/\b(hour|open|close|when)\b/.test(q) && acc.hours) return acc.hours;
  if (/\b(after.?hours|emergency|tonight|now)\b/.test(q) && acc.after_hours) return acc.after_hours;
  if (acc.suburbs.length && /\b(area|suburb|cover|come to|service)\b/.test(q)) {
    return `We cover ${acc.suburbs.slice(0, 8).join(", ")}.`;
  }
  const svc = acc.services.find((s) => q.includes(s.toLowerCase().split(" ")[0] ?? ""));
  if (svc) return `Yes — we do ${svc}. Leave a mobile and we’ll book a window.`;
  if (/\b(book|today|tomorrow|window|available)\b/.test(q)) {
    return `I can hold a window. Leave your mobile here, or book at /book/${slug}.`;
  }
  if (/\b(price|cost|how much|quote)\b/.test(q)) {
    return `I can have the office send a quote. Leave a mobile and a short description of the work.`;
  }
  if (acc.about) return `${acc.about.slice(0, 220)} Someone from ${acc.business_name} will follow up if you leave a number.`;
  return `Thanks — ${acc.business_name} has that. Leave a mobile and we’ll come back to you.`;
}
