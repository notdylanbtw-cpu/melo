export type Channel = "voice" | "sms" | "whatsapp" | "instagram" | "email" | "widget" | "messenger" | "facebook" | "imessage";
export type Autopilot = "ask" | "draft" | "act";
export type AgentStatus = "idle" | "working" | "waiting" | "offline";
export type JobStage = "new" | "quoted" | "booked" | "on_site" | "won";
export type InvoiceStatus =
  | "draft"
  | "awaiting_approval"
  | "sent"
  | "viewed"
  | "part_paid"
  | "paid"
  | "overdue"
  | "void";
export type ReviewKind = "quote" | "content" | "money" | "message";
export type ReviewStatus = "pending" | "approved" | "rejected";
export type Industry =
  | "trades"
  | "hospitality"
  | "clinics"
  | "salons"
  | "retail"
  | "property"
  | "professional"
  | "agencies";
export type ContentStatus = "draft" | "scheduled" | "live" | "gbp";
export type IntegrationStatus = "connected" | "needs_attention" | "available";
export type CallPhase = "live" | "hold" | "ended" | "queued";
export type HomeMode = "command" | "dashboard";
export type BillingCadence = "monthly" | "annual";

export type Site = {
  id: string;
  label: string;
  address: string;
  suburb: string;
  state: string;
  postcode: string;
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  company?: string;
  sites: Site[];
  tags: string[];
  since: string;
  notes: string;
};

export type StaffMember = {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  color: string;
  skills: string[];
};

export type Agent = {
  id: string;
  name: string;
  role: string;
  blurb: string;
  portrait: string | null;
  color: string;
  status: AgentStatus;
  currentTask: string | null;
  tools: string[];
  permissions: ("read" | "draft" | "write" | "call")[];
  autopilot: Autopilot;
  voice?: string;
  taskCount: number;
  handlesCalls: boolean;
  hired: boolean;
  custom?: boolean;
  marketplaceId?: string;
  integrationIds: string[];
  mcpIds: string[];
};

export type MarketplaceAgent = {
  id: string;
  name: string;
  role: string;
  blurb: string;
  portrait: string;
  color: string;
  tools: string[];
  handlesCalls: boolean;
  preview: string;
  pack?: string;
};

export type Message = {
  id: string;
  at: string;
  from: "customer" | "agent" | "staff" | "system";
  author: string;
  text: string;
  channel: Channel;
};

export type Conversation = {
  id: string;
  customerId: string;
  channel: Channel;
  subject: string;
  preview: string;
  updatedAt: string;
  unread: number;
  assignedAgentId?: string;
  jobId?: string;
  messages: Message[];
};

export type LineItem = {
  id: string;
  kind: "labour" | "material" | "callout" | "travel" | "other";
  description: string;
  qty: number;
  unit: string;
  cost: number;
  sell: number;
  optional?: boolean;
};

export type LabourEntry = {
  id: string;
  staffId: string;
  date: string;
  hours: number;
  rateCost: number;
  note: string;
};

export type Quote = {
  id: string;
  number: string;
  status: "draft" | "in_review" | "sent" | "accepted" | "declined" | "expired";
  issuedAt: string;
  expiry: string;
  terms: string;
  depositPct: number;
  discount: number;
  items: LineItem[];
  sentAt?: string;
  decidedAt?: string;
  signature?: QuoteSignature;
};

export type QuoteSignature = {
  status: "awaiting" | "signed" | "declined";
  sentAt?: string;
  sentChannel?: "email" | "sms" | "whatsapp";
  signedAt?: string;
  signerName?: string;
  method?: "drawn" | "typed";
  image?: string;
};


export type Invoice = {
  id: string;
  number: string;
  kind: "deposit" | "progress" | "final" | "recurring";
  status: InvoiceStatus;
  issuedAt: string;
  dueAt: string;
  items: LineItem[];
  discount: number;
  xeroSync: "synced" | "pending" | "error" | "off";
  viewedAt?: string;
  sentAt?: string;
  sentChannel?: "email" | "sms" | "whatsapp";
  sentTo?: string;
};

export type InvoiceTemplateKind = "invoice" | "deposit" | "reminder" | "overdue";

export type InvoiceTemplate = {
  id: string;
  name: string;
  kind: InvoiceTemplateKind;
  channel: "email" | "sms";
  subject: string;
  body: string;
};

export type InvoiceSend = {
  id: string;
  invoiceId: string;
  jobId: string;
  templateId: string;
  channel: "email" | "sms" | "whatsapp";
  to: string;
  subject: string;
  body: string;
  sentAt: string;
};

export type Payment = {
  id: string;
  invoiceId: string;
  at: string;
  amount: number;
  method: "stripe" | "square" | "cash" | "eft" | "card";
  note: string;
};

export type JobNote = {
  id: string;
  at: string;
  author: string;
  text: string;
};

export type Job = {
  id: string;
  number: string;
  title: string;
  stage: JobStage;
  customerId: string;
  siteId: string;
  suburb: string;
  value: number;
  assigneeId: string | null;
  nextAction: string;
  channel: Channel;
  scheduledStart?: string;
  scheduledEnd?: string;
  travelMins?: number;
  workOrder?: string;
  scope: string;
  items: LineItem[];
  labour: LabourEntry[];
  quote?: Quote;
  invoices: Invoice[];
  payments: Payment[];
  notes: JobNote[];
  attachments: { id: string; name: string; kind: string }[];
  statusHistory: { at: string; stage: JobStage; note: string }[];
};

export type CalendarHold = {
  id: string;
  staffId: string;
  start: string;
  end: string;
  kind: "travel" | "break";
  label: string;
};

export type KnowledgeSource = {
  id: string;
  name: string;
  kind: "website" | "price_book" | "job_system" | "transcripts" | "manual";
  status: "synced" | "syncing" | "needs_review";
  updatedAt: string;
  coverage: number;
};

export type KnowledgeService = {
  id: string;
  name: string;
  summary: string;
  priceFrom: number;
  afterHoursFrom: number;
  durationMins: number;
  active: boolean;
};

export type Knowledge = {
  sources: KnowledgeSource[];
  services: KnowledgeService[];
  areas: string[];
  faqs: { id: string; q: string; a: string; sourceId: string }[];
  hours: string;
  afterHours: string;
  bookingRules: string;
  greeting: string;
};

export type ReviewItem = {
  id: string;
  kind: ReviewKind;
  title: string;
  summary: string;
  agentId: string;
  status: ReviewStatus;
  createdAt: string;
  sources: string[];
  preview: string;
  jobId?: string;
  conversationId?: string;
  contentId?: string;
  history: { at: string; text: string }[];
};

export type Integration = {
  id: string;
  name: string;
  group: "voice" | "calendar" | "jobs" | "payments" | "accounting" | "crm" | "mail" | "social" | "web" | "collab";
  status: IntegrationStatus;
  detail: string;
};

export type Automation = {
  id: string;
  name: string;
  trigger: string;
  action: string;
  on: boolean;
};

export type ContentItem = {
  id: string;
  title: string;
  kind: "blog" | "service" | "gbp";
  status: ContentStatus;
  suburb: string;
  demand: string;
  scheduledFor?: string;
  body: string;
  agentId: string;
};

export type Sequence = {
  id: string;
  name: string;
  trigger: string;
  enrolled: number;
  active: boolean;
  steps: string[];
};

export type ActivityItem = {
  id: string;
  at: string;
  actor: string;
  agentId?: string;
  text: string;
  href?: string;
};

export type ChatChip = {
  id: string;
  label: string;
  action: "book" | "open_review" | "open_job" | "open_inbox" | "draft_quote" | "run" | "approve_send";
  payload?: Record<string, string>;
};

export type ChatMessage = {
  id: string;
  at: string;
  role: "user" | "melo" | "system";
  text: string;
  chips?: ChatChip[];
  agentId?: string;
};

export type NotificationItem = {
  id: string;
  at: string;
  title: string;
  body: string;
  href?: string;
  read: boolean;
};

export type VoiceSettings = {
  locale: string;
  voice: string;
  warmth: number;
  pace: number;
  greeting: string;
  bargeIn: boolean;
  transferRules: string;
  afterHours: string;
  elevenKey?: string;
  elevenVoiceId?: string;
};

export type Workspace = {
  name: string;
  industry: Industry;
  ownerName: string;
  ownerEmail: string;
  number: string;
  timezone: string;
  abn: string;
  address: string;
  brandName: string;
  brandPrimary: string;
  widgetGreeting: string;
};

export type Plan = {
  id: string;
  name: string;
  cadence: BillingCadence;
  priceMonthly: number;
  seats: number;
  voiceMinutes: number;
  automations: number;
  teamMembers: number;
  blurb: string;
  features: string[];
};

export type BillingCard = {
  brand: "visa" | "mastercard" | "amex";
  last4: string;
  expMonth: number;
  expYear: number;
  name: string;
};

export type BillingAddon = {
  id: string;
  name: string;
  on: boolean;
  note: string;
  priceMonthly: number;
};

export type BillingInvoice = {
  id: string;
  number: string;
  at: string;
  exGst: number;
  status: "paid" | "open";
};

export type ApiKey = {
  id: string;
  name: string;
  prefix: string;
  last4: string;
  createdAt: string;
  lastUsedAt: string | null;
};

export type BillingState = {
  planId: string;
  cadence: BillingCadence;
  renewal: string;
  contact: string;
  card: BillingCard | null;
  cancelAt: string | null;
  trialEndsAt: string | null;
  invoices: BillingInvoice[];
  addons: BillingAddon[];
  apiKeys: ApiKey[];
  usage: {
    seats: number;
    voiceMinutes: number;
    automations: number;
    teamMembers: number;
    reset: string;
  };
};


export type LiveCall = {
  id: string;
  customerId: string;
  from: string;
  suburb: string;
  reason: string;
  phase: CallPhase;
  startedAt: string;
  muted: boolean;
  transcript: { at: string; speaker: "customer" | "receptionist" | "owner"; text: string }[];
  summary?: string;
  recording?: boolean;
  twilioSid?: string;
  to?: string;
};

export type CustomConnector = {
  id: string;
  name: string;
  baseUrl: string;
  auth: string;
  lastTest?: "ok" | "fail";
};

export type McpServer = {
  id: string;
  name: string;
  kind: "native" | "custom";
  url: string;
  tools: string[];
  status: "connected" | "available" | "error";
  detail: string;
};

export type MeloData = {
  workspace: Workspace;
  staff: StaffMember[];
  customers: Customer[];
  agents: Agent[];
  marketplace: MarketplaceAgent[];
  conversations: Conversation[];
  jobs: Job[];
  holds: CalendarHold[];
  knowledge: Knowledge;
  reviewItems: ReviewItem[];
  integrations: Integration[];
  automations: Automation[];
  content: ContentItem[];
  sequences: Sequence[];
  activity: ActivityItem[];
  chat: ChatMessage[];
  notifications: NotificationItem[];
  voice: VoiceSettings;
  billing: BillingState;
  plans: Plan[];
  liveCall: LiveCall | null;
  recentCalls: LiveCall[];
  connectors: CustomConnector[];
  mcpServers: McpServer[];
  invoiceTemplates: InvoiceTemplate[];
  invoiceSends: InvoiceSend[];
  training: TrainingState;
};

export type TrainingState = {
  website: string;
  description: string;
  tools: string;
  lastRunAt?: string;
  runs: TrainingRun[];
};

export type TrainingRun = {
  id: string;
  at: string;
  website: string;
  services: string[];
  areas: string[];
  toolsMatched: string[];
  faqsAdded: number;
};
