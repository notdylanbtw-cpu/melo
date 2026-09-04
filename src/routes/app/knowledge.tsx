import { createFileRoute } from "@tanstack/react-router";
import { KnowledgePage } from "@/features/knowledge";

export const Route = createFileRoute("/app/knowledge")({
  component: KnowledgePage,
});
