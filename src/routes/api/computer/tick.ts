import { createFileRoute } from "@tanstack/react-router";
import { ensureComputerDaemon, tickAllOffices } from "@/lib/computer/engine";

export const Route = createFileRoute("/api/computer/tick")({
  server: {
    handlers: {
      GET: handle,
      POST: handle,
    },
  },
});

async function handle({ request }: { request: Request }) {
  const secret = (process.env.CRON_SECRET ?? "").trim();
  if (secret) {
    const auth = request.headers.get("authorization") || "";
    const url = new URL(request.url);
    const token = url.searchParams.get("token") || "";
    if (auth !== `Bearer ${secret}` && token !== secret) {
      return new Response(JSON.stringify({ ok: false, error: "forbidden" }), { status: 401, headers: { "content-type": "application/json" } });
    }
  }
  ensureComputerDaemon();
  const result = await tickAllOffices();
  return Response.json({ ok: true, ...result, at: new Date().toISOString() });
}
