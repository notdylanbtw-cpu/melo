import { createFileRoute } from "@tanstack/react-router";
import { ConnectPage } from "@/features/connect";

export const Route = createFileRoute("/app/connect")({
  component: ConnectPage,
});
