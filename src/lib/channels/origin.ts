export function publicOrigin(request: Request) {
  const xf = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const proto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || (xf ? "https" : "http");
  if (xf) return `${proto}://${xf}`;
  try {
    return new URL(request.url).origin;
  } catch {
    return "http://127.0.0.1:8080";
  }
}

export function slugify(name: string) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 28) || "office";
  return `${base}-${Math.random().toString(36).slice(2, 6)}`;
}
