import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "path";

type TwilioPlatform = {
  accountSid: string;
  authToken: string;
};

export type PlatformKeys = {
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  META_APP_ID?: string;
  META_APP_SECRET?: string;
  TWILIO_ACCOUNT_SID?: string;
  TWILIO_AUTH_TOKEN?: string;
  MICROSOFT_CLIENT_ID?: string;
  MICROSOFT_CLIENT_SECRET?: string;
  STRIPE_CLIENT_ID?: string;
  STRIPE_SECRET_KEY?: string;
  XERO_CLIENT_ID?: string;
  XERO_CLIENT_SECRET?: string;
  SLACK_CLIENT_ID?: string;
  SLACK_CLIENT_SECRET?: string;
};

function dataFile(name: string) {
  return path.join(process.cwd(), ".data", name);
}

function readJson(file: string): Record<string, string> {
  try {
    const raw = JSON.parse(readFileSync(file, "utf8")) as Record<string, unknown>;
    return Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, String(v ?? "").trim()]));
  } catch {
    return {};
  }
}

function env(key: string) {
  return (process.env[key] ?? "").trim();
}

function fileTwilio(): TwilioPlatform | null {
  const fromData = readJson(dataFile("twilio.json"));
  const sid = fromData.accountSid || fromData.TWILIO_ACCOUNT_SID || "";
  const token = fromData.authToken || fromData.TWILIO_AUTH_TOKEN || "";
  if (sid.startsWith("AC") && token) return { accountSid: sid, authToken: token };
  return null;
}

export function loadPlatformKeys(): PlatformKeys {
  return { ...readJson(dataFile("platform.json")) };
}

export function savePlatformKeys(next: PlatformKeys) {
  mkdirSync(path.join(process.cwd(), ".data"), { recursive: true });
  const merged = { ...loadPlatformKeys(), ...next };
  writeFileSync(dataFile("platform.json"), JSON.stringify(merged, null, 2));
  if (merged.TWILIO_ACCOUNT_SID && merged.TWILIO_AUTH_TOKEN) {
    writeFileSync(
      dataFile("twilio.json"),
      JSON.stringify({ accountSid: merged.TWILIO_ACCOUNT_SID, authToken: merged.TWILIO_AUTH_TOKEN }, null, 2),
    );
  }
  return merged;
}

function pick(key: keyof PlatformKeys) {
  return env(key) || loadPlatformKeys()[key] || "";
}

/** Melo’s carrier — never sent to the browser. */
export function platformTwilio(): TwilioPlatform | null {
  const sid = pick("TWILIO_ACCOUNT_SID");
  const token = pick("TWILIO_AUTH_TOKEN");
  if (sid.startsWith("AC") && token) return { accountSid: sid, authToken: token };
  return fileTwilio();
}

export function platformReady() {
  return Boolean(platformTwilio());
}

export function platformGoogle() {
  const clientId = pick("GOOGLE_CLIENT_ID");
  const clientSecret = pick("GOOGLE_CLIENT_SECRET");
  return clientId && clientSecret ? { clientId, clientSecret } : null;
}

export function platformMeta() {
  const appId = pick("META_APP_ID");
  const appSecret = pick("META_APP_SECRET");
  return appId && appSecret ? { appId, appSecret } : null;
}

export function platformMicrosoft() {
  const clientId = pick("MICROSOFT_CLIENT_ID");
  const clientSecret = pick("MICROSOFT_CLIENT_SECRET");
  return clientId && clientSecret ? { clientId, clientSecret } : null;
}

export function platformStripe() {
  const clientId = pick("STRIPE_CLIENT_ID");
  const secret = pick("STRIPE_SECRET_KEY");
  return clientId && secret ? { clientId, secret } : null;
}

export function platformXero() {
  const clientId = pick("XERO_CLIENT_ID");
  const clientSecret = pick("XERO_CLIENT_SECRET");
  return clientId && clientSecret ? { clientId, clientSecret } : null;
}

export function platformSlack() {
  const clientId = pick("SLACK_CLIENT_ID");
  const clientSecret = pick("SLACK_CLIENT_SECRET");
  return clientId && clientSecret ? { clientId, clientSecret } : null;
}

export function oauthReady(vendor: "google" | "meta" | "microsoft" | "stripe" | "xero" | "slack") {
  if (vendor === "google") return Boolean(platformGoogle());
  if (vendor === "meta") return Boolean(platformMeta());
  if (vendor === "microsoft") return Boolean(platformMicrosoft());
  if (vendor === "stripe") return Boolean(platformStripe());
  if (vendor === "xero") return Boolean(platformXero());
  return Boolean(platformSlack());
}

export function platformStatus() {
  return {
    google: Boolean(platformGoogle()),
    meta: Boolean(platformMeta()),
    twilio: platformReady(),
    microsoft: Boolean(platformMicrosoft()),
    stripe: Boolean(platformStripe()),
    xero: Boolean(platformXero()),
    slack: Boolean(platformSlack()),
  };
}
