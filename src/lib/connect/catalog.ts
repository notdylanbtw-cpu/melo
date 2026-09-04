/** How each connector actually attaches. OAuth when Melo has the vendor app; otherwise Melo Computer. */

export type ConnectSpec = {
  login: string;
  oauth?: "google" | "meta" | "microsoft" | "stripe" | "xero" | "slack";
  voice?: boolean;
};

export const CONNECT: Record<string, ConnectSpec> = {
  twilio: { login: "", voice: true },
  telnyx: { login: "https://portal.telnyx.com/#/login" },
  gcal: { login: "https://calendar.google.com", oauth: "google" },
  outlook: { login: "https://outlook.office.com/calendar", oauth: "microsoft" },
  servicem8: { login: "https://app.servicem8.com" },
  jobber: { login: "https://secure.getjobber.com/login" },
  fergus: { login: "https://app.fergus.com" },
  simpro: { login: "https://login.simprogroup.com" },
  stripe: { login: "https://dashboard.stripe.com/login", oauth: "stripe" },
  square: { login: "https://squareup.com/login" },
  xero: { login: "https://login.xero.com", oauth: "xero" },
  qbo: { login: "https://app.qbo.intuit.com" },
  myob: { login: "https://www.myob.com/au/login" },
  hubspot: { login: "https://app.hubspot.com/login" },
  pipedrive: { login: "https://app.pipedrive.com/auth/login" },
  gmail: { login: "https://mail.google.com", oauth: "google" },
  olmail: { login: "https://outlook.office.com/mail", oauth: "microsoft" },
  whatsapp: { login: "https://www.facebook.com/login", oauth: "meta" },
  instagram: { login: "https://www.facebook.com/login", oauth: "meta" },
  messenger: { login: "https://www.facebook.com/login", oauth: "meta" },
  facebook: { login: "https://www.facebook.com/login", oauth: "meta" },
  imessage: { login: "", voice: true },
  wordpress: { login: "https://wordpress.com/log-in" },
  shopify: { login: "https://accounts.shopify.com/store-login" },
  webflow: { login: "https://webflow.com/dashboard" },
  gbp: { login: "https://business.google.com", oauth: "google" },
  slack: { login: "https://slack.com/signin", oauth: "slack" },
  teams: { login: "https://teams.microsoft.com", oauth: "microsoft" },
  zapier: { login: "https://zapier.com/app/login" },
};

export function oauthPath(vendor: NonNullable<ConnectSpec["oauth"]>, appId: string) {
  if (vendor === "google") return `/api/oauth/google?start=${encodeURIComponent(appId)}`;
  if (vendor === "meta") return `/api/oauth/meta?start=${encodeURIComponent(appId)}`;
  if (vendor === "microsoft") return `/api/oauth/microsoft?start=${encodeURIComponent(appId)}`;
  if (vendor === "stripe") return `/api/oauth/stripe?start=${encodeURIComponent(appId)}`;
  if (vendor === "xero") return `/api/oauth/xero?start=${encodeURIComponent(appId)}`;
  return `/api/oauth/slack?start=${encodeURIComponent(appId)}`;
}
