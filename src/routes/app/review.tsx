import { createFileRoute } from "@tanstack/react-router";
import { ReviewPage } from "@/features/review";

export const Route = createFileRoute("/app/review")({
  component: ReviewPage,
});
