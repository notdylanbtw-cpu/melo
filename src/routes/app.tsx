import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/shell/app-shell";
import { SessionGate } from "@/features/auth/session-gate";

export const Route = createFileRoute("/app")({
  component: Layout,
});

function Layout() {
  return (
    <SessionGate>
      <AppShell>
        <Outlet />
      </AppShell>
    </SessionGate>
  );
}
