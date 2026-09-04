import { createFileRoute } from "@tanstack/react-router";
import { OnboardPage } from "@/features/onboard";

export const Route = createFileRoute("/onboard")({
  component: OnboardPage,
});
