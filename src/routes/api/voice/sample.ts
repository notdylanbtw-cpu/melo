import { createFileRoute } from "@tanstack/react-router";
import { getAccountExtras } from "@/lib/channels/db";
import { SAMPLE_TEXT, defaultElevenVoiceId, synthesize } from "@/lib/voice/tts";
import { readFile } from "node:fs/promises";

async function audio(text: string, voice: string, elevenKey?: string, elevenVoiceId?: string) {
  const bytes = await synthesize({ text, voice, elevenKey, elevenVoiceId });
  return new Response(new Uint8Array(bytes), {
    headers: { "content-type": "audio/mpeg", "cache-control": "public, max-age=86400" },
  });
}

export const Route = createFileRoute("/api/voice/sample")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const userId = url.searchParams.get("user")?.trim();
        const voice = url.searchParams.get("voice")?.trim() || "Mia";
        let text = url.searchParams.get("text")?.trim() || "";
        let elevenKey: string | undefined;
        let elevenVoiceId: string | undefined = defaultElevenVoiceId();
        if (userId) {
          const extras = await getAccountExtras(userId);
          if (extras?.eleven_api_key) elevenKey = extras.eleven_api_key;
          if (extras?.eleven_voice_id) elevenVoiceId = extras.eleven_voice_id;
          if (!text) {
            const brand = extras?.business_name || "the office";
            text = extras?.hours
              ? `${brand}, receptionist speaking. How can I help?`
              : SAMPLE_TEXT;
          }
        }
        if (!text) text = SAMPLE_TEXT;
        try {
          return await audio(text, voice, elevenKey, elevenVoiceId);
        } catch {
          try {
            const fallback = await readFile("public/sample-isla.mp3");
            return new Response(new Uint8Array(fallback), {
              headers: { "content-type": "audio/mpeg", "cache-control": "public, max-age=86400" },
            });
          } catch {
            return new Response("Voice sample unavailable", { status: 503 });
          }
        }
      },
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => ({}))) as {
          text?: string;
          voice?: string;
          elevenKey?: string;
          elevenVoiceId?: string;
        };
        try {
          return await audio(body.text || SAMPLE_TEXT, body.voice || "Mia", body.elevenKey, body.elevenVoiceId);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Voice failed";
          return Response.json({ error: message }, { status: 502 });
        }
      },
    },
  },
});
