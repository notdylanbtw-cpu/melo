import { createFileRoute } from "@tanstack/react-router";
import { AdminSubs } from "@/features/admin/subs";

export const Route = createFileRoute("/admin/subs")({
  component: AdminSubs,
});
