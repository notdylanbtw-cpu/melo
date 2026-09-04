import { createFileRoute } from "@tanstack/react-router";
import { HowPage } from "@/features/marketing/how";

export const Route = createFileRoute("/how")({
  component: HowPage,
  head: () => ({ meta: [{ title: "How it works — Melo" }] }),
});
