import { createFileRoute } from "@tanstack/react-router";
import { digits, twimlResponse, xmlEscape } from "@/lib/voice/twilio";
import { publicOrigin } from "@/lib/channels/origin";
import { playTwiML } from "@/lib/voice/tts";

export const Route = createFileRoute("/api/voice/transfer")({
  server: {
    handlers: {
      POST: ({ request }) => {
        const url = new URL(request.url);
        const to = digits(url.searchParams.get("to") ?? "");
        const name = url.searchParams.get("name") || "the team";
        const user = url.searchParams.get("user") || "office";
        const origin = publicOrigin(request);
        if (!to) return twimlResponse(`${playTwiML(origin, user, "I don't have a number to transfer to.")}<Hangup/>`);
        return twimlResponse(
          playTwiML(origin, user, `Please hold while I put you through to ${name}.`) +
            `<Dial timeout="25">${xmlEscape(to)}</Dial>`,
        );
      },
    },
  },
});
