/**
 * Social sign-in this app offers. Google is Melo’s own OAuth client
 * (`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`) — not the Grok broker.
 * Email/password is always on. Do not add grok-* providers here.
 */
export type SocialProvider = {
  providerId: "google";
  label: string;
};

export const SOCIAL_PROVIDERS: readonly SocialProvider[] = [{ providerId: "google", label: "Google" }];

/** @deprecated empty — Grok broker is not used for customer login */
export const GROK_PROVIDERS: readonly { providerId: string; idp: string; label: string }[] = [];
