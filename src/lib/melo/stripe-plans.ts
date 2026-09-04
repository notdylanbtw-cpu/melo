export const STRIPE_LINKS: Record<string, string> = {
  starter: "https://buy.stripe.com/test_9B64gB0KmfJZ3QucPKgYU03",
  growth: "https://buy.stripe.com/test_cNi00l64GdBRcn0dTOgYU04",
  firm: "https://buy.stripe.com/test_7sYfZjbp069pcn07vqgYU05",
};


export function checkoutUrl(planId: string, opts?: { email?: string | null; userId?: string }) {
  const base = STRIPE_LINKS[planId] ?? STRIPE_LINKS.growth!;
  const u = new URL(base);
  if (opts?.email) u.searchParams.set("prefilled_email", opts.email);
  if (opts?.userId) u.searchParams.set("client_reference_id", opts.userId);
  return u.toString();
}
