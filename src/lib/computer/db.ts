import { randomUUID } from "node:crypto";
import { getSql } from "@/lib/db";

export type ComputerRow = {
  userId: string;
  status: "online" | "paused";
  region: string;
  mode: "always" | "hours";
  actAfterHours: boolean;
  lastTickAt: string | null;
  startedAt: string;
  jobsDone: number;
  currentTask: string;
};

export type ComputerLog = {
  id: string;
  at: string;
  kind: string;
  agent: string;
  text: string;
  detail: string;
};

function asBool(v: unknown) {
  return v === true || v === "t" || v === "true" || v === 1 || v === "1";
}

export async function bootComputer(userId: string): Promise<ComputerRow> {
  const sql = await getSql();
  const existing = await sql<{
    user_id: string;
    status: string;
    region: string;
    mode: string;
    act_after_hours: boolean | string | number;
    last_tick_at: string | null;
    started_at: string;
    jobs_done: number | string;
    current_task: string;
  }>`select * from computer where user_id = ${userId} limit 1`;
  if (!existing[0]) {
    await sql`
      insert into computer (user_id, status, region, mode, act_after_hours, current_task)
      values (${userId}, 'online', 'ap-sydney-1', 'always', true, 'Watching the desk')
    `;
    return bootComputer(userId);
  }
  const r = existing[0];
  return {
    userId: r.user_id,
    status: r.status === "paused" ? "paused" : "online",
    region: r.region,
    mode: r.mode === "hours" ? "hours" : "always",
    actAfterHours: asBool(r.act_after_hours),
    lastTickAt: r.last_tick_at,
    startedAt: r.started_at,
    jobsDone: Number(r.jobs_done ?? 0),
    currentTask: r.current_task || "Watching the desk",
  };
}

export async function setComputer(userId: string, patch: { status?: "online" | "paused"; mode?: "always" | "hours"; actAfterHours?: boolean; currentTask?: string; bumpJobs?: number }) {
  const sql = await getSql();
  await bootComputer(userId);
  if (patch.status) await sql`update computer set status = ${patch.status} where user_id = ${userId}`;
  if (patch.mode) await sql`update computer set mode = ${patch.mode} where user_id = ${userId}`;
  if (patch.actAfterHours !== undefined) await sql`update computer set act_after_hours = ${patch.actAfterHours} where user_id = ${userId}`;
  if (patch.currentTask) await sql`update computer set current_task = ${patch.currentTask} where user_id = ${userId}`;
  if (patch.bumpJobs) await sql`update computer set jobs_done = jobs_done + ${patch.bumpJobs}, last_tick_at = now() where user_id = ${userId}`;
  else await sql`update computer set last_tick_at = now() where user_id = ${userId}`;
  return bootComputer(userId);
}

export async function logComputer(input: { userId: string; kind: string; agent?: string; text: string; detail?: string }) {
  const sql = await getSql();
  const id = randomUUID();
  await sql`
    insert into computer_log (id, user_id, kind, agent, text, detail)
    values (${id}, ${input.userId}, ${input.kind}, ${input.agent ?? "helix"}, ${input.text}, ${input.detail ?? ""})
  `;
  return id;
}

export async function listComputerLog(userId: string, limit = 40): Promise<ComputerLog[]> {
  const sql = await getSql();
  const rows = await sql<{
    id: string;
    at: string;
    kind: string;
    agent: string;
    text: string;
    detail: string;
  }>`select id, at, kind, agent, text, detail from computer_log where user_id = ${userId} order by at desc limit ${limit}`;
  return rows.map((r) => ({ id: r.id, at: r.at, kind: r.kind, agent: r.agent, text: r.text, detail: r.detail }));
}

export async function recentLogHas(userId: string, needle: string, withinMinutes: number) {
  const sql = await getSql();
  const since = new Date(Date.now() - withinMinutes * 60_000).toISOString();
  const rows = await sql<{ n: number }>`
    select count(*)::int as n from computer_log
    where user_id = ${userId}
      and text like ${"%" + needle + "%"}
      and at > ${since}
  `;
  return Number(rows[0]?.n ?? 0) > 0;
}

export async function onboardedUserIds() {
  const sql = await getSql();
  const rows = await sql<{ user_id: string }>`select user_id from accounts where onboarding_complete = true`;
  return rows.map((r) => r.user_id);
}
