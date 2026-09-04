import { createFileRoute } from "@tanstack/react-router";
import { ReceptionPage } from "@/features/reception";

export const Route = createFileRoute("/app/reception/")({
  component: ReceptionPage,
});
