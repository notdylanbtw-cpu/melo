import { createFileRoute } from "@tanstack/react-router";
import { accountBySlug, insertInbox } from "@/lib/channels/db";

export const Route = createFileRoute("/api/widget/$slug")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const acc = await accountBySlug(params.slug);
        if (!acc) return Response.json({ ok: false, error: "Unknown widget" }, { status: 404 });
        return Response.json({
          ok: true,
          brand: acc.business_name,
          greeting: acc.about
            ? `Hi — ${acc.business_name}. ${acc.about.slice(0, 140)}`
            : `Hi — ${acc.business_name} here. How can I help?`,
          hours: acc.hours,
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
        return Response.json({ ok: true, reply: widgetReply(text, acc, params.slug) });
      },
    },
  },
});

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
