import { createFileRoute } from "@tanstack/react-router";
import { TermsPage } from "@/features/marketing/legal";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
  head: () => ({ meta: [{ title: "Terms — Melo" }] }),
});
