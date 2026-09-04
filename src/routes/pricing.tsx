import { createFileRoute } from "@tanstack/react-router";
import { PricingPage } from "@/features/marketing/pricing";

export const Route = createFileRoute("/pricing")({
  component: PricingPage,
  head: () => ({ meta: [{ title: "Pricing — Melo" }] }),
});
