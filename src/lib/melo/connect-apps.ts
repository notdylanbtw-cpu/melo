export type AppScope = { title: string; hint: string };

export type AppMeta = {
  id: string;
  logo?: string;
  color: string;
  tagline: string;
  scopes: AppScope[];
};

export const APP_LOGO: Record<string, string> = {
  twilio: "/logos/twilio.svg?v=real",
  gcal: "/logos/googlecalendar.svg?v=real",
  outlook: "/logos/microsoftoutlook.svg?v=real",
  servicem8: "/logos/servicem8.svg?v=real",
  jobber: "/logos/jobber.svg?v=real",
  fergus: "/logos/fergus.svg?v=real",
  simpro: "/logos/simpro.svg?v=real",
  stripe: "/logos/stripe.svg?v=real",
  square: "/logos/square.svg?v=real",
  xero: "/logos/xero.svg?v=real",
  qbo: "/logos/quickbooks.svg?v=real",
  myob: "/logos/myob.svg?v=real",
  hubspot: "/logos/hubspot.svg?v=real",
  pipedrive: "/logos/pipedrive.svg?v=real",
  gmail: "/logos/gmail.svg?v=real",
  olmail: "/logos/microsoftoutlook.svg?v=real",
  whatsapp: "/logos/whatsapp.svg?v=real",
  instagram: "/logos/instagram.svg?v=real",
  messenger: "/logos/messenger.svg?v=real",
  facebook: "/logos/facebook.svg?v=real",
  shopify: "/logos/shopify.svg?v=real",
  slack: "/logos/slack.svg?v=real",
  zapier: "/logos/zapier.svg?v=real",
  gbp: "/logos/google.svg?v=real",
};

export const APP_META: Record<string, AppMeta> = {
  twilio: {
    id: "twilio",
    color: "#F22F46",
    tagline: "Melo number — we buy it, we host it",
    scopes: [
      { title: "Answer inbound calls", hint: "Receptionist picks up as you, 24/7. Melo pays the carrier." },
      { title: "Send and receive SMS", hint: "Windows, quotes and missed-call follow-up on the same number" },
      { title: "Transfer to your mobile", hint: "Warm handoff when they ask for a person" },
    ],
  },
  telnyx: {
    id: "telnyx",
    color: "#1D1D1F",
    tagline: "Alternate voice trunk",
    scopes: [
      { title: "Route inbound voice", hint: "Same receptionist, different carrier" },
      { title: "SMS on the trunk", hint: "If the number supports it" },
    ],
  },
  gcal: {
    id: "gcal",
    color: "#4285F4",
    tagline: "Staff columns and travel",
    scopes: [
      { title: "See busy/free", hint: "Sam, Dez, Alex — windows that actually fit" },
      { title: "Create and move events", hint: "Booked jobs land on the calendar" },
      { title: "Read event details", hint: "Suburb, travel buffer, who is on it" },
    ],
  },
  outlook: {
    id: "outlook",
    color: "#0078D4",
    tagline: "Microsoft calendar",
    scopes: [
      { title: "See busy/free", hint: "Staff calendars in Outlook" },
      { title: "Create events", hint: "Booked jobs write back" },
    ],
  },
  servicem8: {
    id: "servicem8",
    color: "#1877F2",
    tagline: "Jobs and dispatch",
    scopes: [
      { title: "Read jobs and clients", hint: "Keep Melo’s pipeline in sync" },
      { title: "Create jobs", hint: "A booked call becomes a job in ServiceM8" },
    ],
  },
  jobber: {
    id: "jobber",
    color: "#FF4612",
    tagline: "Jobs and visits",
    scopes: [
      { title: "Read jobs and clients", hint: "Pipeline stays one list" },
      { title: "Create visits", hint: "Windows Melo books write into Jobber" },
    ],
  },
  fergus: {
    id: "fergus",
    color: "#111111",
    tagline: "Trades job board",
    scopes: [
      { title: "Read the status board", hint: "So Dispatch isn’t guessing" },
      { title: "Create jobs", hint: "From a signed quote or a booked call" },
    ],
  },
  simpro: {
    id: "simpro",
    color: "#F15A24",
    tagline: "Job costing",
    scopes: [
      { title: "Read jobs and quotes", hint: "Price book stays yours" },
      { title: "Push invoices", hint: "When you approve in Review" },
    ],
  },
  stripe: {
    id: "stripe",
    color: "#635BFF",
    tagline: "Take payment",
    scopes: [
      { title: "Create payment links", hint: "On invoices you approve" },
      { title: "See payment status", hint: "Paid jobs close in Pipeline" },
    ],
  },
  square: {
    id: "square",
    color: "#3E4348",
    tagline: "Card present",
    scopes: [
      { title: "Create charges", hint: "On-site or payment link" },
      { title: "See settlements", hint: "Mark the invoice paid" },
    ],
  },
  xero: {
    id: "xero",
    color: "#13B5EA",
    tagline: "Invoices and contacts",
    scopes: [
      { title: "Read contacts", hint: "Customers Melo already knows" },
      { title: "Create invoices", hint: "Only after you approve in Review" },
      { title: "Mark paid", hint: "When Stripe or cash lands" },
    ],
  },
  qbo: {
    id: "qbo",
    color: "#2CA01C",
    tagline: "QuickBooks invoices",
    scopes: [
      { title: "Read customers", hint: "Match Melo clients" },
      { title: "Create invoices", hint: "On your approval" },
    ],
  },
  myob: {
    id: "myob",
    color: "#6C3CE1",
    tagline: "AU books",
    scopes: [
      { title: "Read contacts", hint: "Customers and jobs" },
      { title: "Create invoices", hint: "On your approval" },
    ],
  },
  hubspot: {
    id: "hubspot",
    color: "#FF7A59",
    tagline: "CRM records",
    scopes: [
      { title: "Read contacts and deals", hint: "Inbox threads match a person" },
      { title: "Create notes", hint: "What the receptionist took down" },
    ],
  },
  pipedrive: {
    id: "pipedrive",
    color: "#017737",
    tagline: "Pipeline CRM",
    scopes: [
      { title: "Read deals", hint: "Quotes Melo is chasing" },
      { title: "Move stages", hint: "When a quote is signed" },
    ],
  },
  gmail: {
    id: "gmail",
    color: "#EA4335",
    tagline: "Mail as the office",
    scopes: [
      { title: "Read mail", hint: "Inbox threads for Receptionist and Scout" },
      { title: "Send mail as you", hint: "Quotes and invoices — only after Review" },
      { title: "See your address", hint: "So the office is from you, not a bot" },
    ],
  },
  olmail: {
    id: "olmail",
    color: "#0078D4",
    tagline: "Outlook mail",
    scopes: [
      { title: "Read mail", hint: "Same inbox, Microsoft" },
      { title: "Send mail as you", hint: "After you approve in Review" },
    ],
  },
  whatsapp: {
    id: "whatsapp",
    color: "#25D366",
    tagline: "On your Melo number",
    scopes: [
      { title: "Receive messages", hint: "They land in Inbox next to the call" },
      { title: "Send replies", hint: "Windows, quotes, follow-ups" },
    ],
  },
  instagram: {
    id: "instagram",
    color: "#E1306C",
    tagline: "DMs",
    scopes: [
      { title: "Read DMs", hint: "One thread with the rest of Inbox" },
      { title: "Reply as the page", hint: "Same voice as the phone" },
    ],
  },
  messenger: {
    id: "messenger",
    color: "#006AFF",
    tagline: "Page DMs",
    scopes: [
      { title: "Read page messages", hint: "Facebook into Inbox" },
      { title: "Reply as the page", hint: "On your autopilot rules" },
    ],
  },
  facebook: {
    id: "facebook",
    color: "#1877F2",
    tagline: "Page",
    scopes: [
      { title: "Manage the page inbox", hint: "Comments and messages" },
      { title: "Post when you approve", hint: "Quill drafts sit in Review" },
    ],
  },
  imessage: {
    id: "imessage",
    color: "#34C759",
    tagline: "Blue bubbles on your Melo number",
    scopes: [
      { title: "Receive iMessage", hint: "Melo hosts the sender — no Sendblue account" },
      { title: "Send iMessage", hint: "Same thread as SMS" },
    ],
  },
  wordpress: {
    id: "wordpress",
    color: "#21759B",
    tagline: "Site content",
    scopes: [
      { title: "Read posts and pages", hint: "Train Melo on what you already published" },
      { title: "Create drafts", hint: "Quill files them in Review first" },
    ],
  },
  shopify: {
    id: "shopify",
    color: "#96BF48",
    tagline: "Orders and catalogue",
    scopes: [
      { title: "Read products and orders", hint: "Receptionist can quote from stock" },
      { title: "Create draft orders", hint: "On your approval" },
    ],
  },
  webflow: {
    id: "webflow",
    color: "#4353FF",
    tagline: "CMS",
    scopes: [
      { title: "Read CMS items", hint: "Services Melo should know" },
      { title: "Create drafts", hint: "After Review" },
    ],
  },
  gbp: {
    id: "gbp",
    color: "#4285F4",
    tagline: "Google listing",
    scopes: [
      { title: "Read reviews and posts", hint: "Reach knows what’s live" },
      { title: "Publish posts", hint: "Quill drafts — you approve" },
    ],
  },
  slack: {
    id: "slack",
    color: "#4A154B",
    tagline: "Team alerts",
    scopes: [
      { title: "Post to channels you pick", hint: "Job booked, after-hours, quote signed" },
      { title: "Read channel names", hint: "So alerts land in the right place" },
    ],
  },
  teams: {
    id: "teams",
    color: "#6264A7",
    tagline: "Microsoft Teams",
    scopes: [
      { title: "Post alerts", hint: "Same as Slack, in Teams" },
    ],
  },
  zapier: {
    id: "zapier",
    color: "#FF4A00",
    tagline: "Zaps out of Melo",
    scopes: [
      { title: "Trigger zaps", hint: "Job booked, invoice paid, missed call" },
      { title: "Receive zap events", hint: "A form on your site can open a job" },
    ],
  },
};

export function metaFor(id: string, name: string): AppMeta {
  return (
    APP_META[id] ?? {
      id,
      color: "#111",
      tagline: "Connect to the office",
      scopes: [
        { title: "Read records Melo needs", hint: "Jobs, people, the book" },
        { title: "Write when you approve", hint: "Nothing sends without Review if autopilot is off" },
      ],
    }
  );
}
