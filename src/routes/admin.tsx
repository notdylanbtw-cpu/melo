import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/features/admin/shell";
import { SessionGate } from "@/features/auth/session-gate";

export const Route = createFileRoute("/admin")({
  component: Layout,
});

function Layout() {
  return (
    <SessionGate hq loginTo="/admin/login">
      <AdminShell />
    </SessionGate>
  );
}
