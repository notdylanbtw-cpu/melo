import { randomUUID } from "node:crypto";
import { getSql } from "@/lib/db";
import type { ComputerSkill, SkillApprovals, SkillStep } from "./skill-types";

export type { ComputerSkill, SkillApprovals, SkillStep, SkillStepKind } from "./skill-types";

function parseSteps(raw: string): SkillStep[] {
  try {
    const v = JSON.parse(raw) as SkillStep[];
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function parseApprovals(raw: string): SkillApprovals {
  try {
    const v = JSON.parse(raw) as Partial<SkillApprovals>;
    return { send: v.send !== false, pay: Boolean(v.pay), delete: Boolean(v.delete) };
  } catch {
    return { send: true, pay: false, delete: false };
  }
}

export async function listSkills(userId: string): Promise<ComputerSkill[]> {
  const sql = await getSql();
  const rows = await sql<{
    id: string;
    name: string;
    goal: string;
    status: string;
    steps: string;
    approvals: string;
    schedule: string;
    last_run_at: string | null;
    created_at: string;
  }>`select * from computer_skill where user_id = ${userId} order by created_at desc`;
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    goal: r.goal,
    status: r.status === "ready" || r.status === "paused" ? r.status : "draft",
    steps: parseSteps(r.steps),
    approvals: parseApprovals(r.approvals),
    schedule: r.schedule === "daily" ? "daily" : "manual",
    lastRunAt: r.last_run_at,
    createdAt: r.created_at,
  }));
}

export async function saveSkill(
  userId: string,
  input: {
    id?: string;
    name: string;
    goal: string;
    status?: ComputerSkill["status"];
    steps: SkillStep[];
    approvals?: SkillApprovals;
    schedule?: ComputerSkill["schedule"];
  },
): Promise<ComputerSkill> {
  const sql = await getSql();
  const id = input.id || randomUUID();
  const status = input.status ?? (input.steps.length ? "draft" : "draft");
  const approvals = JSON.stringify(input.approvals ?? { send: true, pay: false, delete: false });
  const schedule = input.schedule ?? "manual";
  await sql`
    insert into computer_skill (id, user_id, name, goal, status, steps, approvals, schedule)
    values (${id}, ${userId}, ${input.name}, ${input.goal}, ${status}, ${JSON.stringify(input.steps)}, ${approvals}, ${schedule})
    on conflict (id) do update set
      name = excluded.name,
      goal = excluded.goal,
      status = excluded.status,
      steps = excluded.steps,
      approvals = excluded.approvals,
      schedule = excluded.schedule
  `;
  const all = await listSkills(userId);
  return all.find((s) => s.id === id)!;
}

export async function setSkillStatus(userId: string, id: string, status: ComputerSkill["status"]) {
  const sql = await getSql();
  await sql`update computer_skill set status = ${status} where id = ${id} and user_id = ${userId}`;
}

export async function markSkillRun(userId: string, id: string) {
  const sql = await getSql();
  await sql`update computer_skill set last_run_at = now() where id = ${id} and user_id = ${userId}`;
}

export async function deleteSkill(userId: string, id: string) {
  const sql = await getSql();
  await sql`delete from computer_skill where id = ${id} and user_id = ${userId}`;
}

export async function dueDailySkills(userId: string): Promise<ComputerSkill[]> {
  const all = await listSkills(userId);
  const day = 20 * 36e5;
  return all.filter((s) => {
    if (s.status !== "ready" || s.schedule !== "daily" || s.steps.length === 0) return false;
    if (!s.lastRunAt) return true;
    return Date.now() - new Date(s.lastRunAt).getTime() > day;
  });
}
