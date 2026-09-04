import { createFileRoute } from "@tanstack/react-router";
import { findVoiceByNumber, getAccountExtras, upsertLiveCall } from "@/lib/channels/db";
import { publicOrigin } from "@/lib/channels/origin";
import { twimlResponse, xmlEscape } from "@/lib/voice/twilio";
import { twilioFields } from "@/lib/voice/form";
import { isAfterHoursSydney } from "@/lib/voice/intent";
import { playTwiML } from "@/lib/voice/tts";

export const Route = createFileRoute("/api/voice/inbound")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const fields = await twilioFields(request);
        const hit = await findVoiceByNumber(fields.to);
        if (!hit) {
          return twimlResponse("<Say>This number isn't connected to Melo.</Say><Hangup/>");
        }
        await upsertLiveCall({
          id: fields.callSid,
          userId: hit.userId,
          fromNumber: fields.from,
          toNumber: fields.to,
          phase: "live",
          reason: "Inbound",
        });
        try {
          const { logComputer } = await import("@/lib/computer/db");
          const { ensureComputerDaemon } = await import("@/lib/computer/engine");
          ensureComputerDaemon();
          await logComputer({
            userId: hit.userId,
            kind: "call",
            agent: "receptionist",
            text: `Inbound call from ${fields.from}`,
            detail: fields.callSid,
          });
        } catch {
          /* */
        }
        const extras = await getAccountExtras(hit.userId);
        const brand = extras?.business_name || "the office";
        const after = isAfterHoursSydney();
        const greeting = after
          ? extras?.after_hours || `You've reached ${brand} after hours. If this is an emergency, say emergency. Otherwise leave a message after the tone.`
          : `${brand}, receptionist speaking. How can I help?`;
        const origin = publicOrigin(request);
        const gather = `${origin}/api/voice/gather`;
        return twimlResponse(
          `<Gather input="speech dtmf" action="${xmlEscape(gather)}" method="POST" timeout="5" speechTimeout="auto" language="en-AU" bargeIn="true">` +
            playTwiML(origin, hit.userId, greeting) +
            `</Gather>` +
            playTwiML(origin, hit.userId, "Sorry, I missed that. I'll take a message and someone will call you back.") +
            `<Redirect method="POST">${xmlEscape(gather)}</Redirect>`,
        );
      },
    },
  },
});
