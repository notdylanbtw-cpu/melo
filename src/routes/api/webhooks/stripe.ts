import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { markAccountPaid } from "@/lib/account";

export const Route = createFileRoute("/api/webhooks/stripe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.text();
        const sig = request.headers.get("stripe-signature") || "";
        const secret = webhookSecret();
        if (secret && !verify(raw, sig, secret)) {
          return new Response("bad signature", { status: 400 });
        }
        const event = JSON.parse(raw) as {
          type?: string;
          data?: { object?: Record<string, unknown> };
        };
        const obj = event.data?.object ?? {};
        if (event.type === "checkout.session.completed") {
          const userId = String(obj.client_reference_id || "");
          const meta = (obj.metadata ?? {}) as Record<string, string>;
          const plan = meta.plan || meta.plan_id || "growth";
          if (userId) {
            const trial = plan === "growth" ? "trial" : "active";
            await markAccountPaid(userId, plan, trial);
          }
        }
        if (event.type === "customer.subscription.deleted") {
          const meta = (obj.metadata ?? {}) as Record<string, string>;
          const userId = meta.user_id || "";
          if (userId) await markAccountPaid(userId, "starter", "canceled");
        }
        return new Response("ok");
      },
    },
  },
});

function webhookSecret() {
  const env = (process.env.STRIPE_WEBHOOK_SECRET ?? "").trim();
  if (env) return env;
  try {
    const raw = JSON.parse(readFileSync(path.join(process.cwd(), ".data/stripe.json"), "utf8")) as { webhookSecret?: string };
    return raw.webhookSecret?.trim() || "";
  } catch {
    return "";
  }
}

function verify(payload: string, header: string, secret: string) {
  const parts = Object.fromEntries(
    header.split(",").map((p) => {
      const i = p.indexOf("=");
      return [p.slice(0, i).trim(), p.slice(i + 1).trim()];
    }),
  );
  const t = parts.t;
  const v1 = parts.v1;
  if (!t || !v1) return false;
  const expected = createHmac("sha256", secret).update(`${t}.${payload}`).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(v1));
  } catch {
    return false;
  }
}
