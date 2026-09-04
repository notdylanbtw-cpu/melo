import type { McpServer } from "./types";

export const NATIVE_MCP: McpServer[] = [
  {
    id: "mcp-knowledge",
    name: "Knowledge",
    kind: "native",
    url: "melo://knowledge",
    tools: ["search", "get_service", "get_hours", "get_areas"],
    status: "connected",
    detail: "Price book, FAQs, hours — one brain",
  },
  {
    id: "mcp-jobs",
    name: "Jobs",
    kind: "native",
    url: "melo://jobs",
    tools: ["list_jobs", "get_job", "move_stage", "add_note"],
    status: "connected",
    detail: "Pipeline board and work orders",
  },
  {
    id: "mcp-inbox",
    name: "Inbox",
    kind: "native",
    url: "melo://inbox",
    tools: ["list_threads", "draft_reply", "send"],
    status: "connected",
    detail: "Email, SMS, WhatsApp, Instagram",
  },
  {
    id: "mcp-calendar",
    name: "Calendar",
    kind: "native",
    url: "melo://calendar",
    tools: ["freebusy", "book_window", "travel_hold"],
    status: "connected",
    detail: "Staff diaries and travel buffers",
  },
  {
    id: "mcp-money",
    name: "Money",
    kind: "native",
    url: "melo://money",
    tools: ["draft_quote", "raise_invoice", "record_payment"],
    status: "connected",
    detail: "Quotes, invoices, GST — send still needs Review",
  },
  {
    id: "mcp-review",
    name: "Review",
    kind: "native",
    url: "melo://review",
    tools: ["file_draft", "list_pending"],
    status: "connected",
    detail: "Owner queue for money, messages and posts",
  },
];

export const DEFAULT_GRANTS: Record<string, { apps: string[]; mcp: string[] }> = {
  receptionist: { apps: ["twilio", "gcal", "whatsapp"], mcp: ["mcp-knowledge", "mcp-inbox", "mcp-calendar"] },
  dispatch: { apps: ["gcal", "slack"], mcp: ["mcp-knowledge", "mcp-jobs", "mcp-calendar"] },
  scout: { apps: ["whatsapp", "instagram", "gmail", "gbp"], mcp: ["mcp-knowledge", "mcp-inbox"] },
  quill: { apps: ["gbp", "wordpress"], mcp: ["mcp-knowledge", "mcp-review"] },
  ledger: { apps: ["xero", "stripe", "gmail"], mcp: ["mcp-knowledge", "mcp-money", "mcp-review"] },
  brief: { apps: ["gbp", "slack"], mcp: ["mcp-knowledge"] },
  helix: { apps: ["slack", "gcal", "gmail"], mcp: ["mcp-knowledge", "mcp-jobs", "mcp-inbox", "mcp-review"] },
};

export const ROLE_SUGGESTED_APPS: Record<string, string[]> = {
  receptionist: ["twilio", "gcal", "whatsapp", "gmail"],
  dispatch: ["gcal", "servicem8", "jobber", "slack"],
  scout: ["whatsapp", "instagram", "gmail", "gbp"],
  quill: ["gbp", "wordpress", "webflow"],
  ledger: ["xero", "stripe", "gmail", "qbo"],
  brief: ["gbp", "slack"],
  helix: ["slack", "gcal", "gmail"],
};

export function grantsFor(agentId: string, role?: string): { apps: string[]; mcp: string[] } {
  return (
    DEFAULT_GRANTS[agentId] ?? {
      apps: [],
      mcp: ["mcp-knowledge"],
    }
  );
}

export function mapToolNamesToApps(tools: string[]): string[] {
  const blob = tools.join(" ").toLowerCase();
  const hits: string[] = [];
  const pairs: [string, string[]][] = [
    ["xero", ["xero"]],
    ["stripe", ["stripe"]],
    ["gcal", ["calendar"]],
    ["whatsapp", ["whatsapp", "chat"]],
    ["gbp", ["gbp"]],
    ["gmail", ["inbox", "mail"]],
    ["twilio", ["voice"]],
    ["slack", ["slack"]],
    ["servicem8", ["jobs", "servicem8"]],
    ["wordpress", ["cms"]],
  ];
  for (const [id, keys] of pairs) {
    if (keys.some((k) => blob.includes(k))) hits.push(id);
  }
  return hits;
}
