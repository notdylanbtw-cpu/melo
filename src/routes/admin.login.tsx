import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { LoginForm } from "@/features/auth/login-form";
import { claimHq } from "@/lib/account";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { MeloWordmark } from "@/components/brand/melo-mark";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/login")({
  component: Page,
});

function Page() {
  const { user, isPending } = useCurrentUserState();
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (!user) return;
    void claimHq()
      .then((r) => {
        if (r.isHq) window.location.replace("/admin");
        else setDenied(true);
      })
      .catch(() => setDenied(true));
  }, [user]);

  if (isPending) return <div className="grid min-h-dvh place-items-center text-sm text-muted-foreground">Loading…</div>;
  if (denied) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center p-6">
        <MeloWordmark />
        <h1 className="mt-8 text-xl font-semibold">Not an operator account</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Melo Admin is for the people who run Melo. This login belongs to a workspace. Open the office instead.
        </p>
        <Button asChild className="mt-6">
          <Link to="/">Open office</Link>
        </Button>
      </div>
    );
  }
  if (user) return <div className="grid min-h-dvh place-items-center text-sm text-muted-foreground">Opening Admin…</div>;
  return <LoginForm variant="admin" callbackURL="/admin/login" />;
}
