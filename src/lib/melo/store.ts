import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { toast } from "sonner";
import { uid } from "@/lib/utils";
import { incGst, money, addMinsIso, timeOf } from "@/lib/format";
import { createSeed } from "./seed";
import { createFreshOffice, type OnboardingInput } from "./fresh";
import { localAsk, toChat, type AskResult } from "./ask";
import { nameFromEmail, parseMoneyAsk, priceFromBook, pricedSummary, type MoneyAsk } from "./price-ask";
import { grantsFor, mapToolNamesToApps } from "./agent-tools";
import { mergeServices, study } from "./train";
import { answerFromKnowledge } from "./knowledge";
import { fillTemplate, invoiceContext, pickTemplate } from "./invoice-templates";
import { planById, planCaps } from "./billing";
import type {
  Agent,
  Autopilot,
  CallPhase,
  Channel,
  ChatMessage,
  HomeMode,
  Industry,
  Invoice,
  InvoiceTemplate,
  Job,
  JobStage,
  MeloData,
  ReviewStatus,
} from "./types";

type UiState = {
  homeMode: HomeMode;
  askOpen: boolean;
  commandOpen: boolean;
  widgetOpen: boolean;
  sidebarOpen: boolean;
  helpOpen: boolean;
  checklistHidden: boolean;
  selectedConversationId: string;
  selectedJobId: string | null;
  selectedReviewId: string | null;
  receptionTab: "live" | "detail";
  settingsTab: "workspace" | "train" | "numbers" | "billing" | "brand" | "team" | "voice" | "templates" | "playbooks";
  pipelineTab: "board" | "invoices";
  widgetMessages: { id: string; from: "visitor" | "bot"; text: string }[];
  widgetStep: "chat" | "booked";
  asking: boolean;
};

type Actions = {
  hydrateUi: () => void;
  setHomeMode: (m: HomeMode) => void;
  setAskOpen: (v: boolean) => void;
  setCommandOpen: (v: boolean) => void;
  setWidgetOpen: (v: boolean) => void;
  setSidebarOpen: (v: boolean) => void;
  setHelpOpen: (v: boolean) => void;
  setChecklistHidden: (v: boolean) => void;
  selectConversation: (id: string) => void;
  selectJob: (id: string | null) => void;
  selectReview: (id: string | null) => void;
  setReceptionTab: (t: "live" | "detail") => void;
  setSettingsTab: (t: UiState["settingsTab"]) => void;
  setPipelineTab: (t: "board" | "invoices") => void;
  pushChat: (m: ChatMessage) => void;
  sendAsk: (text: string, apiText?: string | null) => void;
  draftFromAsk: (ask: MoneyAsk) => AskResult;
  setAsking: (v: boolean) => void;
  createAgent: (input: {
    name: string;
    role: string;
    voice: string;
    tools: string[];
    permissions: Agent["permissions"];
    autopilot: Autopilot;
  }) => void;
  hireSpecialist: (marketplaceId: string) => void;
  setAutopilot: (agentId: string, autopilot: Autopilot) => void;
  toggleAgentIntegration: (agentId: string, integrationId: string) => void;
  toggleAgentMcp: (agentId: string, mcpId: string) => void;
  setAgentPermission: (agentId: string, perm: Agent["permissions"][number], on: boolean) => void;
  addMcpServer: (name: string, url: string) => void;
  sendInbox: (conversationId: string, text: string) => void;
  ingestPulledInbox: (
    rows: { id: string; channel: string; from_name: string; from_address: string; subject: string; body: string; at: string }[],
  ) => void;
  widgetSend: (text: string) => void;
  widgetBook: () => void;
  approveReview: (id: string) => void;
  rejectReview: (id: string) => void;
  sendQuoteForSignature: (jobId: string, channel?: "email" | "sms" | "whatsapp") => void;
  signQuote: (jobId: string, input: { signerName: string; method: "drawn" | "typed"; image: string }) => void;
  declineQuote: (jobId: string) => void;
  convertQuoteToInvoice: (jobId: string) => void;
  raiseInvoice: (jobId: string, kind?: Invoice["kind"]) => string | null;
  sendInvoice: (input: {
    jobId: string;
    invoiceId: string;
    templateId: string;
    channel: "email" | "sms" | "whatsapp";
    subject: string;
    body: string;
  }) => void;
  updateInvoiceTemplate: (id: string, patch: Partial<InvoiceTemplate>) => void;
  addInvoiceTemplate: () => void;
  updateServicePrice: (serviceId: string, priceFrom: number, afterHoursFrom: number) => void;
  updateKnowledge: (patch: Partial<MeloData["knowledge"]>) => void;
  trainMelo: (input: { website: string; description: string; tools: string }) => void;
  setTrainingDraft: (patch: Partial<MeloData["training"]>) => void;
  bookSlot: (staffId: string, start: string, jobId?: string) => void;
  moveJob: (jobId: string, stage: JobStage) => void;
  addJobNote: (jobId: string, text: string) => void;
  recordPayment: (jobId: string, invoiceId: string, amount: number, method: "stripe" | "square" | "cash" | "eft" | "card") => void;
  updateWorkspace: (patch: Partial<MeloData["workspace"]>) => void;
  setIndustry: (industry: Industry) => void;
  updateVoice: (patch: Partial<MeloData["voice"]>) => void;
  setPlan: (planId: string, cadence: "monthly" | "annual") => void;
  toggleAddon: (id: string) => void;
  cancelPlan: () => void;
  reactivatePlan: () => void;
  updateCard: (card: MeloData["billing"]["card"]) => void;
  toggleIntegration: (id: string) => void;
  connectApp: (id: string, detail: string) => void;
  disconnectApp: (id: string) => void;
  syncChannelStatus: (channels: { kind: string; status: "available" | "connected" | "needs_attention"; detail: string; externalId?: string }[]) => void;
  applyLiveCall: (row: {
    id: string;
    from: string;
    to?: string;
    phase: string;
    reason: string;
    startedAt: string;
    summary?: string | null;
    transcript: { at: string; speaker: string; text: string }[];
  }) => void;
  toggleAutomation: (id: string) => void;
  addConnector: (name: string, baseUrl: string, auth: string) => void;
  liveControl: (action: "mute" | "hold" | "resume" | "end" | "barge") => void;
  transferCall: (staffId: string) => void;
  resetDemo: () => void;
  hydrateOffice: (input: OnboardingInput) => void;
  markNotifsRead: () => void;
  markNotifRead: (id: string) => void;
  log: (text: string, agentId?: string) => void;
};

export type MeloStore = MeloData & UiState & Actions;

const uiDefaults: UiState = {
  homeMode: "command",
  askOpen: false,
  commandOpen: false,
  widgetOpen: false,
  sidebarOpen: false,
  helpOpen: false,
  checklistHidden: false,
  selectedConversationId: "",
  selectedJobId: null,
  selectedReviewId: null,
  receptionTab: "live",
  settingsTab: "workspace",
  pipelineTab: "board",
  widgetMessages: [
    {
      id: "w0",
      from: "bot",
      text: "Hi — Northside Plumbing here. Blocked drain, leak or hot water? I can quote or book a tech.",
    },
  ],
  widgetStep: "chat",
  asking: false,
};

export const useMelo = create<MeloStore>()(
  persist(
    (set, get) => ({
      ...createSeed(),
      ...uiDefaults,

      hydrateUi: () => set({ ...uiDefaults, widgetMessages: get().widgetMessages, widgetStep: get().widgetStep }),

      setHomeMode: (homeMode) => set({ homeMode }),
      setAskOpen: (askOpen) => set({ askOpen }),
      setCommandOpen: (commandOpen) => set({ commandOpen }),
      setWidgetOpen: (widgetOpen) => set({ widgetOpen }),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      setHelpOpen: (helpOpen) => set({ helpOpen }),
      setChecklistHidden: (checklistHidden) => set({ checklistHidden }),
      selectConversation: (id) =>
        set((s) => ({
          selectedConversationId: id,
          conversations: s.conversations.map((c) => (c.id === id ? { ...c, unread: 0 } : c)),
        })),
      selectJob: (selectedJobId) => set({ selectedJobId }),
      selectReview: (selectedReviewId) => set({ selectedReviewId }),
      setReceptionTab: (receptionTab) => set({ receptionTab }),
      setSettingsTab: (settingsTab) => set({ settingsTab }),
      setPipelineTab: (pipelineTab) => set({ pipelineTab }),
      setAsking: (asking) => set({ asking }),

      pushChat: (m) => set((s) => ({ chat: [...s.chat, m] })),

      sendAsk: (text, apiText) => {
        const user: ChatMessage = { id: uid("chat"), at: new Date().toISOString(), role: "user", text };
        const parsed = parseMoneyAsk(text);
        const local = parsed ? get().draftFromAsk(parsed) : localAsk(text, get());
        const reply = local
          ? toChat(local)
          : toChat({
              agentId: "helix",
              text:
                apiText?.trim() ||
                "Helix can take that. I mapped it as a goal — specialists will draft in Review if it touches money, messages or public content.",
              chips: [{ id: "r", label: "Open Review", action: "open_review", payload: { id: get().reviewItems[0]?.id ?? "rev-q2041" } }],
            });
        set((s) => ({
          chat: [...s.chat, user, reply],
          asking: false,
          activity: [
            { id: uid("ac"), at: new Date().toISOString(), actor: "Helix", agentId: "helix", text: `Ask Melo: “${text.slice(0, 80)}”` },
            ...s.activity,
          ],
        }));
      },

      draftFromAsk: (ask) => {
        const now = new Date().toISOString();
        const s0 = get();
        const email = ask.email.toLowerCase();
        const priced = priceFromBook(ask.description, s0.knowledge);
        const t = priced.items.reduce((n, i) => n + i.qty * i.sell, 0);
        const inc = incGst(t);
        let customer = s0.customers.find((c) => c.email.toLowerCase() === email);
        const createdCustomer = !customer;
        if (!customer) {
          const siteId = uid("site");
          customer = {
            id: uid("cus"),
            name: nameFromEmail(email),
            phone: "",
            email,
            sites: [
              {
                id: siteId,
                label: "Primary",
                address: "",
                suburb: priced.suburb || "Sydney",
                state: "NSW",
                postcode: "",
              },
            ],
            tags: ["Email", "Ask Melo"],
            since: now.slice(0, 10),
            notes: `Created from Ask Melo — ${ask.description || ask.kind}.`,
          };
        }
        const suburb = priced.suburb || customer.sites[0]?.suburb || "Sydney";
        const siteId = customer.sites.find((x) => x.suburb === suburb)?.id ?? customer.sites[0]?.id ?? uid("site");
        const jobN = Math.max(1040, ...s0.jobs.map((j) => parseInt(j.number.replace(/\D/g, ""), 10) || 0)) + 1;
        const qN = Math.max(2040, ...s0.jobs.map((j) => parseInt(j.quote?.number.replace(/\D/g, "") ?? "0", 10) || 0)) + 1;
        const invN = Math.max(3200, ...s0.jobs.flatMap((j) => j.invoices.map((i) => parseInt(i.number.replace(/\D/g, ""), 10) || 0))) + 1;
        const jobId = uid("job");
        const convId = uid("conv");
        const revId = uid("rev");
        const title = priced.title;
        const scope = ask.description.trim() || title;
        const job: Job = {
          id: jobId,
          number: `JOB-${jobN}`,
          title,
          stage: "quoted",
          customerId: customer.id,
          siteId,
          suburb,
          value: inc,
          assigneeId: null,
          nextAction: ask.kind === "quote" ? "Approve send for e-signature" : "Approve send of tax invoice",
          channel: "email",
          scope,
          items: priced.items,
          labour: [],
          invoices: [],
          payments: [],
          notes: [{ id: uid("n"), at: now, author: "Ledger", text: `Priced from the book via Ask Melo. ${scope}` }],
          attachments: [],
          statusHistory: [{ at: now, stage: "quoted", note: `Drafted from Ask Melo for ${email}` }],
        };
        if (ask.kind === "quote") {
          job.quote = {
            id: uid("q"),
            number: `Q-${qN}`,
            status: "in_review",
            issuedAt: now,
            expiry: "2026-09-17",
            terms: "Valid 14 days. GST included in total. Signing this quote approves the job.",
            depositPct: inc >= 1000 ? 50 : 0,
            discount: 0,
            items: priced.items,
          };
        } else {
          job.invoices = [
            {
              id: uid("inv"),
              number: `INV-${invN}`,
              kind: "final",
              status: "awaiting_approval",
              issuedAt: now,
              dueAt: "2026-09-17",
              items: priced.items,
              discount: 0,
              xeroSync: "pending",
            },
          ];
        }
        const docNo = job.quote?.number ?? job.invoices[0]!.number;
        const convMsg = {
          id: uid("msg"),
          at: now,
          from: "agent" as const,
          author: "Ledger",
          text: `${docNo} drafted for ${customer.name} (${email}) — ${money(inc)} inc GST. Waiting on Alex to approve send.`,
          channel: "email" as const,
        };
        set((s) => ({
          customers: createdCustomer && customer ? [customer, ...s.customers] : s.customers,
          jobs: [job, ...s.jobs],
          conversations: [
            {
              id: convId,
              customerId: customer!.id,
              channel: "email",
              subject: `${docNo} · ${title}`,
              preview: convMsg.text,
              updatedAt: now,
              unread: 0,
              assignedAgentId: "ledger",
              jobId,
              messages: [convMsg],
            },
            ...s.conversations,
          ],
          reviewItems: [
            {
              id: revId,
              kind: ask.kind === "quote" ? ("quote" as const) : ("money" as const),
              title: `${ask.kind === "quote" ? "Quote" : "Invoice"} ${docNo} · ${customer!.name}`,
              summary: `${title} · ${money(inc)} inc GST · ${email}`,
              agentId: "ledger",
              status: "pending",
              createdAt: now,
              sources: ["Price book 2026", "Ask Melo"],
              preview: pricedSummary(priced.items),
              jobId,
              conversationId: convId,
              history: [{ at: now, text: "Ledger priced from the book. Waiting on Alex to approve send." }],
            },
            ...s.reviewItems,
          ],
          selectedReviewId: revId,
          selectedJobId: jobId,
          notifications: [
            {
              id: uid("n"),
              at: now,
              title: `${docNo} ready to send`,
              body: `${customer!.name} · ${money(inc)} inc GST. Approve send.`,
              href: "/review",
              read: false,
            },
            ...s.notifications,
          ],
        }));
        get().log(`Ledger priced ${docNo} from the book for ${email}`, "ledger");
        const who = createdCustomer ? `${customer!.name} (new customer from ${email})` : `${customer!.name} <${email}>`;
        return {
          agentId: "ledger",
          text:
            `Priced from the book for ${who}.\n\n${docNo} · ${title}${suburb ? ` · ${suburb}` : ""}\n\n${pricedSummary(priced.items)}\n\n` +
            (ask.kind === "quote"
              ? "I have not sent it. Approve send and I’ll email the quote with an e-sign link — they sign to approve the job."
              : "I have not sent it. Approve send and I’ll email the tax invoice."),
          chips: [
            { id: "send", label: "Approve & send", action: "approve_send", payload: { id: revId, jobId } },
            { id: "rev", label: "Open in Review", action: "open_review", payload: { id: revId } },
          ] as AskResult["chips"],
        };
      },

      createAgent: (input) => {
        const agent: Agent = {
          id: uid("ag"),
          name: input.name,
          role: input.role,
          blurb: `Custom agent · ${input.role}`,
          portrait: null,
          color: "primary",
          status: "idle",
          currentTask: null,
          tools: input.tools,
          permissions: input.permissions,
          autopilot: input.autopilot,
          voice: input.voice,
          taskCount: 0,
          handlesCalls: input.permissions.includes("call"),
          hired: true,
          custom: true,
          integrationIds: mapToolNamesToApps(input.tools),
          mcpIds: ["mcp-knowledge"],
        };
        set((s) => ({ agents: [...s.agents, agent] }));
        get().log(`Hired custom agent ${input.name}`, "helix");
        toast.success(`${input.name} joined the firm`);
      },

      hireSpecialist: (marketplaceId) => {
        const spec = get().marketplace.find((m) => m.id === marketplaceId);
        if (!spec) return;
        if (get().agents.some((a) => a.marketplaceId === marketplaceId)) {
          toast.message(`${spec.name} is already on the firm`);
          return;
        }
        const agent: Agent = {
          id: uid("ag"),
          name: spec.name,
          role: spec.role,
          blurb: spec.blurb,
          portrait: spec.portrait,
          color: spec.color,
          status: "idle",
          currentTask: "Just hired — waiting on first brief",
          tools: spec.tools,
          permissions: spec.handlesCalls ? ["read", "draft", "call"] : ["read", "draft"],
          autopilot: "draft",
          taskCount: 0,
          handlesCalls: spec.handlesCalls,
          hired: true,
          marketplaceId,
          integrationIds: mapToolNamesToApps(spec.tools),
          mcpIds: ["mcp-knowledge"],
        };
        set((s) => ({
          agents: [...s.agents, agent],
          billing: {
            ...s.billing,
            usage: { ...s.billing.usage, seats: s.billing.usage.seats + 1 },
          },
        }));
        get().log(`Hired ${spec.name} to the firm`, "helix");
        const after = get();
        const cap = planCaps(planById(after.billing.planId), after.billing.addons).seats;
        if (after.billing.usage.seats > cap) {
          toast.message(`${spec.name} hired · ${after.billing.usage.seats} of ${cap} seats. Add a seat in Billing.`);
        } else {
          toast.success(`${spec.name} hired`);
        }
      },

      setAutopilot: (agentId, autopilot) => {
        set((s) => ({ agents: s.agents.map((a) => (a.id === agentId ? { ...a, autopilot } : a)) }));
        toast.success("Autopilot updated");
      },

      toggleAgentIntegration: (agentId, integrationId) => {
        const agent = get().agents.find((a) => a.id === agentId);
        if (!agent) return;
        const have = new Set(agent.integrationIds ?? []);
        const on = !have.has(integrationId);
        if (on) have.add(integrationId);
        else have.delete(integrationId);
        set((s) => ({
          agents: s.agents.map((a) => (a.id === agentId ? { ...a, integrationIds: [...have] } : a)),
          integrations: on
            ? s.integrations.map((i) =>
                i.id === integrationId && i.status !== "connected"
                  ? { ...i, status: "connected" as const, detail: `Connected for ${agent.name}` }
                  : i,
              )
            : s.integrations,
        }));
        get().log(`${on ? "Granted" : "Revoked"} ${integrationId} for ${agent.name}`, "helix");
        toast.success(on ? `${agent.name} can use that app` : `Removed from ${agent.name}`);
      },

      toggleAgentMcp: (agentId, mcpId) => {
        const agent = get().agents.find((a) => a.id === agentId);
        if (!agent) return;
        const have = new Set(agent.mcpIds ?? []);
        const on = !have.has(mcpId);
        if (on) have.add(mcpId);
        else have.delete(mcpId);
        set((s) => ({ agents: s.agents.map((a) => (a.id === agentId ? { ...a, mcpIds: [...have] } : a)) }));
        toast.success(on ? `Tool granted to ${agent.name}` : `Tool removed from ${agent.name}`);
      },

      setAgentPermission: (agentId, perm, on) => {
        set((s) => ({
          agents: s.agents.map((a) => {
            if (a.id !== agentId) return a;
            const next = on ? Array.from(new Set([...a.permissions, perm])) : a.permissions.filter((p) => p !== perm);
            return { ...a, permissions: next, handlesCalls: next.includes("call") };
          }),
        }));
      },

      addMcpServer: (name, url) => {
        const id = uid("mcp");
        set((s) => ({
          mcpServers: [
            ...(s.mcpServers ?? []),
            {
              id,
              name,
              kind: "custom" as const,
              url,
              tools: ["list", "get", "run"],
              status: "connected" as const,
              detail: "Handshake ok · 3 tools",
            },
          ],
          agents: s.agents.map((a) => (a.id === "helix" ? { ...a, mcpIds: [...(a.mcpIds ?? []), id] } : a)),
        }));
        get().log(`Added MCP server ${name}`, "helix");
        toast.success(`${name} connected · Helix can call it`);
      },

      sendInbox: (conversationId, text) => {
        const msg = {
          id: uid("msg"),
          at: new Date().toISOString(),
          from: "staff" as const,
          author: "Alex",
          text,
          channel: get().conversations.find((c) => c.id === conversationId)?.channel ?? ("sms" as const),
        };
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === conversationId
              ? { ...c, messages: [...c.messages, msg], preview: text, updatedAt: msg.at, unread: 0 }
              : c,
          ),
        }));
        toast.success("Message sent");
      },

      ingestPulledInbox: (rows) => {
        if (!rows.length) return;
        const allowed: Channel[] = ["voice", "sms", "whatsapp", "instagram", "email", "widget", "messenger", "facebook", "imessage"];
        set((s) => {
          let customers = s.customers;
          let conversations = s.conversations;
          for (const row of rows) {
            const channel = (allowed.includes(row.channel as Channel) ? row.channel : "widget") as Channel;
            let customer = customers.find((c) => c.phone === row.from_address || c.email === row.from_address || c.name === row.from_name);
            if (!customer) {
              customer = {
                id: uid("cust"),
                name: row.from_name || "Visitor",
                phone: row.from_address,
                email: row.from_address.includes("@") ? row.from_address : "",
                sites: [],
                tags: [],
                since: row.at,
                notes: "",
              };
              customers = [...customers, customer];
            }
            const msg = {
              id: row.id,
              at: row.at,
              from: "customer" as const,
              author: customer.name,
              text: row.body,
              channel,
            };
            const existing = conversations.find((c) => c.customerId === customer.id && c.channel === channel);
            if (existing) {
              conversations = conversations.map((c) =>
                c.id === existing.id
                  ? { ...c, messages: [...c.messages, msg], preview: row.body, updatedAt: row.at, unread: c.unread + 1, subject: row.subject || c.subject }
                  : c,
              );
            } else {
              conversations = [
                {
                  id: uid("conv"),
                  customerId: customer.id,
                  channel,
                  subject: row.subject || row.from_name || "New message",
                  preview: row.body,
                  updatedAt: row.at,
                  unread: 1,
                  assignedAgentId: "receptionist",
                  messages: [msg],
                },
                ...conversations,
              ];
            }
          }
          return { customers, conversations };
        });
      },

      widgetSend: (text) => {
        const k = get().knowledge;
        const visitor = { id: uid("w"), from: "visitor" as const, text };
        const bot = { id: uid("w"), from: "bot" as const, text: answerFromKnowledge(text, k).text };
        set((s) => ({ widgetMessages: [...s.widgetMessages, visitor, bot] }));
      },

      widgetBook: () => {
        const at = new Date().toISOString();
        const convId = "conv-widget";
        const jobId = uid("job");
        const existing = get().conversations.find((c) => c.id === convId);
        const conversation = existing ?? {
          id: convId,
          customerId: "visitor",
          channel: "widget" as const,
          subject: "Blocked drain — Newtown",
          preview: "Booked Sam Thursday 7:30 am via widget",
          updatedAt: at,
          unread: 1,
          assignedAgentId: "receptionist",
          jobId,
          messages: [
            { id: uid("m"), at, from: "customer" as const, author: "Website visitor", text: "Blocked drain in Newtown", channel: "widget" as const },
            { id: uid("m"), at, from: "agent" as const, author: "Receptionist", text: "Booked Sam Thursday 7:30 am. We’ll text when we’re 20 minutes away.", channel: "widget" as const },
          ],
        };
        set((s) => ({
          widgetStep: "booked",
          widgetMessages: [
            ...s.widgetMessages,
            { id: uid("w"), from: "bot", text: "Booked Sam for Thursday 7:30 am in Newtown. You’ll get a text when we’re 20 minutes away. It’s in Inbox, Calendar and Pipeline." },
          ],
          conversations: existing ? s.conversations.map((c) => (c.id === convId ? { ...conversation, unread: 1 } : c)) : [conversation, ...s.conversations],
          jobs: s.jobs.some((j) => j.id === jobId)
            ? s.jobs
            : [
                {
                  id: jobId,
                  number: `JOB-${1048 + s.jobs.length}`,
                  title: "Blocked drain",
                  stage: "booked" as const,
                  customerId: "visitor",
                  siteId: "visitor-newtown",
                  suburb: "Newtown",
                  value: s.knowledge.services.find((x) => x.id === "blocked-drain")?.priceFrom ?? 180,
                  assigneeId: "sam",
                  nextAction: "Sam Thu 7:30 am · widget booking",
                  channel: "widget" as const,
                  scheduledStart: "2026-09-03T07:30:00+10:00",
                  scheduledEnd: "2026-09-03T09:00:00+10:00",
                  travelMins: 25,
                  scope: "Widget booking — blocked drain in Newtown.",
                  items: [],
                  labour: [],
                  invoices: [],
                  payments: [],
                  notes: [],
                  attachments: [],
                  statusHistory: [{ at, stage: "booked", note: "Booked from website widget" }],
                },
                ...s.jobs,
              ],
        }));
        get().log("Widget booked Sam Thu 7:30 am · Newtown blocked drain", "receptionist");
        toast.success("Booking created in Inbox, Calendar and Pipeline");
      },

      approveReview: (id) => {
        const item = get().reviewItems.find((r) => r.id === id);
        if (!item) return;
        if (item.kind === "quote" && item.jobId) {
          set((s) => ({
            reviewItems: s.reviewItems.map((r) =>
              r.id === id
                ? { ...r, status: "approved" as ReviewStatus, history: [...r.history, { at: new Date().toISOString(), text: "Alex approved send for signature." }] }
                : r,
            ),
          }));
          const job = get().jobs.find((j) => j.id === item.jobId);
          const ch = job?.channel === "email" || job?.channel === "sms" || job?.channel === "whatsapp" ? job.channel : "whatsapp";
          get().sendQuoteForSignature(item.jobId, ch);
          return;
        }
        if (item.kind === "money" && item.jobId) {
          const job = get().jobs.find((j) => j.id === item.jobId);
          const customer = job ? get().customers.find((c) => c.id === job.customerId) : undefined;
          const invoice =
            job?.invoices.find((i) => i.status === "awaiting_approval" || i.status === "draft") ?? job?.invoices[0];
          if (job && customer && invoice) {
            const channel = (job.channel === "sms" || job.channel === "whatsapp" ? job.channel : "email") as "email" | "sms" | "whatsapp";
            const tpl =
              pickTemplate(get().invoiceTemplates, invoice, channel, "send") ?? get().invoiceTemplates.find((t) => t.channel === "email");
            const ctx = invoiceContext({ invoice, job, customer, workspace: get().workspace });
            get().sendInvoice({
              jobId: job.id,
              invoiceId: invoice.id,
              templateId: tpl?.id ?? "tpl-invoice-email",
              channel,
              subject: tpl ? fillTemplate(tpl.subject, ctx) : `Tax invoice ${invoice.number}`,
              body: tpl ? fillTemplate(tpl.body, ctx) : `Please find invoice ${invoice.number}.`,
            });
            return;
          }
        }
        set((s) => ({
          reviewItems: s.reviewItems.map((r) =>
            r.id === id
              ? { ...r, status: "approved" as ReviewStatus, history: [...r.history, { at: new Date().toISOString(), text: "Alex approved & send." }] }
              : r,
          ),
        }));
        get().log(`Approved ${item.title}`, "helix");
        toast.success("Approved and sent");
      },

      rejectReview: (id) => {
        set((s) => ({
          reviewItems: s.reviewItems.map((r) =>
            r.id === id
              ? { ...r, status: "rejected" as ReviewStatus, history: [...r.history, { at: new Date().toISOString(), text: "Alex rejected." }] }
              : r,
          ),
        }));
        toast.message("Rejected");
      },

      sendQuoteForSignature: (jobId, channel) => {
        const job = get().jobs.find((j) => j.id === jobId);
        if (!job?.quote) {
          toast.error("No quote to send");
          return;
        }
        if (job.quote.status === "accepted") {
          toast.message(`${job.quote.number} is already signed — job approved`);
          return;
        }
        const customer = get().customers.find((c) => c.id === job.customerId);
        const now = new Date().toISOString();
        const ch = channel ?? (job.channel === "email" || job.channel === "sms" || job.channel === "whatsapp" ? job.channel : "email");
        const path = `/sign/${job.quote.id}`;
        const tInc = incGst(job.quote.items.filter((i) => !i.optional).reduce((n, i) => n + i.qty * i.sell, 0) - job.quote.discount);
        const text =
          `Quote ${job.quote.number} for ${job.title} — ${money(tInc)} inc GST.\n\n` +
          `Sign this quote to approve the job and lock the scope. Valid until ${job.quote.expiry}.\n\n` +
          `Sign here: ${typeof window !== "undefined" ? window.location.origin : ""}${path}`;
        set((s) => {
          const existing =
            s.conversations.find((c) => c.customerId === job.customerId && c.channel === ch) ??
            s.conversations.find((c) => c.customerId === job.customerId);
          const msg = {
            id: uid("msg"),
            at: now,
            from: "agent" as const,
            author: "Ledger",
            text,
            channel: ch,
          };
          const conversations = existing
            ? s.conversations.map((c) =>
                c.id === existing.id ? { ...c, messages: [...c.messages, msg], preview: text.slice(0, 120), updatedAt: now } : c,
              )
            : [
                {
                  id: uid("conv"),
                  customerId: job.customerId,
                  channel: ch,
                  subject: `${job.quote!.number} · sign to approve`,
                  preview: text.slice(0, 120),
                  updatedAt: now,
                  unread: 0,
                  assignedAgentId: "ledger",
                  jobId,
                  messages: [msg],
                },
                ...s.conversations,
              ];
          return {
            conversations,
            jobs: s.jobs.map((j) =>
              j.id !== jobId || !j.quote
                ? j
                : {
                    ...j,
                    stage: j.stage === "new" ? ("quoted" as const) : j.stage,
                    nextAction: `Awaiting ${customer?.name.split(" ")[0] ?? "client"} signature`,
                    quote: {
                      ...j.quote,
                      status: "sent" as const,
                      sentAt: now,
                      signature: { status: "awaiting" as const, sentAt: now, sentChannel: ch },
                    },
                  },
            ),
          };
        });
        get().log(`Sent ${job.quote.number} for e-signature to ${customer?.name ?? "client"}`, "ledger");
        toast.success(`${job.quote.number} sent — ${customer?.name.split(" ")[0] ?? "client"} signs to approve the job`);
      },

      signQuote: (jobId, input) => {
        const job = get().jobs.find((j) => j.id === jobId);
        if (!job?.quote) {
          toast.error("Quote not found");
          return;
        }
        if (job.quote.status === "accepted" || job.quote.signature?.status === "signed") {
          toast.message("Already signed — job is approved");
          return;
        }
        if (job.quote.status === "declined" || job.quote.status === "expired") {
          toast.error("This quote can’t be signed");
          return;
        }
        const now = new Date().toISOString();
        const customer = get().customers.find((c) => c.id === job.customerId);
        const booked = Boolean(job.scheduledStart);
        set((s) => {
          const existing = s.conversations.find((c) => c.customerId === job.customerId);
          const msg = {
            id: uid("msg"),
            at: now,
            from: "customer" as const,
            author: input.signerName,
            text: `Signed ${job.quote!.number}. Job approved — please proceed.`,
            channel: existing?.channel ?? job.channel,
          };
          return {
            jobs: s.jobs.map((j) =>
              j.id !== jobId || !j.quote
                ? j
                : {
                    ...j,
                    stage: booked ? ("booked" as const) : j.stage,
                    nextAction: booked
                      ? `Signed · ${j.scheduledStart ? "crew locked" : "book a tech"}`
                      : "Signed — book a tech",
                    quote: {
                      ...j.quote,
                      status: "accepted" as const,
                      decidedAt: now,
                      signature: {
                        status: "signed" as const,
                        sentAt: j.quote.signature?.sentAt ?? now,
                        sentChannel: j.quote.signature?.sentChannel,
                        signedAt: now,
                        signerName: input.signerName,
                        method: input.method,
                        image: input.image,
                      },
                    },
                    statusHistory: [...j.statusHistory, { at: now, stage: booked ? ("booked" as const) : j.stage, note: `${input.signerName} signed ${j.quote.number} — job approved` }],
                    notes: [
                      ...j.notes,
                      {
                        id: uid("n"),
                        at: now,
                        author: input.signerName,
                        text: `E-signed ${j.quote.number}. This is a contract to proceed.`,
                      },
                    ],
                  },
            ),
            conversations: existing
              ? s.conversations.map((c) =>
                  c.id === existing.id ? { ...c, messages: [...c.messages, msg], preview: msg.text, updatedAt: now } : c,
                )
              : s.conversations,
            notifications: [
              {
                id: uid("n"),
                at: now,
                title: `${job.quote!.number} signed`,
                body: `${input.signerName} approved ${job.title}. The job is contracted.`,
                href: "/pipeline",
                read: false,
              },
              ...s.notifications,
            ],
          };
        });
        get().log(`${input.signerName} signed ${job.quote.number} — job approved`, "ledger");
        toast.success(`${job.quote.number} signed — job approved`);
        if (job.quote.depositPct > 0 && job.invoices.length === 0) {
          get().raiseInvoice(jobId, "deposit");
        }
      },

      declineQuote: (jobId) => {
        const job = get().jobs.find((j) => j.id === jobId);
        if (!job?.quote) return;
        const now = new Date().toISOString();
        set((s) => ({
          jobs: s.jobs.map((j) =>
            j.id !== jobId || !j.quote
              ? j
              : {
                  ...j,
                  nextAction: "Quote declined",
                  quote: {
                    ...j.quote,
                    status: "declined" as const,
                    decidedAt: now,
                    signature: { ...(j.quote.signature ?? { status: "declined" as const }), status: "declined" as const },
                  },
                },
          ),
        }));
        toast.message(`${job.quote.number} declined`);
      },

      convertQuoteToInvoice: (jobId) => {
        const job = get().jobs.find((j) => j.id === jobId);
        if (!job?.quote) {
          toast.error("No quote to convert");
          return;
        }
        const ex = job.quote.items.filter((i) => !i.optional).reduce((n, i) => n + i.qty * i.sell, 0) - job.quote.discount;
        const isDeposit = job.quote.depositPct > 0;
        const inv: Invoice = {
          id: uid("inv"),
          number: `INV-${3200 + get().jobs.reduce((n, j) => n + j.invoices.length, 0)}`,
          kind: isDeposit ? "deposit" : "final",
          status: "awaiting_approval",
          issuedAt: new Date().toISOString(),
          dueAt: "2026-09-17",
          items: isDeposit
            ? [
                {
                  id: uid("li"),
                  kind: "other",
                  description: `${job.quote.depositPct}% deposit on ${job.quote.number}`,
                  qty: 1,
                  unit: "ea",
                  cost: 0,
                  sell: Math.round(ex * (job.quote.depositPct / 100) * 100) / 100,
                },
              ]
            : job.quote.items.map((i) => ({ ...i, id: uid("li") })),
          discount: isDeposit ? 0 : job.quote.discount,
          xeroSync: "pending",
        };
        const inc = incGst(inv.items.reduce((n, i) => n + i.qty * i.sell, 0) - inv.discount);
        set((s) => ({
          jobs: s.jobs.map((j) => (j.id === jobId ? { ...j, invoices: [...j.invoices, inv], quote: j.quote ? { ...j.quote, status: "accepted" } : j.quote } : j)),
          reviewItems: [
            {
              id: uid("rev"),
              kind: "money",
              title: `Invoice ${inv.number} · ${s.customers.find((c) => c.id === job.customerId)?.name}`,
              summary: `${money(inc)} ${isDeposit ? "deposit" : "from accepted quote"}`,
              agentId: "ledger",
              status: "pending",
              createdAt: new Date().toISOString(),
              sources: [job.quote!.number, "Xero"],
              preview: isDeposit
                ? `${job.quote!.depositPct}% deposit raised from ${job.quote!.number}. Waiting in Review before send.`
                : "Converted line items and GST. Waiting in Review before send.",
              jobId,
              history: [{ at: new Date().toISOString(), text: "Ledger converted accepted quote." }],
            },
            ...s.reviewItems,
          ],
        }));
        get().log(`Converted ${job.quote.number} to ${inv.number}`, "ledger");
        toast.success(`${inv.number} created with GST — in Review`);
      },

      raiseInvoice: (jobId, kind) => {
        const job = get().jobs.find((j) => j.id === jobId);
        if (!job) return null;
        const source = (job.quote?.items ?? job.items).filter((i) => !i.optional);
        if (!source.length) {
          toast.error("Add line items before raising an invoice");
          return null;
        }
        const deposit = kind === "deposit" || (!kind && job.quote && job.quote.depositPct > 0 && job.invoices.length === 0);
        const ex = source.reduce((n, i) => n + i.qty * i.sell, 0) - (job.quote?.discount ?? 0);
        const inv: Invoice = {
          id: uid("inv"),
          number: `INV-${3200 + get().jobs.reduce((n, j) => n + j.invoices.length, 0)}`,
          kind: deposit ? "deposit" : kind ?? "final",
          status: "draft",
          issuedAt: new Date().toISOString(),
          dueAt: "2026-09-17",
          items: deposit
            ? [
                {
                  id: uid("li"),
                  kind: "other",
                  description: `${job.quote!.depositPct}% deposit on ${job.quote!.number}`,
                  qty: 1,
                  unit: "ea",
                  cost: 0,
                  sell: Math.round(ex * (job.quote!.depositPct / 100) * 100) / 100,
                },
              ]
            : source.map((i) => ({ ...i, id: uid("li") })),
          discount: deposit ? 0 : job.quote?.discount ?? 0,
          xeroSync: "pending",
        };
        set((s) => ({
          jobs: s.jobs.map((j) => (j.id === jobId ? { ...j, invoices: [...j.invoices, inv] } : j)),
        }));
        get().log(`Raised ${inv.number} on ${job.number}`, "ledger");
        toast.success(`${inv.number} drafted — send when you’re ready`);
        return inv.id;
      },

      sendInvoice: ({ jobId, invoiceId, templateId, channel, subject, body }) => {
        const job = get().jobs.find((j) => j.id === jobId);
        const invoice = job?.invoices.find((i) => i.id === invoiceId);
        if (!job || !invoice) {
          toast.error("Invoice not found");
          return;
        }
        const customer = get().customers.find((c) => c.id === job.customerId);
        if (!customer) return;
        const now = new Date().toISOString();
        const to = channel === "email" ? customer.email : customer.phone;
        const keepStatus = invoice.status === "paid" || invoice.status === "part_paid" || invoice.status === "overdue" || invoice.status === "viewed";
        const nextStatus = keepStatus ? invoice.status : ("sent" as const);
        const preview = body.replace(/\s+/g, " ").trim().slice(0, 120);
        const msg = {
          id: uid("msg"),
          at: now,
          from: "agent" as const,
          author: "Ledger",
          text: channel === "email" && subject ? `${subject}\n\n${body}` : body,
          channel,
        };
        set((s) => {
          const existing = s.conversations.find((c) => c.customerId === customer.id && c.channel === channel)
            ?? s.conversations.find((c) => c.customerId === customer.id);
          const conversations = existing
            ? s.conversations.map((c) =>
                c.id === existing.id
                  ? { ...c, messages: [...c.messages, msg], preview, updatedAt: now, channel, subject: c.subject }
                  : c,
              )
            : [
                {
                  id: uid("conv"),
                  customerId: customer.id,
                  channel,
                  subject: subject || `${invoice.number} · ${job.title}`,
                  preview,
                  updatedAt: now,
                  unread: 0,
                  assignedAgentId: "ledger",
                  jobId,
                  messages: [msg],
                },
                ...s.conversations,
              ];
          return {
            conversations,
            jobs: s.jobs.map((j) =>
              j.id !== jobId
                ? j
                : {
                    ...j,
                    invoices: j.invoices.map((inv) =>
                      inv.id !== invoiceId
                        ? inv
                        : {
                            ...inv,
                            status: nextStatus,
                            issuedAt: inv.status === "draft" || inv.status === "awaiting_approval" ? now : inv.issuedAt,
                            sentAt: now,
                            sentChannel: channel,
                            sentTo: to,
                            xeroSync: inv.xeroSync === "off" ? "off" : "synced",
                          },
                    ),
                  },
            ),
            invoiceSends: [
              { id: uid("isend"), invoiceId, jobId, templateId, channel, to, subject, body, sentAt: now },
              ...s.invoiceSends,
            ],
            reviewItems: s.reviewItems.map((r) =>
              r.jobId === jobId && r.kind === "money" && r.status === "pending"
                ? { ...r, status: "approved" as ReviewStatus, history: [...r.history, { at: now, text: `Alex sent ${invoice.number} via ${channel}.` }] }
                : r,
            ),
          };
        });
        get().log(`Sent ${invoice.number} to ${customer.name} via ${channel}`, "ledger");
        toast.success(`${invoice.number} sent to ${customer.name}`);
      },

      updateInvoiceTemplate: (id, patch) => {
        set((s) => ({
          invoiceTemplates: s.invoiceTemplates.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        }));
      },

      addInvoiceTemplate: () => {
        const t: InvoiceTemplate = {
          id: uid("tpl"),
          name: "Custom",
          kind: "invoice",
          channel: "email",
          subject: "Invoice {{invoice_number}} from {{business}} — {{amount}}",
          body: "Hi {{first_name}},\n\nInvoice {{invoice_number}} for {{job}} is {{amount}} due {{due}}.\n\nPay: {{payment_link}}\n\n{{owner}}\n{{business}}",
        };
        set((s) => ({ invoiceTemplates: [...s.invoiceTemplates, t] }));
        toast.success("Template added");
      },

      updateServicePrice: (serviceId, priceFrom, afterHoursFrom) => {
        set((s) => ({
          knowledge: {
            ...s.knowledge,
            services: s.knowledge.services.map((sv) => (sv.id === serviceId ? { ...sv, priceFrom, afterHoursFrom } : sv)),
            sources: s.knowledge.sources.map((src) => (src.id === "price-book" ? { ...src, updatedAt: new Date().toISOString() } : src)),
          },
        }));
        get().log(`Price book updated for ${serviceId}`, "helix");
        toast.success("Knowledge updated — Receptionist, Ask Melo and the widget now use the new price");
      },

      updateKnowledge: (patch) => set((s) => ({ knowledge: { ...s.knowledge, ...patch } })),

      setTrainingDraft: (patch) =>
        set((s) => ({ training: { ...(s.training ?? createSeed().training), ...patch } })),

      trainMelo: (input) => {
        const now = new Date().toISOString();
        const s0 = get();
        const result = study(input, s0.integrations);
        const host = result.host;
        const websiteName = host ?? (input.website.trim() || "Website");
        const sources = [...s0.knowledge.sources];
        const upsert = (id: string, name: string, kind: "website" | "manual", coverage: number) => {
          const i = sources.findIndex((x) => x.id === id || x.name === name);
          const row = { id, name, kind, status: "synced" as const, updatedAt: now, coverage };
          if (i >= 0) sources[i] = { ...sources[i], ...row, id: sources[i].id };
          else sources.unshift(row);
        };
        if (host) upsert("website", websiteName, "website", 94);
        upsert("train", "Owner briefing", "manual", 90);

        const faqs = [...s0.knowledge.faqs];
        for (const f of result.faqs) {
          if (!faqs.some((x) => x.q.toLowerCase() === f.q.toLowerCase())) {
            faqs.push({ id: uid("faq"), q: f.q, a: f.a, sourceId: f.sourceId });
          }
        }

        const areas = [...s0.knowledge.areas];
        for (const a of result.areas) {
          if (!areas.some((x) => x.toLowerCase() === a.toLowerCase())) areas.push(a);
        }

        const integrations = s0.integrations.map((i) =>
          result.toolIds.includes(i.id)
            ? { ...i, status: "connected" as const, detail: "Connected from Train Melo" }
            : i,
        );
        const connectors = [...s0.connectors];
        for (const t of result.unknownTools) {
          if (!connectors.some((c) => c.name.toLowerCase() === t.toLowerCase())) {
            connectors.push({ id: uid("cx"), name: t, baseUrl: "", auth: "noted", lastTest: "ok" });
          }
        }

        const run = {
          id: uid("train"),
          at: now,
          website: input.website.trim(),
          services: result.services.map((s) => s.name),
          areas: result.areas,
          toolsMatched: result.toolIds,
          faqsAdded: result.faqs.length,
        };

        set((s) => ({
          training: {
            ...(s.training ?? createSeed().training),
            website: input.website,
            description: input.description,
            tools: input.tools,
            lastRunAt: now,
            runs: [run, ...(s.training?.runs ?? [])].slice(0, 8),
          },
          knowledge: {
            ...s.knowledge,
            sources,
            services: mergeServices(s.knowledge.services, result.services),
            areas,
            faqs,
            hours: result.hours ?? s.knowledge.hours,
            afterHours: result.afterHours ?? s.knowledge.afterHours,
            bookingRules: result.bookingRules ?? s.knowledge.bookingRules,
            greeting: result.greeting ?? s.knowledge.greeting,
          },
          workspace: {
            ...s.workspace,
            widgetGreeting: result.widgetGreeting ?? s.workspace.widgetGreeting,
            brandName: s.workspace.brandName,
          },
          voice: result.greeting ? { ...s.voice, greeting: `${result.greeting} How can I help?` } : s.voice,
          integrations,
          connectors,
          notifications: [
            {
              id: uid("n"),
              at: now,
              title: "Melo trained",
              body: result.notes.slice(0, 2).join(" · ") || "Knowledge updated from your briefing.",
              href: "/knowledge",
              read: false,
            },
            ...s.notifications,
          ],
        }));
        get().log(`Trained Melo on ${host ?? "owner briefing"} — ${result.services.length} services, ${result.toolIds.length} tools`, "helix");
        toast.success("Melo studied it — Knowledge, Receptionist and the widget are live");
      },

      bookSlot: (staffId, start, jobId) => {
        const staff = get().staff.find((s) => s.id === staffId);
        const first = staff?.name.split(" ")[0] ?? "Tech";
        const end = addMinsIso(start, 90);
        set((s) => ({
          jobs: s.jobs.map((j) =>
            j.id === jobId
              ? {
                  ...j,
                  stage: "booked" as const,
                  assigneeId: staffId,
                  scheduledStart: start,
                  scheduledEnd: end,
                  nextAction: `${first} · ${timeOf(start)}`,
                  statusHistory: [
                    ...j.statusHistory,
                    { at: new Date().toISOString(), stage: "booked" as const, note: `Booked ${first} ${timeOf(start)}` },
                  ],
                }
              : j,
          ),
        }));
        get().log(`Booked ${staff?.name} at ${start}`, "dispatch");
        toast.success(`Booked ${first} · ${timeOf(start)}`);
      },

      moveJob: (jobId, stage) => {
        const labels: Record<JobStage, string> = {
          new: "New",
          quoted: "Quoted",
          booked: "Booked",
          on_site: "On site",
          won: "Won",
        };
        set((s) => ({
          jobs: s.jobs.map((j) =>
            j.id === jobId
              ? {
                  ...j,
                  stage,
                  nextAction: stage === "won" ? "Closed" : j.nextAction,
                  statusHistory: [...j.statusHistory, { at: new Date().toISOString(), stage, note: `Moved to ${labels[stage]}` }],
                }
              : j,
          ),
        }));
      },

      addJobNote: (jobId, text) => {
        const trimmed = text.trim();
        if (!trimmed) return;
        set((s) => ({
          jobs: s.jobs.map((j) =>
            j.id === jobId
              ? {
                  ...j,
                  notes: [...j.notes, { id: uid("n"), at: new Date().toISOString(), author: s.workspace.ownerName, text: trimmed }],
                }
              : j,
          ),
        }));
      },

      recordPayment: (jobId, invoiceId, amount, method) => {
        set((s) => ({
          jobs: s.jobs.map((j) => {
            if (j.id !== jobId) return j;
            const invoices = j.invoices.map((inv) => {
              if (inv.id !== invoiceId) return inv;
              const total = incGst(inv.items.reduce((n, i) => n + i.qty * i.sell, 0));
              const newPaid = j.payments.filter((p) => p.invoiceId === invoiceId).reduce((n, p) => n + p.amount, 0) + amount;
              const status = (newPaid >= total - 0.05 ? "paid" : "part_paid") as Invoice["status"];
              return { ...inv, status };
            });
            return {
              ...j,
              invoices,
              payments: [...j.payments, { id: uid("pay"), invoiceId, at: new Date().toISOString(), amount, method, note: "Recorded in Melo" }],
            };
          }),
        }));
        toast.success("Payment recorded");
      },

      updateWorkspace: (patch) => set((s) => ({ workspace: { ...s.workspace, ...patch } })),
      setIndustry: (industry) => {
        set((s) => ({ workspace: { ...s.workspace, industry } }));
        toast.success("Industry updated — labels will adapt");
      },
      updateVoice: (patch) => set((s) => ({ voice: { ...s.voice, ...patch } })),
      setPlan: (planId, cadence) => {
        const plan = planById(planId);
        set((s) => ({
          billing: {
            ...s.billing,
            planId,
            cadence,
            cancelAt: null,
            trialEndsAt: planId === s.billing.planId ? s.billing.trialEndsAt : null,
          },
        }));
        toast.success(`Switched to ${plan.name} · ${cadence}. Change again anytime.`);
      },
      toggleAddon: (id) =>
        set((s) => ({
          billing: { ...s.billing, addons: s.billing.addons.map((a) => (a.id === id ? { ...a, on: !a.on } : a)) },
        })),
      cancelPlan: () => {
        set((s) => ({ billing: { ...s.billing, cancelAt: s.billing.renewal } }));
        toast.message("Cancellation scheduled at period end — reactivate anytime");
      },
      reactivatePlan: () => {
        set((s) => ({ billing: { ...s.billing, cancelAt: null } }));
        toast.success("Subscription reactivated");
      },
      updateCard: (card) => {
        set((s) => ({ billing: { ...s.billing, card } }));
        toast.success("Card saved");
      },
      toggleIntegration: (id) => {
        set((s) => ({
          integrations: s.integrations.map((i) =>
            i.id === id
              ? { ...i, status: i.status === "connected" ? "available" : "connected", detail: i.status === "connected" ? "Disconnected" : "Connected just now" }
              : i,
          ),
        }));
      },
      connectApp: (id, detail) => {
        set((s) => ({
          integrations: s.integrations.map((i) => (i.id === id ? { ...i, status: "connected" as const, detail } : i)),
        }));
        const name = get().integrations.find((i) => i.id === id)?.name ?? "App";
        toast.success(`${name} connected`);
      },
      disconnectApp: (id) => {
        const name = get().integrations.find((i) => i.id === id)?.name ?? "App";
        set((s) => ({
          integrations: s.integrations.map((i) => (i.id === id ? { ...i, status: "available" as const, detail: "Disconnected" } : i)),
        }));
        toast.message(`${name} disconnected`);
      },
      syncChannelStatus: (channels) => {
        const map: Record<string, string> = {
          voice: "twilio",
          whatsapp: "whatsapp",
          instagram: "instagram",
          messenger: "messenger",
          facebook: "facebook",
          imessage: "imessage",
        };
        set((s) => ({
          integrations: s.integrations.map((i) => {
            const hit = channels.find((c) => map[c.kind] === i.id);
            if (!hit) return i;
            return {
              ...i,
              status: hit.status,
              detail: hit.detail || i.detail,
            };
          }),
          workspace:
            channels.find((c) => c.kind === "voice" && c.externalId)
              ? { ...s.workspace, number: channels.find((c) => c.kind === "voice")!.externalId! }
              : s.workspace,
        }));
      },
      applyLiveCall: (row) => {
        const phase = (row.phase === "hold" || row.phase === "ended" || row.phase === "queued" ? row.phase : "live") as CallPhase;
        const from = row.from;
        let customer = get().customers.find((c) => c.phone.replace(/\s/g, "") === from.replace(/\s/g, "") || c.phone === from);
        if (!customer) {
          customer = {
            id: uid("cust"),
            name: from,
            phone: from,
            email: "",
            sites: [],
            tags: [],
            since: row.startedAt,
            notes: "",
          };
          set((s) => ({ customers: [...s.customers, customer!] }));
        }
        const transcript = row.transcript.map((t) => ({
          at: t.at,
          speaker: (t.speaker === "owner" || t.speaker === "receptionist" ? t.speaker : "customer") as "customer" | "receptionist" | "owner",
          text: t.text,
        }));
        const liveCall = {
          id: row.id,
          customerId: customer.id,
          from,
          to: row.to,
          suburb: customer.sites[0]?.suburb ?? "",
          reason: row.reason || "Inbound",
          phase,
          startedAt: row.startedAt,
          muted: get().liveCall?.id === row.id ? get().liveCall!.muted : false,
          transcript,
          summary: row.summary ?? undefined,
          twilioSid: row.id,
        };
        set({ liveCall });
      },
      toggleAutomation: (id) =>
        set((s) => ({ automations: s.automations.map((a) => (a.id === id ? { ...a, on: !a.on } : a)) })),
      addConnector: (name, baseUrl, auth) => {
        set((s) => ({
          connectors: [...s.connectors, { id: uid("cx"), name, baseUrl, auth, lastTest: "ok" }],
        }));
        toast.success("Connector saved · test request 200");
      },
      liveControl: (action) => {
        const call = get().liveCall;
        if (!call) return;
        if (action === "mute") set({ liveCall: { ...call, muted: !call.muted } });
        if (action === "hold") set({ liveCall: { ...call, phase: "hold" } });
        if (action === "resume") set({ liveCall: { ...call, phase: "live" } });
        if (action === "end") {
          const ended = {
            ...call,
            phase: "ended" as const,
            summary: call.summary ?? "Call ended.",
          };
          set((s) => ({
            liveCall: ended,
            receptionTab: "detail",
            recentCalls: [ended, ...s.recentCalls.filter((c) => c.id !== ended.id)],
          }));
          toast.success("Call ended · summary ready");
        }
        if (action === "barge") {
          set({
            liveCall: {
              ...call,
              transcript: [
                ...call.transcript,
                { at: new Date().toISOString(), speaker: "owner", text: "Alex here — I’ve got Dez on the Burwood run, he’ll take it at ten." },
              ],
            },
          });
        }
      },
      transferCall: (staffId) => {
        const staff = get().staff.find((s) => s.id === staffId);
        toast.success(`Warm transfer ringing ${staff?.name ?? "staff"}`);
        const call = get().liveCall;
        if (call) {
          const ended = { ...call, phase: "ended" as const, summary: `Transferred to ${staff?.name ?? "staff"}.` };
          set((s) => ({ liveCall: ended, recentCalls: [ended, ...s.recentCalls.filter((c) => c.id !== ended.id)] }));
        }
      },
      resetDemo: () => {
        const seed = createSeed();
        set({ ...seed, ...uiDefaults });
        toast.success("Office reset");
      },
      hydrateOffice: (input) => {
        const fresh = createFreshOffice(input);
        set({ ...fresh, ...uiDefaults });
      },
      markNotifsRead: () => set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
      markNotifRead: (id: string) =>
        set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
      log: (text, agentId) =>
        set((s) => ({
          activity: [{ id: uid("ac"), at: new Date().toISOString(), actor: agentId ? s.agents.find((a) => a.id === agentId)?.name ?? "Helix" : "Alex", agentId, text }, ...s.activity],
        })),
    }),
    {
      name: "melo-office-v2",
      version: 1,
      skipHydration: true,
      storage: createJSONStorage(() => localStorage),
      migrate: (persisted) => {
        const p = persisted as Record<string, unknown>;
        const { plans: _drop, ...rest } = p;
        const billing = (rest.billing ?? {}) as Record<string, unknown>;
        const seed = createSeed();
        const persistedJobs = Array.isArray(rest.jobs) ? (rest.jobs as MeloData["jobs"]) : seed.jobs;
        const jobs = persistedJobs.map((j) => {
          const fromSeed = seed.jobs.find((s) => s.id === j.id);
          let invoices = j.invoices;
          if (fromSeed?.invoices.length) {
            const have = new Set(j.invoices.map((i) => i.id));
            const extra = fromSeed.invoices.filter((i) => !have.has(i.id));
            if (extra.length) invoices = [...j.invoices, ...extra];
          }
          let quote = j.quote;
          if (quote && quote.status === "sent" && !quote.signature) {
            quote = {
              ...quote,
              signature: {
                status: "awaiting",
                sentAt: quote.sentAt,
                sentChannel: j.channel === "email" || j.channel === "sms" || j.channel === "whatsapp" ? j.channel : "email",
              },
            };
          }
          if (fromSeed?.quote?.signature && quote && !quote.signature) {
            quote = { ...quote, signature: fromSeed.quote.signature };
          }
          return { ...j, invoices, quote };
        });
        return {
          ...rest,
          jobs,
          invoiceTemplates:
            Array.isArray(rest.invoiceTemplates) && (rest.invoiceTemplates as unknown[]).length
              ? rest.invoiceTemplates
              : seed.invoiceTemplates,
          invoiceSends: Array.isArray(rest.invoiceSends) ? rest.invoiceSends : [],
          training: (rest.training as MeloData["training"]) ?? seed.training,
          mcpServers: Array.isArray((rest as MeloData).mcpServers) && (rest as MeloData).mcpServers.length
            ? (rest as MeloData).mcpServers
            : seed.mcpServers,
          agents: (Array.isArray(rest.agents) ? rest.agents : seed.agents).map((a) => {
            const g = grantsFor(a.id);
            return {
              ...a,
              integrationIds: a.integrationIds?.length ? a.integrationIds : g.apps,
              mcpIds: a.mcpIds?.length ? a.mcpIds : g.mcp,
            };
          }),
          billing: {
            ...seed.billing,
            planId: billing.planId ?? seed.billing.planId,
            cadence: billing.cadence ?? seed.billing.cadence,
            contact: billing.contact ?? seed.billing.contact,
            usage: billing.usage ?? seed.billing.usage,
          },
        };
      },
      partialize: (s) => ({
        workspace: s.workspace,
        staff: s.staff,
        customers: s.customers,
        agents: s.agents,
        marketplace: s.marketplace,
        conversations: s.conversations,
        jobs: s.jobs,
        holds: s.holds,
        knowledge: s.knowledge,
        reviewItems: s.reviewItems,
        integrations: s.integrations,
        automations: s.automations,
        content: s.content,
        sequences: s.sequences,
        activity: s.activity,
        chat: s.chat,
        notifications: s.notifications,
        voice: s.voice,
        billing: s.billing,
        liveCall: s.liveCall,
        recentCalls: s.recentCalls,
        connectors: s.connectors,
        mcpServers: s.mcpServers,
        invoiceTemplates: s.invoiceTemplates,
        invoiceSends: s.invoiceSends,
        training: s.training,
        selectedConversationId: s.selectedConversationId,
        selectedJobId: s.selectedJobId,
        selectedReviewId: s.selectedReviewId,
        settingsTab: s.settingsTab,
        widgetMessages: s.widgetMessages,
        widgetStep: s.widgetStep,
        checklistHidden: s.checklistHidden,
      }),
    },
  ),
);

export function useLabels() {
  const industry = useMelo((s) => s.workspace.industry);
  return industry;
}
