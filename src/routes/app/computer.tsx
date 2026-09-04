import { createFileRoute } from "@tanstack/react-router";
import { ComputerPage } from "@/features/computer";

export const Route = createFileRoute("/app/computer")({
  component: ComputerPage,
});
