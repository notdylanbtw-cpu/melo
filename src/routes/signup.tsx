import { createFileRoute, Navigate } from "@tanstack/react-router";
import { LoginForm } from "@/features/auth/login-form";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/signup")({
  component: Page,
});

function Page() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) return <div className="grid min-h-dvh place-items-center text-sm text-muted-foreground">Loading…</div>;
  if (user) return <Navigate to="/app" />;
  return <LoginForm variant="office" callbackURL="/onboard" initialMode="up" />;
}
