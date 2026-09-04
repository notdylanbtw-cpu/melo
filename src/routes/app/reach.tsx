import { createFileRoute } from "@tanstack/react-router";
import { ReachPage } from "@/features/reach";

export const Route = createFileRoute("/app/reach")({
  component: ReachPage,
});
