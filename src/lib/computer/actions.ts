import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { bootComputer, listComputerLog, logComputer, setComputer } from "./db";
import { ensureComputerDaemon, tickOffice } from "./engine";
import { deleteSkill, listSkills, markSkillRun, saveSkill, setSkillStatus } from "./skills";
import type { ComputerSkill, SkillApprovals, SkillStep } from "./skill-types";

export const getComputer = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    ensureComputerDaemon();
    const computer = await bootComputer(context.userId);
    const log = await listComputerLog(context.userId, 50);
    let skills: ComputerSkill[] = [];
    try {
      skills = await listSkills(context.userId);
    } catch {
      skills = [];
    }
    return { computer, log, skills };
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
    let skills: ComputerSkill[] = [];
    try {
      skills = await listSkills(context.userId);
    } catch {
      skills = [];
    }
    return { jobs, computer, log, skills };
  });

export const saveComputerSkill = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id?: string; name: string; goal: string; status?: ComputerSkill["status"]; steps: SkillStep[]; approvals?: SkillApprovals; schedule?: ComputerSkill["schedule"] }) => input)
  .handler(async ({ context, data }) => {
    const skill = await saveSkill(context.userId, data);
    await logComputer({
      userId: context.userId,
      kind: "skill",
      agent: "helix",
      text: data.id ? `Updated task “${skill.name}”` : `Learned task “${skill.name}” · ${skill.steps.length} steps`,
    });
    await setComputer(context.userId, { currentTask: `Knows “${skill.name}”` });
    const skills = await listSkills(context.userId);
    return { skill, skills };
  });

export const setComputerSkillStatus = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id: string; status: ComputerSkill["status"] }) => input)
  .handler(async ({ context, data }) => {
    await setSkillStatus(context.userId, data.id, data.status);
    const skills = await listSkills(context.userId);
    return { skills };
  });

export const removeComputerSkill = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id: string }) => input)
  .handler(async ({ context, data }) => {
    await deleteSkill(context.userId, data.id);
    const skills = await listSkills(context.userId);
    return { skills };
  });

export const runComputerSkill = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id: string }) => input)
  .handler(async ({ context, data }) => {
    const skills = await listSkills(context.userId);
    const skill = skills.find((s) => s.id === data.id);
    if (!skill) return { ok: false as const, skills, skill: null };
    await markSkillRun(context.userId, skill.id);
    await logComputer({
      userId: context.userId,
      kind: "skill",
      agent: "helix",
      text: `Running “${skill.name}” on this computer`,
      detail: skill.steps.map((s) => s.label).join(" → "),
    });
    await setComputer(context.userId, { currentTask: `Running “${skill.name}”`, bumpJobs: 1 });
    const next = await listSkills(context.userId);
    const computer = await bootComputer(context.userId);
    const log = await listComputerLog(context.userId, 50);
    return { ok: true as const, skill, skills: next, computer, log };
  });
