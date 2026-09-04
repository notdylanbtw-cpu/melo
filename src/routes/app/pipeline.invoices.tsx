import { createFileRoute } from "@tanstack/react-router";
import { PipelinePage } from "@/features/pipeline";

export const Route = createFileRoute("/app/pipeline/invoices")({
  component: PipelinePage,
});
