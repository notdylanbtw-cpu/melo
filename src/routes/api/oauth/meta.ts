import { createFileRoute } from "@tanstack/react-router";
import { publicOrigin } from "@/lib/channels/origin";

const SCOPES: Record<string, string> = {
  facebook: "pages_show_list,pages_messaging,pages_manage_metadata",
  messenger: "pages_show_list,pages_messaging,pages_manage_metadata",
  instagram: "instagram_basic,instagram_manage_messages,pages_show_list,pages_messaging",
  whatsapp: "whatsapp_business_management,whatsapp_business_messaging,business_management",
};

export const Route = createFileRoute("/api/oauth/meta")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const origin = publicOrigin(request);
        const { platformMeta } = await import("@/lib/platform");
        const m = platformMeta();
        const appId = m?.appId || (process.env.META_APP_ID ?? "").trim();
        const secret = m?.appSecret || (process.env.META_APP_SECRET ?? "").trim();
        const redirect = `${origin}/api/oauth/meta`;

        if (url.searchParams.get("start")) {
          const kind = url.searchParams.get("start") || "messenger";
          if (!appId) {
            return Response.redirect(`${origin}/app/connect?meta=setup&app=${encodeURIComponent(kind)}`, 302);
          }
          const auth = new URL("https://www.facebook.com/v21.0/dialog/oauth");
          auth.searchParams.set("client_id", appId);
          auth.searchParams.set("redirect_uri", redirect);
          auth.searchParams.set("state", kind);
          auth.searchParams.set("scope", SCOPES[kind] || SCOPES.messenger!);
          auth.searchParams.set("response_type", "code");
          return Response.redirect(auth.toString(), 302);
        }

        const code = url.searchParams.get("code");
        const kind = url.searchParams.get("state") || "messenger";
        if (!code || !appId || !secret) {
          return Response.redirect(`${origin}/app/connect?meta=failed`, 302);
        }
        const tokenUrl = new URL("https://graph.facebook.com/v21.0/oauth/access_token");
        tokenUrl.searchParams.set("client_id", appId);
        tokenUrl.searchParams.set("client_secret", secret);
        tokenUrl.searchParams.set("redirect_uri", redirect);
        tokenUrl.searchParams.set("code", code);
        const tok = (await fetch(tokenUrl).then((r) => r.json())) as { access_token?: string };
        if (!tok.access_token) {
          return Response.redirect(`${origin}/app/connect?meta=failed`, 302);
        }
        const { upsertChannel } = await import("@/lib/channels/db");
        const { requireUserId } = await import("@/lib/auth/verify.server");
        try {
          const userId = await requireUserId();
          await upsertChannel({
            userId,
            kind: kind as "whatsapp" | "messenger" | "facebook" | "instagram",
            status: "connected",
            externalId: "meta",
            credentials: { access_token: tok.access_token },
            detail: "Connected via Facebook",
          });
        } catch {
          return Response.redirect(`${origin}/app/connect?meta=failed`, 302);
        }
        return Response.redirect(`${origin}/app/connect?meta=ok`, 302);
      },
    },
  },
});
