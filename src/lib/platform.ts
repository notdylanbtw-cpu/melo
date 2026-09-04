import { readFileSync } from "node:fs";
import path from "node:path";

type TwilioPlatform = {
  accountSid: string;
  authToken: string;
};

function readJson(file: string): Record<string, string> {
  try {
    const raw = JSON.parse(readFileSync(file, "utf8")) as Record<string, unknown>;
    return Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, String(v ?? "").trim()]));
  } catch {
    return {};
  }
}

function fileTwilio(): TwilioPlatform | null {
  const fromData = readJson(path.join(process.cwd(), ".data/twilio.json"));
  const sid = fromData.accountSid || fromData.TWILIO_ACCOUNT_SID || "";
  const token = fromData.authToken || fromData.TWILIO_AUTH_TOKEN || "";
  if (sid.startsWith("AC") && token) return { accountSid: sid, authToken: token };
  return null;
}

/** Melo’s carrier — never sent to the browser. */
export function platformTwilio(): TwilioPlatform | null {
  const sid = (process.env.TWILIO_ACCOUNT_SID ?? "").trim();
  const token = (process.env.TWILIO_AUTH_TOKEN ?? "").trim();
  if (sid.startsWith("AC") && token) return { accountSid: sid, authToken: token };
  return fileTwilio();
}

export function platformReady() {
  return Boolean(platformTwilio());
}
