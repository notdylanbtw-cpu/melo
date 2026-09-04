import { createFileRoute } from "@tanstack/react-router";
import { randomBytes } from "node:crypto";
import { makeSignature } from "better-auth/crypto";
import { publicOrigin } from "@/lib/channels/origin";
import { SESSION_TOKEN_COOKIE, auth } from "@/lib/auth/server";
import { platformGoogle } from "@/lib/platform";
import { getSql } from "@/lib/db";

function creds() {
  const g = platformGoogle();
  return {
    clientId: g?.clientId || (process.env.GOOGLE_CLIENT_ID ?? "").trim(),
    secret: g?.clientSecret || (process.env.GOOGLE_CLIENT_SECRET ?? "").trim(),
  };
}

function safeNext(raw: string | null) {
  const n = (raw || "/app").trim() || "/app";
  if (!n.startsWith("/") || n.startsWith("//")) return "/app";
  return n;
}

export const Route = createFileRoute("/api/oauth/google-login")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const origin = publicOrigin(request);
        const redirect = `${origin}/api/oauth/google-login`;
        const { clientId, secret } = creds();
        const loginFail = `${origin}/login?google=failed`;

        if (!url.searchParams.get("code")) {
          if (!clientId || !secret) {
            return Response.redirect(`${origin}/login?google=setup`, 302);
          }
          const next = safeNext(url.searchParams.get("next"));
          const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
          authUrl.searchParams.set("client_id", clientId);
          authUrl.searchParams.set("redirect_uri", redirect);
          authUrl.searchParams.set("response_type", "code");
          authUrl.searchParams.set("scope", "openid email profile");
          authUrl.searchParams.set("prompt", "select_account");
          authUrl.searchParams.set("state", next);
          return Response.redirect(authUrl.toString(), 302);
        }

        if (!clientId || !secret) return Response.redirect(loginFail, 302);
        const code = url.searchParams.get("code") || "";
        const next = safeNext(url.searchParams.get("state"));
        const tok = (await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            code,
            client_id: clientId,
            client_secret: secret,
            redirect_uri: redirect,
            grant_type: "authorization_code",
          }),
        }).then((r) => r.json())) as { access_token?: string };
        if (!tok.access_token) return Response.redirect(loginFail, 302);

        const profile = (await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
          headers: { authorization: `Bearer ${tok.access_token}` },
        }).then((r) => r.json())) as {
          id?: string;
          email?: string;
          name?: string;
          picture?: string;
          verified_email?: boolean;
        };
        const email = profile.email?.trim().toLowerCase();
        if (!email) return Response.redirect(loginFail, 302);

        const sql = await getSql();
        const existing = await sql.query<{ id: string }>(`select id from "user" where email = $1 limit 1`, [email]);
        let userId = existing[0]?.id;
        const now = new Date();
        if (!userId) {
          userId = randomBytes(16).toString("hex");
          await sql.query(
            `insert into "user" (id, name, email, "emailVerified", image, "createdAt", "updatedAt") values ($1,$2,$3,$4,$5,$6,$6)`,
            [userId, profile.name || email, email, Boolean(profile.verified_email), profile.picture || null, now],
          );
        }
        const accountId = profile.id || email;
        const acc = await sql.query<{ id: string }>(
          `select id from "account" where "providerId" = 'google' and "accountId" = $1 limit 1`,
          [accountId],
        );
        if (!acc[0]) {
          await sql.query(
            `insert into "account" (id, "accountId", "providerId", "userId", "createdAt", "updatedAt") values ($1,$2,'google',$3,$4,$4)`,
            [randomBytes(16).toString("hex"), accountId, userId, now],
          );
        }

        const sessionId = randomBytes(16).toString("hex");
        const token = randomBytes(32).toString("hex");
        const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await sql.query(
          `insert into "session" (id, "expiresAt", token, "createdAt", "updatedAt", "userId") values ($1,$2,$3,$4,$4,$5)`,
          [sessionId, expires, token, now, userId],
        );

        const ctx = await auth.$context;
        const sig = await makeSignature(token, ctx.secret);
        const cookieVal = `${token}.${sig}`;
        const headers = new Headers();
        headers.set("Location", `${origin}${next}`);
        headers.append(
          "Set-Cookie",
          `${SESSION_TOKEN_COOKIE}=${cookieVal}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}`,
        );
        return new Response(null, { status: 302, headers });
      },
    },
  },
});
