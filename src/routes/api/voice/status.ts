import { createFileRoute } from "@tanstack/react-router";
import { findVoiceByNumber, upsertLiveCall } from "@/lib/channels/db";
import { twilioFields } from "@/lib/voice/form";

export const Route = createFileRoute("/api/voice/status")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const fields = await twilioFields(request);
        const hit = await findVoiceByNumber(fields.to);
        if (hit && fields.callSid) {
          const phase =
            fields.status === "completed" || fields.status === "busy" || fields.status === "no-answer" || fields.status === "failed"
              ? "ended"
              : fields.status === "in-progress"
                ? "live"
                : "queued";
          await upsertLiveCall({
            id: fields.callSid,
            userId: hit.userId,
            fromNumber: fields.from,
            toNumber: fields.to,
            phase,
            reason: fields.status,
          });
        }
        return new Response("ok", { status: 200 });
      },
    },
  },
});
