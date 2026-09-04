import { createFileRoute } from "@tanstack/react-router";
import { FirmPage } from "@/features/firm";

export const Route = createFileRoute("/app/firm")({
  component: FirmPage,
});
