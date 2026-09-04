/**
 * Google sign-in: Melo’s own OAuth client when GOOGLE_CLIENT_ID is set.
 * Preview falls back to the shared broker with idp=google (consent branded Melo AI).
 */
export type SocialProvider = {
  providerId: "google";
  label: string;
};

export const SOCIAL_PROVIDERS: readonly SocialProvider[] = [{ providerId: "google", label: "Google" }];

export const GROK_PROVIDERS: readonly { providerId: string; idp: string; label: string }[] = [
  { providerId: "google", idp: "google", label: "Google" },
];
