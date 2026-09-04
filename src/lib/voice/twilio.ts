export type TwilioCreds = {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
  phoneSid?: string;
  ownerPhone?: string;
};

export function xmlEscape(s: string) {
  return s
    .replaceAll("&", "&" + "amp;")
    .replaceAll("<", "&" + "lt;")
    .replaceAll(">", "&" + "gt;")
    .replaceAll('"', "&" + "quot;")
    .replaceAll("'", "&" + "apos;");
}

export function twiml(body: string) {
  return `<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`;
}

export function twimlResponse(body: string) {
  return new Response(twiml(body), {
    status: 200,
    headers: { "content-type": "text/xml; charset=utf-8" },
  });
}

export function digits(n: string) {
  const d = n.replace(/[^\d+]/g, "");
  if (d.startsWith("+")) return d;
  if (d.startsWith("61")) return `+${d}`;
  if (d.startsWith("0") && d.length >= 9) return `+61${d.slice(1)}`;
  return d;
}

function authHeader(sid: string, token: string) {
  return `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`;
}

export async function twilioFetch(creds: TwilioCreds, path: string, body?: Record<string, string>) {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${creds.accountSid}${path}`;
  const res = await fetch(url, {
    method: body ? "POST" : "GET",
    headers: {
      authorization: authHeader(creds.accountSid, creds.authToken),
      ...(body ? { "content-type": "application/x-www-form-urlencoded" } : {}),
    },
    body: body ? new URLSearchParams(body) : undefined,
  });
  const text = await res.text();
  let json: Record<string, unknown> = {};
  try {
    json = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    const msg = typeof json.message === "string" ? json.message : text.slice(0, 240);
    throw new Error(msg || `Twilio ${res.status}`);
  }
  return json;
}

export async function verifyTwilio(creds: TwilioCreds) {
  const account = await twilioFetch(creds, ".json");
  const list = await twilioFetch(creds, "/IncomingPhoneNumbers.json?PageSize=50");
  const incoming = (Array.isArray(list.incoming_phone_numbers) ? list.incoming_phone_numbers : []) as {
    sid?: string;
    phone_number?: string;
    friendly_name?: string;
  }[];
  const want = digits(creds.phoneNumber);
  const match =
    incoming.find((n) => digits(n.phone_number ?? "") === want) ??
    incoming.find((n) => (n.phone_number ?? "").includes(want.replace("+", ""))) ??
    incoming[0];
  return {
    friendlyName: String(account.friendly_name ?? "Twilio"),
    status: String(account.status ?? ""),
    numbers: incoming.map((n) => ({
      sid: n.sid ?? "",
      phone: n.phone_number ?? "",
      name: n.friendly_name ?? "",
    })),
    matched: match ? { sid: match.sid ?? "", phone: match.phone_number ?? "" } : null,
  };
}

export async function pointNumberAtMelo(creds: TwilioCreds, origin: string, phoneSid: string) {
  return twilioFetch(creds, `/IncomingPhoneNumbers/${phoneSid}.json`, {
    VoiceUrl: `${origin}/api/voice/inbound`,
    VoiceMethod: "POST",
    StatusCallback: `${origin}/api/voice/status`,
    StatusCallbackMethod: "POST",
    StatusCallbackEvent: "initiated ringing answered completed",
  });
}

export async function hangupCall(creds: TwilioCreds, callSid: string) {
  return twilioFetch(creds, `/Calls/${callSid}.json`, { Status: "completed" });
}

export async function redirectCall(creds: TwilioCreds, callSid: string, url: string) {
  return twilioFetch(creds, `/Calls/${callSid}.json`, { Url: url, Method: "POST" });
}

export async function placeCall(creds: TwilioCreds, to: string, twimlXml: string) {
  return twilioFetch(creds, "/Calls.json", {
    To: digits(to),
    From: digits(creds.phoneNumber),
    Twiml: twimlXml,
  });
}

export async function sendSms(creds: TwilioCreds, to: string, body: string) {
  return twilioFetch(creds, "/Messages.json", {
    To: digits(to),
    From: digits(creds.phoneNumber),
    Body: body,
  });
}

export function sayVoice(name: string) {
  if (name === "Jack") return "Polly.Russell";
  return "Polly.Nicole";
}
