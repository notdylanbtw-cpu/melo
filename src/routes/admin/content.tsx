import { createFileRoute } from "@tanstack/react-router";
import { AdminContent } from "@/features/admin/content";

export const Route = createFileRoute("/admin/content")({
  component: AdminContent,
});
