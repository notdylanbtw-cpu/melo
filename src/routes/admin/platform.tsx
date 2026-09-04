import { createFileRoute } from "@tanstack/react-router";
import { AdminPlatform } from "@/features/admin/platform";

export const Route = createFileRoute("/admin/platform")({
  component: AdminPlatform,
});
