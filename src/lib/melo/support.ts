export type SupportLink = { label: string; href: string };
export type SupportReply = { text: string; chips?: string[]; links?: SupportLink[] };

export const SUPPORT_GREETING =
  "I’m Melo. Ask about plans, the phone, the computer, or how to get set up.";

export const SUPPORT_CHIPS_WEB = ["Plans", "7-day trial", "The phone", "Melo Computer"];
export const SUPPORT_CHIPS_APP = ["Connect WhatsApp", "Train Melo", "Send a quote", "Plans"];

const HELP: { keys: string[]; reply: SupportReply }[] = [
  {
    keys: ["plan", "price", "pricing", "cost", "how much", "basic", "pro", "agency", "subscription"],
    reply: {
      text: "Three plans, billed monthly, AUD ex GST.\n\n• Basic A$249 — receptionist, number, computer, inbox, calendar. 400 voice minutes.\n• Pro A$449 — the full firm: quotes, e-signature, invoices, reach, review. 1,000 minutes. Seven-day trial starts here.\n• Agency A$999 — API keys, custom connectors, specialist packs, 2,000 minutes.\n\nOverage is A$0.55 / min. Change plan anytime in Billing.",
      chips: ["What’s in Pro?", "What’s in Agency?", "Start trial"],
      links: [{ label: "See plans", href: "/pricing" }],
    },
  },
  {
    keys: ["trial", "free", "day 8", "card"],
    reply: {
      text: "Pro includes a 7-day trial. Card at signup — nothing bills until day 8 unless you cancel in Billing. 80 voice minutes on the trial, then the Pro cap.",
      chips: ["Plans", "Cancel"],
      links: [{ label: "Start free trial", href: "/signup" }],
    },
  },
  {
    keys: ["cancel", "refund"],
    reply: {
      text: "Cancel in Billing. Access stays until the period ends. The trial doesn’t convert if you cancel before day 8.",
      links: [{ label: "Billing", href: "/app/settings" }],
    },
  },
  {
    keys: ["phone", "call", "receptionist", "twilio", "number", "voice", "minutes", "eleven"],
    reply: {
      text: "Melo answers as you. Point the number you already have, or we issue one. Isla is the Australian receptionist — hosted by Melo, included in every plan.\n\nAfter hours it still picks up. Transfer, take a message, or book a window. Minutes are on the plan; overage is A$0.55 / min.",
      chips: ["Connect a number", "Plans"],
    },
  },
  {
    keys: ["computer", "24/7", "24 / 7", "browser", "always on"],
    reply: {
      text: "Melo has its own computer. Close the tab — the receptionist still answers, the inbox still files, taught tasks still run. Logged into the tools you keep. Teach a task once, Melo runs it again.",
    },
  },
  {
    keys: ["whatsapp", "instagram", "messenger", "facebook", "imessage", "sms", "connect"],
    reply: {
      text: "Inbox is one place: phone, SMS, WhatsApp, Instagram, Messenger, email and the website widget. Open Connect, pick the channel, approve Melo. Each office has its own connections — nothing mixes.",
      chips: ["Website widget", "Train Melo"],
      links: [{ label: "Open Connect", href: "/app/connect" }],
    },
  },
  {
    keys: ["widget", "website", "snippet", "enquiry"],
    reply: {
      text: "Paste this on your site. Enquiries land in Inbox, same knowledge as the receptionist.\n\n<script src=\"https://officialmelo.com/widget.js\" data-melo=\"your-office\" async></script>",
      links: [{ label: "Connect", href: "/app/connect" }],
    },
  },
  {
    keys: ["quote", "invoice", "esign", "e-sign", "sign"],
    reply: {
      text: "Ask Melo: “create a quote for email … ” — it prices from the book, then waits for you to approve send. The client’s e-signature is the job approval. Invoices use the same templates. Pro and Agency.",
      links: [{ label: "Pipeline", href: "/app/pipeline" }],
    },
  },
  {
    keys: ["train", "website", "learn", "quiz", "knowledge"],
    reply: {
      text: "On signup, Melo asks what the business does and the website. After that: Settings → Train Melo. Paste the site, the work, the tools you already use. Receptionist, Ask Melo and the widget all use that knowledge.",
      links: [{ label: "Train Melo", href: "/app/settings" }],
    },
  },
  {
    keys: ["say", "pronounc", "mellow", "mee-low", "me-low", "me low"],
    reply: {
      text: "Me-low. Two beats — me, then low. Not mellow.",
    },
  },
  {
    keys: ["google", "login", "sign in", "xai", "grok", "2fa"],
    reply: {
      text: "Email, or Continue with Google — the consent screen is Melo AI. 2FA is in Settings. Admin is a separate login; customers never see it.",
      links: [{ label: "Sign in", href: "/login" }],
    },
  },
  {
    keys: ["api", "agency", "white-label", "sso"],
    reply: {
      text: "Agency (A$999) adds API keys, custom connectors, specialist packs, SSO-ready workspace and 2,000 voice minutes. If you want Melo inside something else, that’s the plan.",
      links: [{ label: "See Agency", href: "/pricing" }],
    },
  },
  {
    keys: ["ask melo", "ask"],
    reply: {
      text: "Ask Melo runs the office — quotes, bookings, invoices, the firm. This chat is product support: how Melo itself works. Two different jobs.",
    },
  },
  {
    keys: ["human", "person", "support", "email", "help"],
    reply: {
      text: "I can take most of this. If you want a person: hello@officialmelo.com.",
      links: [{ label: "Email support", href: "mailto:hello@officialmelo.com" }],
    },
  },
];

export function answerSupport(input: string): SupportReply {
  const q = input.toLowerCase().trim();
  if (!q) {
    return { text: SUPPORT_GREETING, chips: SUPPORT_CHIPS_WEB };
  }
  if (q.includes("what’s in pro") || q.includes("whats in pro") || q.includes("included in pro")) {
    return {
      text: "Pro (A$449) is the one most offices run.\n\nReceptionist, number, Melo Computer, inbox, calendar — plus the full firm of AI agents, quotes with e-signature, invoices, reach and review. 1,000 voice minutes. 8 team members. 7-day trial.",
      chips: ["What’s in Agency?", "Start trial"],
      links: [{ label: "Start free trial", href: "/signup" }],
    };
  }
  if (q.includes("what’s in agency") || q.includes("whats in agency") || q.includes("included in agency")) {
    return {
      text: "Agency is Pro plus API keys, custom connectors, specialist packs, priority voice, SSO-ready workspace, 25 seats and 2,000 minutes.",
      links: [{ label: "See plans", href: "/pricing" }],
    };
  }
  if (q === "start trial" || q.includes("start free") || q === "sign up") {
    return {
      text: "Seven days on Pro. Card at signup, billed day 8 unless you cancel.",
      links: [{ label: "Start free trial", href: "/signup" }],
    };
  }
  for (const row of HELP) {
    if (row.keys.some((k) => q.includes(k))) return row.reply;
  }
  return {
    text: "I can cover plans, the phone, Melo Computer, Connect, quotes, training, or billing. Or email hello@officialmelo.com.",
    chips: SUPPORT_CHIPS_WEB,
    links: [{ label: "Email support", href: "mailto:hello@officialmelo.com" }],
  };
}

export const SUPPORT_SYSTEM = `You are Melo’s product support on officialmelo.com. Pronounce Melo as me-low — two beats, “me” then “low”, never mellow. Melo is an AI office: receptionist, inbox, quotes, calendar, firm of AI agents, and Melo Computer that stays on 24/7. Plans AUD ex GST: Basic $249 (400 min), Pro $449 (1000 min, 7-day trial), Agency $999 (2000 min, API keys). Overage $0.55/min. Email hello@officialmelo.com. Don’t mention Grok, xAI, or that you are a language model. Short, direct, Australian English.`;
