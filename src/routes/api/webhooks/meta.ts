import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";
import { insertInbox } from "@/lib/channels/db";

export const Route = createFileRoute("/api/webhooks/meta")({
  server: {
    handlers: {
      GET: ({ request }) => {
        const url = new URL(request.url);
        const mode = url.searchParams.get("hub.mode");
        const token = url.searchParams.get("hub.verify_token");
        const challenge = url.searchParams.get("hub.challenge");
        if (mode === "subscribe" && token && challenge) {
          return new Response(challenge, { status: 200 });
        }
        return new Response("forbidden", { status: 403 });
      },
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => null)) as {
          object?: string;
          entry?: Array<{
            id?: string;
            changes?: Array<{ value?: { messages?: Array<{ from?: string; text?: { body?: string } }>; metadata?: { phone_number_id?: string } } }>;
            messaging?: Array<{ sender?: { id?: string }; message?: { text?: string } }>;
          }>;
        } | null;
        if (!body) return new Response("ok");
        const sql = await getSql();
        const accounts = await sql<{ user_id: string; kind: string; external_id: string }>`
          select user_id, kind, external_id from channel_accounts where status = 'connected'
        `;
        for (const entry of body.entry ?? []) {
          for (const change of entry.changes ?? []) {
            const phoneId = change.value?.metadata?.phone_number_id;
            const owner = accounts.find((a) => a.kind === "whatsapp" && (!phoneId || a.external_id === phoneId)) ?? accounts.find((a) => a.kind === "whatsapp");
            for (const msg of change.value?.messages ?? []) {
              if (!owner || !msg.text?.body) continue;
              await insertInbox({
                userId: owner.user_id,
                channel: "whatsapp",
                fromName: msg.from ?? "WhatsApp",
                fromAddress: msg.from ?? "",
                subject: "WhatsApp",
                body: msg.text.body,
              });
            }
          }
          for (const msg of entry.messaging ?? []) {
            const text = msg.message?.text;
            if (!text) continue;
            const owner =
              accounts.find((a) => a.kind === "messenger" || a.kind === "facebook" || a.kind === "instagram") ?? accounts[0];
            if (!owner) continue;
            await insertInbox({
              userId: owner.user_id,
              channel: owner.kind,
              fromName: msg.sender?.id ?? "Messenger",
              fromAddress: msg.sender?.id ?? "",
              subject: "Messenger",
              body: text,
            });
          }
        }
        return new Response("ok");
      },
    },
  },
});
