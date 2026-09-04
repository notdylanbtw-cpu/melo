import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import type { SkillStep } from "./skill-types";

export const bootMeloDrive = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { brand?: string; site?: string }) => input)
  .handler(async ({ context, data }) => {
    const { bootDrive } = await import("./runtime");
    return bootDrive(context.userId, data);
  });

export const getMeloFrame = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { frameJpeg } = await import("./runtime");
    return frameJpeg(context.userId);
  });

export const driveGoto = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { url: string }) => input)
  .handler(async ({ context, data }) => {
    const { gotoUrl } = await import("./runtime");
    return gotoUrl(context.userId, data.url);
  });

export const driveClick = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { x: number; y: number; w: number; h: number }) => input)
  .handler(async ({ context, data }) => {
    const { clickAt } = await import("./runtime");
    return clickAt(context.userId, data.x, data.y, data.w, data.h);
  });

export const driveType = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { text: string; secret?: boolean }) => input)
  .handler(async ({ context, data }) => {
    const { typeText } = await import("./runtime");
    return typeText(context.userId, data.text, Boolean(data.secret));
  });

export const driveKey = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { key: string }) => input)
  .handler(async ({ context, data }) => {
    const { pressKey } = await import("./runtime");
    return pressKey(context.userId, data.key);
  });

export const driveHome = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { brand?: string; site?: string }) => input)
  .handler(async ({ context, data }) => {
    const { goHome } = await import("./runtime");
    return goHome(context.userId, data);
  });

export const driveStartTeach = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { startTeach } = await import("./runtime");
    return startTeach(context.userId);
  });

export const driveStopTeach = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { stopTeach } = await import("./runtime");
    return stopTeach(context.userId);
  });

export const driveClearHold = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { clearHold } = await import("./runtime");
    return clearHold(context.userId);
  });

export const drivePlay = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { steps: SkillStep[]; brand?: string; site?: string }) => input)
  .handler(async ({ context, data }) => {
    const { playSteps } = await import("./runtime");
    return playSteps(context.userId, data.steps, { brand: data.brand, site: data.site });
  });
