import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";
import { xmlEscape } from "./twilio";

export const SAMPLE_TEXT =
  "Welcome to Melo A.I. I'm the receptionist that answers as you. I pick up the phone, book the job, take a message, or put them through. After hours, I still answer. I draft quotes, send invoices, and keep the inbox clear, so you can stay on the tools. Train me on your hours, suburbs and services, and every caller hears your business — not a generic bot.";

const EL_VOICES: Record<string, string> = {
  Isla: "56bWURjYFHyYyVf490Dp",
  Matilda: "EXAVITQu4vr4xnSDxMaL",
  Jack: "IKne3meq5aSn9XLyUdCD",
};

const SECRET_FILE = path.join(process.cwd(), ".data/elevenlabs.json");
const SECRET_TXT = path.join(process.cwd(), ".secrets/elevenlabs");

function fileSecret(): { apiKey: string; voiceId: string } {
  try {
    const raw = JSON.parse(readFileSync(SECRET_FILE, "utf8")) as { apiKey?: string; voiceId?: string };
    return { apiKey: raw.apiKey?.trim() || "", voiceId: raw.voiceId?.trim() || "" };
  } catch {
    try {
      return { apiKey: readFileSync(SECRET_TXT, "utf8").trim(), voiceId: "" };
    } catch {
      return { apiKey: "", voiceId: "" };
    }
  }
}

function cacheDir() {
  return path.join(process.env.TMPDIR || "/tmp", "melo-tts");
}

function cachePath(text: string, voice: string, engine: string) {
  const id = createHash("sha1").update(`${engine}:${voice}:${text}`).digest("hex");
  return path.join(cacheDir(), `${id}.mp3`);
}

export function elevenLabsKey(extra?: string) {
  return (extra ?? process.env.ELEVENLABS_API_KEY ?? process.env.XI_API_KEY ?? fileSecret().apiKey).trim();
}

export function defaultElevenVoiceId() {
  return (process.env.ELEVENLABS_VOICE_ID ?? fileSecret().voiceId ?? EL_VOICES.Isla).trim();
}

async function fromCache(file: string) {
  try {
    return await readFile(file);
  } catch {
    return null;
  }
}

async function toCache(file: string, bytes: Buffer) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, bytes);
}

async function elevenSpeak(text: string, voiceName: string, key: string, voiceId?: string): Promise<Buffer> {
  const mapped = EL_VOICES[voiceName] || EL_VOICES.Isla;
  const voice = voiceId?.trim() || mapped;
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: {
      "xi-api-key": key,
      accept: "audio/mpeg",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        stability: 0.48,
        similarity_boost: 0.8,
        style: 0.12,
        use_speaker_boost: true,
      },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err.slice(0, 240) || `ElevenLabs ${res.status}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

export async function synthesize(opts: {
  text: string;
  voice?: string;
  elevenKey?: string;
  elevenVoiceId?: string;
}) {
  const text = opts.text.trim().slice(0, 1200) || SAMPLE_TEXT;
  const voice = opts.voice || "Isla";
  const el = elevenLabsKey(opts.elevenKey);
  if (!el) throw new Error("ElevenLabs isn’t connected");
  const file = cachePath(text, `${voice}:${opts.elevenVoiceId ?? defaultElevenVoiceId()}`, "eleven");
  const hit = await fromCache(file);
  if (hit) return hit;
  const bytes = await elevenSpeak(text, voice, el, opts.elevenVoiceId);
  await toCache(file, bytes);
  return bytes;
}

export function playTwiML(origin: string, userId: string, text: string, voice = "Isla") {
  const u = new URL("/api/voice/sample", origin);
  u.searchParams.set("user", userId);
  u.searchParams.set("voice", voice);
  u.searchParams.set("text", text);
  return `<Play>${xmlEscape(u.toString())}</Play>`;
}
