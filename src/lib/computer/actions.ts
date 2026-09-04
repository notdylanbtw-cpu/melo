import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { bootComputer, listComputerLog, setComputer } from "./db";
import { ensureComputerDaemon, tickOffice } from "./engine";

export const getComputer = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    ensureComputerDaemon();
    const computer = await bootComputer(context.userId);
    const log = await listComputerLog(context.userId, 50);
    return { computer, log };
  });

export const updateComputer = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { status?: "online" | "paused"; mode?: "always" | "hours"; actAfterHours?: boolean }) => input)
  .handler(async ({ context, data }) => {
    const computer = await setComputer(context.userId, data);
    return { computer };
  });

export const runComputerNow = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    ensureComputerDaemon();
    const jobs = await tickOffice(context.userId);
    const computer = await bootComputer(context.userId);
    const log = await listComputerLog(context.userId, 50);
    return { jobs, computer, log };
  });
