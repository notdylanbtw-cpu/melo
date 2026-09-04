import { createFileRoute } from "@tanstack/react-router";
import { CallsPage } from "@/features/reception";

export const Route = createFileRoute("/app/reception/calls")({
  component: CallsPage,
});
