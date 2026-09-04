import { useEffect, useState, type ReactNode } from "react";
import { Navigate } from "@tanstack/react-router";
import { MeloWordmark } from "@/components/brand/melo-mark";
import { getAccount, type AccountRecord } from "@/lib/account";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { hasTwoFactorOk } from "@/lib/auth/two-factor";
import { useMelo } from "@/lib/melo/store";

export function SessionGate({
  children,
  hq,
  loginTo = "/login",
}: {
  children: ReactNode;
  hq?: boolean;
  loginTo?: string;
}) {
  const { user, isPending } = useCurrentUserState();
  const [account, setAccount] = useState<AccountRecord | null | "err">(null);
  const hydrate = useMelo((s) => s.hydrateOffice);
  const workspaceName = useMelo((s) => s.workspace.name);

  useEffect(() => {
    if (isPending || !user) return;
    let alive = true;
    void getAccount()
      .then((a) => {
        if (!alive) return;
        setAccount(a);
        if (a.onboardingComplete && a.businessName && workspaceName !== a.businessName) {
          hydrate({
            ownerName: a.ownerName,
            businessName: a.businessName,
            industry: a.industry,
            about: a.about,
            website: a.website,
            services: a.services,
            suburbs: a.suburbs,
            hours: a.hours,
            afterHours: a.afterHours,
            tools: a.tools,
            email: a.email ?? user.primaryEmail ?? "",
          });
        }
      })
      .catch(() => {
        if (alive) setAccount("err");
      });
    return () => {
      alive = false;
    };
  }, [user, isPending, hydrate, workspaceName]);

  if (isPending || (user && account === null)) {
    return (
      <div className="grid min-h-dvh place-items-center bg-background">
        <div className="text-center">
          <MeloWordmark className="justify-center" />
          <p className="mt-3 text-sm text-muted-foreground">Opening Melo…</p>
        </div>
      </div>
    );
  }
  if (!user) return <RedirectToSignIn to={loginTo} />;
  if (account === "err") {
    return (
      <div className="grid min-h-dvh place-items-center bg-background text-sm">
        Couldn’t load your account. Refresh.
      </div>
    );
  }
  if (!account?.onboardingComplete && !hq) return <Navigate to="/onboard" />;
  if (account?.totpEnabled && !hasTwoFactorOk(user.id)) {
    try {
      sessionStorage.setItem("melo-after-2fa", hq ? "/admin" : "/app");
    } catch {
      /* ignore */
    }
    return <Navigate to="/verify-2fa" />;
  }
  if (hq && !account?.isHq) {
    return <Navigate to="/admin/login" />;
  }
  return <>{children}</>;
}
