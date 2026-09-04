import { createFileRoute } from "@tanstack/react-router";
import { appendTranscript, findVoiceByNumber, getAccountExtras, insertInbox, upsertLiveCall } from "@/lib/channels/db";
import { publicOrigin } from "@/lib/channels/origin";
import { interpretSpeech } from "@/lib/voice/intent";
import { digits, sendSms, twimlResponse, xmlEscape, type TwilioCreds } from "@/lib/voice/twilio";
import { twilioFields } from "@/lib/voice/form";
import { playTwiML } from "@/lib/voice/tts";
import { isAfterHoursSydney } from "@/lib/voice/intent";

export const Route = createFileRoute("/api/voice/gather")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const fields = await twilioFields(request);
        const hit = await findVoiceByNumber(fields.to);
        if (!hit) return twimlResponse("<Hangup/>");
        const speech = fields.speech || fields.digits || "message";
        const intent = interpretSpeech(speech);
        const extras = await getAccountExtras(hit.userId);
        const brand = extras?.business_name || "the office";
        const origin = publicOrigin(request);
        const now = new Date().toISOString();
        await appendTranscript(fields.callSid, { at: now, speaker: "customer", text: speech });
        const after = isAfterHoursSydney();
        const owner = digits(hit.creds.ownerPhone || "");
        const say = (text: string) => playTwiML(origin, hit.userId, text);
        const again = `<Gather input="speech dtmf" action="${xmlEscape(`${origin}/api/voice/gather`)}" method="POST" timeout="4" speechTimeout="auto" language="en-AU">`;

        if (intent === "emergency" || (intent === "human" && !after)) {
          if (!owner) {
            await insertInbox({
              userId: hit.userId,
              channel: "voice",
              fromName: fields.from,
              fromAddress: fields.from,
              subject: "Wants to speak to someone",
              body: speech,
            });
            await appendTranscript(fields.callSid, {
              at: new Date().toISOString(),
              speaker: "receptionist",
              text: "I'll have the owner call you back.",
            });
            return twimlResponse(`${say("I'll have the owner call you back shortly.")}<Hangup/>`);
          }
          await appendTranscript(fields.callSid, {
            at: new Date().toISOString(),
            speaker: "receptionist",
            text: "Putting you through now.",
          });
          await upsertLiveCall({
            id: fields.callSid,
            userId: hit.userId,
            fromNumber: fields.from,
            toNumber: fields.to,
            phase: "live",
            reason: intent === "emergency" ? "Emergency transfer" : "Transfer to owner",
          });
          return twimlResponse(
            `${say(intent === "emergency" ? "This sounds urgent. I'll put you through now." : "I'll put you through now.")}` +
              `<Dial callerId="${xmlEscape(digits(hit.creds.phoneNumber))}" timeout="25">${xmlEscape(owner)}</Dial>`,
          );
        }

        if (intent === "hours") {
          const hours = extras?.hours || "Monday to Friday, seven thirty to four thirty.";
          await appendTranscript(fields.callSid, { at: new Date().toISOString(), speaker: "receptionist", text: hours });
          return twimlResponse(`${say(hours)}${again}${say("Anything else I can help with?")}</Gather><Hangup/>`);
        }

        if (intent === "price") {
          const text = `Typical call-outs start around one hundred and eighty dollars including GST. I can book a window or send a quote after this call.`;
          await appendTranscript(fields.callSid, { at: new Date().toISOString(), speaker: "receptionist", text });
          return twimlResponse(`${say(text)}${again}${say("Want me to book that, or transfer you?")}</Gather><Hangup/>`);
        }

        await insertInbox({
          userId: hit.userId,
          channel: "voice",
          fromName: fields.from,
          fromAddress: fields.from,
          subject: intent === "book" ? "Wants a booking" : "Phone message",
          body: speech,
        });
        try {
          const { logComputer } = await import("@/lib/computer/db");
          await logComputer({
            userId: hit.userId,
            kind: "inbox",
            agent: "receptionist",
            text: `Took a ${intent} from ${fields.from}`,
            detail: speech.slice(0, 240),
          });
        } catch {
          /* */
        }
        const reply =
          after && intent === "human"
            ? `The office is closed. I've taken your number — someone from ${brand} will call first thing.`
            : after && intent === "book"
              ? `I've noted that. Someone from ${brand} will text a morning window.`
              : intent === "book"
                ? `I've got that. Someone from ${brand} will text you a window shortly.`
                : `I've taken a message. Someone from ${brand} will call you back.`;
        await appendTranscript(fields.callSid, { at: new Date().toISOString(), speaker: "receptionist", text: reply });
        if (owner) {
          try {
            await sendSms(hit.creds as TwilioCreds, owner, `${brand}: ${fields.from} — ${speech.slice(0, 140)}`);
          } catch {
            /* */
          }
          try {
            await sendSms(hit.creds as TwilioCreds, fields.from, `${brand}: we received your call. We'll be in touch shortly.`);
          } catch {
            /* SMS not enabled on the number is fine */
          }
        }
        await upsertLiveCall({
          id: fields.callSid,
          userId: hit.userId,
          fromNumber: fields.from,
          toNumber: fields.to,
          phase: "ended",
          reason: intent === "book" ? "Booking request" : "Message taken",
          summary: speech,
        });
        return twimlResponse(`${say(reply)}<Hangup/>`);
      },
    },
  },
});
