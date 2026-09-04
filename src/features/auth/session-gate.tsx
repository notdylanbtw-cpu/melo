import { useEffect, useState, type ReactNode } from "react";
import { Navigate } from "@tanstack/react-router";
import { MeloWordmark } from "@/components/brand/melo-mark";
import { applyCheckout, getAccount, saveOfficeSnapshot, type AccountRecord } from "@/lib/account";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { hasTwoFactorOk } from "@/lib/auth/two-factor";
import { looksLikeDemoOffice, parseOfficeJson, setTenantId, snapshotOffice } from "@/lib/melo/office-sync";
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
  const adoptOffice = useMelo((s) => s.adoptOffice);
  const confirmStripe = useMelo((s) => s.confirmStripe);

  useEffect(() => {
    if (isPending || !user) return;
    let alive = true;
    let unsub: (() => void) | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const boot = async () => {
      setTenantId(user.id);
      await useMelo.persist.rehydrate();
      const a = await getAccount();
      if (!alive) return;

      const paid = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
      if (paid?.get("paid") === "1") {
        const planId = paid.get("plan") || a.planId || "growth";
        const result = await applyCheckout({ data: { planId } });
        confirmStripe(result.planId, result.trialEndsAt);
        window.history.replaceState({}, "", window.location.pathname);
      }

      const fromServer = parseOfficeJson(a.officeJson);
      if (fromServer?.workspace?.name) {
        adoptOffice(fromServer);
      } else if (a.onboardingComplete && a.businessName) {
        const currentName = useMelo.getState().workspace.name;
        if (!currentName || looksLikeDemoOffice(currentName) || currentName !== a.businessName) {
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
            planId: a.planId,
          });
        }
      }

      if (a.billingStatus === "active" || a.billingStatus === "trial") {
        confirmStripe(a.planId, a.trialEndsAt);
      }

      setAccount(a);

      const flush = () => {
        const json = JSON.stringify(snapshotOffice(useMelo.getState()));
        void saveOfficeSnapshot({ data: { json } }).catch(() => undefined);
      };
      unsub = useMelo.subscribe(() => {
        clearTimeout(timer);
        timer = setTimeout(flush, 1200);
      });
    };

    void boot().catch(() => {
      if (alive) setAccount("err");
    });

    return () => {
      alive = false;
      unsub?.();
      clearTimeout(timer);
    };
  }, [user, isPending, hydrate, adoptOffice, confirmStripe]);

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
