import { MELO_HOST, MELO_URL, MELO_WWW } from "@/lib/brand";

export function publicOrigin(request: Request) {
  const xf = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  let host = xf;
  let proto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || (xf ? "https" : "http");
  if (!host) {
    try {
      const u = new URL(request.url);
      host = u.host;
      proto = u.protocol.replace(":", "");
    } catch {
      return "http://127.0.0.1:8080";
    }
  }
  const h = host.toLowerCase();
  if (h === MELO_HOST || h === MELO_WWW || h.endsWith(".vercel.app")) return MELO_URL;
  return `${proto}://${host}`;
}

export function slugify(name: string) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 28) || "office";
  return `${base}-${Math.random().toString(36).slice(2, 6)}`;
}
