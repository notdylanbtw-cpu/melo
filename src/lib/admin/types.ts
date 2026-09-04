export type AdminPlan = "starter" | "growth" | "firm";
export type TenantStatus = "active" | "trial" | "past_due" | "cancelled";
export type TicketStatus = "open" | "waiting" | "closed";
export type ContentKind = "gbp" | "blog" | "service_page" | "quote" | "sms" | "widget";

export type Tenant = {
  id: string;
  name: string;
  industry: string;
  owner: string;
  email: string;
  plan: AdminPlan;
  mrr: number;
  status: TenantStatus;
  startedAt: string;
  seats: number;
  suburb: string;
  lastActiveAt: string;
};

export type DailyPoint = {
  date: string;
  newSubs: number;
  churned: number;
  mrr: number;
  content: number;
  tickets: number;
  voiceMinutes: number;
};

export type ContentEvent = {
  id: string;
  tenantId: string;
  kind: ContentKind;
  title: string;
  at: string;
  agent: string;
};

export type TicketMessage = {
  id: string;
  at: string;
  from: "customer" | "melo";
  author: string;
  text: string;
};

export type Ticket = {
  id: string;
  number: string;
  tenantId: string;
  from: string;
  email: string;
  subject: string;
  status: TicketStatus;
  priority: "low" | "normal" | "high";
  createdAt: string;
  updatedAt: string;
  messages: TicketMessage[];
};

export type AdminData = {
  tenants: Tenant[];
  series: DailyPoint[];
  content: ContentEvent[];
  tickets: Ticket[];
};
