import { createFileRoute } from "@tanstack/react-router";
import { publicOrigin } from "@/lib/channels/origin";
import { twimlResponse } from "@/lib/voice/twilio";
import { playTwiML } from "@/lib/voice/tts";

export const Route = createFileRoute("/api/voice/hold")({
  server: {
    handlers: {
      POST: ({ request }) => {
        const url = new URL(request.url);
        const user = url.searchParams.get("user") || "office";
        const origin = publicOrigin(request);
        return twimlResponse(
          playTwiML(origin, user, "Please hold.") +
            `<Play loop="20">https://com.twilio.sounds.music.s3.amazonaws.com/ClockworkWaltz.mp3</Play>`,
        );
      },
    },
  },
});
