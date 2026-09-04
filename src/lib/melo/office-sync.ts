import type { MeloData } from "./types";

export const OFFICE_KEYS = [
  "workspace",
  "staff",
  "customers",
  "agents",
  "marketplace",
  "conversations",
  "jobs",
  "holds",
  "knowledge",
  "reviewItems",
  "integrations",
  "automations",
  "content",
  "sequences",
  "activity",
  "chat",
  "notifications",
  "voice",
  "billing",
  "recentCalls",
  "connectors",
  "mcpServers",
  "invoiceTemplates",
  "invoiceSends",
  "training",
] as const;

export type OfficeSnapshot = Pick<MeloData, (typeof OFFICE_KEYS)[number]>;

export function snapshotOffice(s: MeloData): OfficeSnapshot {
  const out = {} as OfficeSnapshot;
  for (const key of OFFICE_KEYS) {
    (out as Record<string, unknown>)[key] = s[key];
  }
  return out;
}

export function parseOfficeJson(raw: string | null | undefined): Partial<MeloData> | null {
  if (!raw?.trim()) return null;
  try {
    const v = JSON.parse(raw) as unknown;
    if (!v || typeof v !== "object" || Array.isArray(v)) return null;
    return v as Partial<MeloData>;
  } catch {
    return null;
  }
}

export function looksLikeDemoOffice(name: string) {
  return /northside plumbing/i.test(name.trim());
}

const TENANT = "melo-tenant";

export function getTenantId() {
  try {
    return localStorage.getItem(TENANT) || "anon";
  } catch {
    return "anon";
  }
}

export function setTenantId(id: string) {
  try {
    localStorage.setItem(TENANT, id);
  } catch {
    /* ignore */
  }
}

export function clearTenantCache() {
  try {
    const tid = getTenantId();
    localStorage.removeItem(`melo-office-v3:${tid}`);
    localStorage.removeItem(TENANT);
  } catch {
    /* ignore */
  }
}
