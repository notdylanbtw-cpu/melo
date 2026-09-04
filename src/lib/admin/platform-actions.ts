import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";

async function assertHq(userId: string) {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  const rows = await sql<{ is_hq: boolean | string | number }>`select is_hq from accounts where user_id = ${userId} limit 1`;
  const v = rows[0]?.is_hq;
  const ok = v === true || v === "t" || v === "true" || v === 1 || v === "1";
  if (!ok) throw new Error("HQ only");
}

export const getPlatformStatus = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await assertHq(context.userId);
    const { platformStatus, loadPlatformKeys } = await import("@/lib/platform");
    const keys = loadPlatformKeys();
    const masked = Object.fromEntries(
      Object.entries(keys).map(([k, v]) => [k, v ? `${v.slice(0, 6)}…${v.slice(-4)}` : ""]),
    );
    return { ready: platformStatus(), masked };
  });

export const savePlatform = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: Record<string, string>) => input)
  .handler(async ({ context, data }) => {
    await assertHq(context.userId);
    const { savePlatformKeys, platformStatus } = await import("@/lib/platform");
    const cleaned = Object.fromEntries(
      Object.entries(data)
        .map(([k, v]) => [k, v.trim()] as const)
        .filter(([, v]) => v && !v.includes("…")),
    );
    savePlatformKeys(cleaned);
    return { ok: true as const, ready: platformStatus() };
  });
