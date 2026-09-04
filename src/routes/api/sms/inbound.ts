import { createFileRoute } from "@tanstack/react-router";
import { findVoiceByNumber, insertInbox } from "@/lib/channels/db";
import { twimlResponse } from "@/lib/voice/twilio";
import { twilioFields } from "@/lib/voice/form";

export const Route = createFileRoute("/api/sms/inbound")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const fields = await twilioFields(request);
        const hit = await findVoiceByNumber(fields.to);
        if (!hit) return twimlResponse("");
        await insertInbox({
          userId: hit.userId,
          channel: "sms",
          fromName: fields.from,
          fromAddress: fields.from,
          subject: "SMS",
          body: fields.body || fields.speech || "",
        });
        try {
          const { logComputer } = await import("@/lib/computer/db");
          await logComputer({
            userId: hit.userId,
            kind: "inbox",
            agent: "receptionist",
            text: `SMS from ${fields.from}`,
            detail: (fields.body || "").slice(0, 240),
          });
        } catch {
          /* */
        }
        return twimlResponse("");
      },
    },
  },
});
