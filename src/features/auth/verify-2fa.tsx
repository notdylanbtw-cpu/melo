import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { checkTotp } from "@/lib/account";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { markTwoFactorOk } from "@/lib/auth/two-factor";
import { MeloWordmark } from "@/components/brand/melo-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function VerifyTwoFactorPage({ next = "/app" }: { next?: string }) {
  const { user, isPending } = useCurrentUserState();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (isPending) return <div className="grid min-h-dvh place-items-center text-sm text-muted-foreground">Loading…</div>;
  if (!user) {
    void navigate({ to: "/login" });
    return null;
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await checkTotp({ data: code });
      if (!r.ok) {
        setError(r.error);
        setBusy(false);
        return;
      }
      markTwoFactorOk(user.id);
      let dest = next;
      try {
        dest = sessionStorage.getItem("melo-after-2fa") || next;
      } catch {
        /* ignore */
      }
      window.location.href = dest;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn’t verify");
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center p-6">
      <MeloWordmark />
      <h1 className="mt-8 text-xl font-semibold">Two-factor code</h1>
      <p className="mt-1 text-sm text-muted-foreground">Open your authenticator app and enter the 6-digit code.</p>
      <form className="mt-6 space-y-3" onSubmit={(e) => void submit(e)}>
        <Input
          autoFocus
          inputMode="numeric"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          placeholder="000000"
          className="text-center font-mono text-lg tracking-[0.4em]"
        />
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={busy || code.length !== 6}>
          {busy ? "Checking…" : "Continue"}
        </Button>
      </form>
    </div>
  );
}
