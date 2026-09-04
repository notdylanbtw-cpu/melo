import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { GROK_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";
import { MeloWordmark } from "@/components/brand/melo-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlanChoice, readChosenPlan, saveChosenPlan } from "@/components/melo/plan-pick";

function GoogleMark() {
  return (
    <svg viewBox="0 0 18 18" className="size-4" aria-hidden>
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.33A9 9 0 0 0 9 18Z" />
      <path fill="#FBBC05" d="M3.97 10.71A5.41 5.41 0 0 1 3.69 9c0-.59.1-1.17.28-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.04l3.01-2.33Z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z" />
    </svg>
  );
}

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
  const errorPath = admin ? "/admin/login" : "/login";
  const google = GROK_PROVIDERS.find((p) => p.idp === "google");

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
        : "Sign in to the office.";

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
                  placeholder="Email address"
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
                      ? "Continue"
                      : mode === "forgot"
                        ? "Send reset link"
                        : "Sign in"}
                </Button>
              </form>

              {mode !== "forgot" && google ? (
                <Button
                  type="button"
                  variant="outline"
                  className="mt-4 h-12 w-full text-base"
                  onClick={() => {
                    if (mode === "up") saveChosenPlan(planId);
                    void signIn(google.providerId, {
                      callbackURL: mode === "up" && !admin ? "/onboard" : callbackURL,
                      errorCallbackURL: errorPath,
                    });
                  }}
                >
                  <GoogleMark />
                  Continue with Google
                </Button>
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
