export type SkillStepKind = "open" | "click" | "type" | "wait" | "secret" | "result";

export type SkillStep = {
  id: string;
  kind: SkillStepKind;
  label: string;
  url?: string;
  secret?: boolean;
  at: string;
  x?: number;
  y?: number;
  text?: string;
};

export type SkillApprovals = {
  send: boolean;
  pay: boolean;
  delete: boolean;
};

export type ComputerSkill = {
  id: string;
  name: string;
  goal: string;
  status: "draft" | "ready" | "paused";
  steps: SkillStep[];
  approvals: SkillApprovals;
  schedule: "manual" | "daily";
  lastRunAt: string | null;
  createdAt: string;
};

export type DriveStatus = {
  url: string;
  title: string;
  teaching: boolean;
  running: boolean;
  hold: string | null;
  steps: SkillStep[];
  ready: boolean;
  error?: string;
};

