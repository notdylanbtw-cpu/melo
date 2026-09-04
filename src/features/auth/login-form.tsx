import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { authClient, authEnabled } from "@/lib/auth/client";
import { MeloWordmark } from "@/components/brand/melo-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlanChoice, readChosenPlan, saveChosenPlan } from "@/components/melo/plan-pick";

export function LoginForm({
  variant,
  callbackURL,
  initialMode = "in",
}: {
  variant: "office" | "admin";
  callbackURL: string;
  initialMode?: "in" | "up";
}) {
  const [mode, setMode] = useState<"in" | "up" | "forgot">(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [planId, setPlanId] = useState(readChosenPlan);
  const admin = variant === "admin";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEnabled) return;
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      if (mode === "forgot") {
        setNotice("If that email is on Melo, you’ll get a reset link.");
        setBusy(false);
        return;
      }
      if (mode === "up") {
        saveChosenPlan(planId);
        const { error: err } = await authClient.signUp.email({
          email: email.trim(),
          password,
          name: name.trim() || email.trim(),
          callbackURL: "/onboard",
        });
        if (err) throw new Error(err.message || "Couldn’t create the account");
        window.location.href = "/onboard";
        return;
      }
      const { error: err } = await authClient.signIn.email({
        email: email.trim(),
        password,
        rememberMe: remember,
        callbackURL,
      });
      if (err) throw new Error(err.message || "Couldn’t sign in");
      window.location.href = callbackURL;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy(false);
    }
  };

  const heading =
    mode === "up" ? "Start your office" : mode === "forgot" ? "Reset password" : "Welcome back";
  const sub =
    mode === "up"
      ? "Pick a plan. You can change it anytime."
      : mode === "forgot"
        ? "We’ll email a reset link if that account exists."
        : admin
          ? "Operator sign in."
          : "Sign in to Melo.";

  return (
    <div className={admin ? "relative min-h-dvh bg-background" : "relative min-h-dvh bg-mkt text-mkt-fg"}>
      {!admin ? (
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[640px] overflow-hidden">
          <img src="/mkt-sky.jpg" alt="" className="size-full object-cover object-[center_top]" />
          <div className="absolute inset-0 bg-gradient-to-b from-mkt/40 via-transparent to-mkt" />
        </div>
      ) : null}
      <header className="absolute top-8 left-8 z-10">
        <Link to="/">
          <MeloWordmark invert={!admin} />
        </Link>
      </header>
      <main className="relative z-10 flex min-h-dvh flex-col items-center justify-center px-4 py-24">
        <div className="w-full max-w-[440px] rounded-2xl border border-border bg-canvas px-8 py-10 text-foreground shadow-hairline sm:px-10">
          {admin ? <p className="mb-1 text-xs font-medium uppercase tracking-wide text-primary">Admin</p> : null}
          <p className="text-sm text-muted-foreground">{sub}</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">{heading}</h1>

          {authEnabled ? (
            <>
              <form className="mt-8 space-y-4" onSubmit={(e) => void submit(e)}>
                {mode === "up" ? (
                  <Input
                    className="h-12 rounded-lg"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    placeholder="Your name"
                    required
                  />
                ) : null}
                <Input
                  className="h-12 rounded-lg"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="Work email"
                  required
                />
                {mode !== "forgot" ? (
                  <Input
                    className="h-12 rounded-lg"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={mode === "up" ? "new-password" : "current-password"}
                    minLength={8}
                    placeholder="Password"
                    required
                  />
                ) : null}

                {mode === "up" && !admin ? (
                  <PlanChoice
                    value={planId}
                    onChange={(id) => {
                      setPlanId(id);
                      saveChosenPlan(id);
                    }}
                  />
                ) : null}

                {mode === "in" ? (
                  <div className="flex items-center justify-between gap-3 pt-1 text-sm">
                    <label className="flex items-center gap-2 text-muted-foreground">
                      <input
                        type="checkbox"
                        className="size-4 rounded border-border accent-primary"
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                      />
                      Remember for 30 days
                    </label>
                    <button
                      type="button"
                      className="font-medium text-primary hover:underline"
                      onClick={() => {
                        setMode("forgot");
                        setError(null);
                      }}
                    >
                      Forgot password
                    </button>
                  </div>
                ) : null}

                {error ? <p className="text-sm text-danger">{error}</p> : null}
                {notice ? <p className="text-sm text-success">{notice}</p> : null}

                <Button type="submit" className="h-12 w-full text-base" disabled={busy}>
                  {busy
                    ? "Working…"
                    : mode === "up"
                      ? "Create account"
                      : mode === "forgot"
                        ? "Send reset link"
                        : "Sign in"}
                </Button>
              </form>

              {mode === "up" && !admin ? (
                <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">
                  By creating an account you agree to the{" "}
                  <Link to="/terms" className="underline underline-offset-2 hover:text-foreground">
                    Terms
                  </Link>{" "}
                  and{" "}
                  <Link to="/privacy" className="underline underline-offset-2 hover:text-foreground">
                    Privacy Policy
                  </Link>
                  .
                </p>
              ) : null}

              <p className="mt-6 text-center text-sm text-muted-foreground">
                {mode === "in" && !admin ? (
                  <>
                    Don’t have an account?{" "}
                    <button type="button" className="font-medium text-primary hover:underline" onClick={() => setMode("up")}>
                      Sign up
                    </button>
                  </>
                ) : null}
                {mode === "up" ? (
                  <>
                    Already have an account?{" "}
                    <button type="button" className="font-medium text-primary hover:underline" onClick={() => setMode("in")}>
                      Sign in
                    </button>
                  </>
                ) : null}
                {mode === "forgot" ? (
                  <button type="button" className="font-medium text-primary hover:underline" onClick={() => setMode("in")}>
                    Back to sign in
                  </button>
                ) : null}
                {mode === "in" && admin ? "First person in becomes the operator." : null}
              </p>
            </>
          ) : (
            <p className="mt-6 text-sm text-muted-foreground">Sign-in is disabled.</p>
          )}
        </div>
        {admin ? (
          <p className="mt-6 text-xs text-muted-foreground">
            <Link to="/login" className="hover:text-foreground">
              Melo office login
            </Link>
          </p>
        ) : null}
      </main>
    </div>
  );
}
