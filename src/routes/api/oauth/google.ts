import { createFileRoute } from "@tanstack/react-router";
import { publicOrigin } from "@/lib/channels/origin";

const SCOPES: Record<string, string> = {
  gmail: "openid email profile https://www.googleapis.com/auth/gmail.modify",
  gcal: "openid email profile https://www.googleapis.com/auth/calendar",
  gbp: "openid email profile https://www.googleapis.com/auth/business.manage",
};

export const Route = createFileRoute("/api/oauth/google")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const origin = publicOrigin(request);
        const { platformGoogle } = await import("@/lib/platform");
        const g = platformGoogle();
        const clientId = g?.clientId || (process.env.GOOGLE_CLIENT_ID ?? "").trim();
        const secret = g?.clientSecret || (process.env.GOOGLE_CLIENT_SECRET ?? "").trim();
        const redirect = `${origin}/api/oauth/google`;
        const start = url.searchParams.get("start") || "";

        if (start) {
          if (!clientId) {
            return Response.redirect(`${origin}/app/connect?google=setup&app=${encodeURIComponent(start)}`, 302);
          }
          const auth = new URL("https://accounts.google.com/o/oauth2/v2/auth");
          auth.searchParams.set("client_id", clientId);
          auth.searchParams.set("redirect_uri", redirect);
          auth.searchParams.set("response_type", "code");
          auth.searchParams.set("scope", SCOPES[start] || SCOPES.gmail!);
          auth.searchParams.set("access_type", "offline");
          auth.searchParams.set("prompt", "consent select_account");
          auth.searchParams.set("state", start);
          return Response.redirect(auth.toString(), 302);
        }

        const code = url.searchParams.get("code");
        const app = url.searchParams.get("state") || "gmail";
        if (!code || !clientId || !secret) {
          return Response.redirect(`${origin}/app/connect?google=failed`, 302);
        }
        const body = new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: secret,
          redirect_uri: redirect,
          grant_type: "authorization_code",
        });
        const tok = (await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body,
        }).then((r) => r.json())) as { access_token?: string; refresh_token?: string };
        if (!tok.access_token) {
          return Response.redirect(`${origin}/app/connect?google=failed`, 302);
        }
        try {
          const { requireUserId } = await import("@/lib/auth/verify.server");
          const { upsertChannel } = await import("@/lib/channels/db");
          const userId = await requireUserId();
          const kind = (["gmail", "gcal", "gbp"].includes(app) ? app : "gmail") as "gmail" | "gcal" | "gbp";
          await upsertChannel({
            userId,
            kind,
            status: "connected",
            externalId: app,
            credentials: {
              access_token: tok.access_token,
              refresh_token: tok.refresh_token ?? "",
              app,
            },
            detail: `Google · ${app}`,
          });
        } catch {
          return Response.redirect(`${origin}/app/connect?google=failed`, 302);
        }
        return Response.redirect(`${origin}/app/connect?google=ok&app=${encodeURIComponent(app)}`, 302);
      },
    },
  },
});
