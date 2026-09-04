import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { completeOnboarding, beginTotp, confirmTotp } from "@/lib/account";
import { cardBrandFromNumber } from "@/lib/melo/billing";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { markTwoFactorOk } from "@/lib/auth/two-factor";
import { MeloWordmark } from "@/components/brand/melo-mark";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { PlanPick, readChosenPlan, saveChosenPlan } from "@/components/melo/plan-pick";
import { INDUSTRY_LABELS } from "@/lib/melo/terminology";
import { useMelo } from "@/lib/melo/store";
import { TRIAL_DAYS, TRIAL_PLAN_ID, planById } from "@/lib/melo/billing";
import type { Industry } from "@/lib/melo/types";
import { cn } from "@/lib/utils";

const INDUSTRIES = Object.keys(INDUSTRY_LABELS) as Industry[];
const TOOLS = ["Xero", "Google Calendar", "Gmail", "Stripe", "ServiceM8", "Jobber", "WhatsApp", "Google Business Profile"];

export function OnboardPage() {
  const { user, isPending } = useCurrentUserState();
  const navigate = useNavigate();
  const hydrate = useMelo((s) => s.hydrateOffice);
  const updateCard = useMelo((s) => s.updateCard);
  const [step, setStep] = useState(0);
  const [ownerName, setOwnerName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [industry, setIndustry] = useState<Industry>("trades");
  const [about, setAbout] = useState("");
  const [website, setWebsite] = useState("");
  const [servicesRaw, setServicesRaw] = useState("");
  const [suburbsRaw, setSuburbsRaw] = useState("");
  const [hours, setHours] = useState("Mon–Fri 7:30 am – 4:30 pm");
  const [afterHours, setAfterHours] = useState("Emergencies only. Extra call-out applies.");
  const [tools, setTools] = useState<string[]>([]);
  const [planId, setPlanId] = useState(readChosenPlan);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user?.displayName && !ownerName) setOwnerName(user.displayName);
  }, [user, ownerName]);

  if (isPending) {
    return <div className="grid min-h-dvh place-items-center text-sm text-muted-foreground">Loading…</div>;
  }
  if (!user) {
    void navigate({ to: "/login" });
    return null;
  }

  const services = servicesRaw.split(/[,|\n]/).map((s) => s.trim()).filter(Boolean);
  const suburbs = suburbsRaw.split(/[,|\n]/).map((s) => s.trim()).filter(Boolean);
  const cardDigits = cardNumber.replace(/\D/g, "");
  const [expMonthRaw, expYearRaw] = cardExpiry.split("/");
  const cardReady =
    cardName.trim().length > 1 &&
    cardDigits.length >= 13 &&
    Number(expMonthRaw) >= 1 &&
    Number(expMonthRaw) <= 12 &&
    (expYearRaw ?? "").trim().length >= 2 &&
    cardCvc.replace(/\D/g, "").length >= 3;

  const saveCard = () => {
    const [mm, yy] = cardExpiry.split("/");
    updateCard({
      brand: cardBrandFromNumber(cardDigits),
      last4: cardDigits.slice(-4),
      expMonth: Number(mm),
      expYear: 2000 + Number(yy),
      name: cardName.trim(),
    });
  };

  const finish = async (withTotp: boolean) => {
    setBusy(true);
    setError(null);
    try {
      const account = await completeOnboarding({
        data: {
          ownerName: ownerName.trim(),
          businessName: businessName.trim(),
          industry,
          about: about.trim(),
          website: website.trim(),
          services,
          suburbs,
          hours,
          afterHours,
          tools,
          email: user.primaryEmail ?? undefined,
        },
      });
      saveChosenPlan(planId);
      hydrate({
        ownerName: account.ownerName,
        businessName: account.businessName,
        industry: account.industry,
        about: account.about,
        website: account.website,
        services: account.services,
        suburbs: account.suburbs,
        hours: account.hours,
        afterHours: account.afterHours,
        tools: account.tools,
        email: account.email ?? user.primaryEmail ?? "",
        planId,
      });
      saveCard();
      if (withTotp) markTwoFactorOk(user.id);
      window.location.href = "/app";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn’t save this");
      setBusy(false);
    }
  };

  const startTotp = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await beginTotp();
      setSecret(r.secret);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn’t start 2FA");
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await confirmTotp({ data: code });
      if (!r.ok) {
        setError(r.error);
        setBusy(false);
        return;
      }
      await finish(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn’t verify");
      setBusy(false);
    }
  };

  const steps = [
    {
      title: "What’s your name?",
      body: (
        <Input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} autoFocus placeholder="Alex Chen" />
      ),
      can: ownerName.trim().length > 1,
    },
    {
      title: "Business name",
      body: (
        <div className="space-y-3">
          <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} autoFocus placeholder="Northside Plumbing" />
          <Input
            inputMode="url"
            autoComplete="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="Website — northsideplumbing.com.au"
          />
          <p className="text-xs text-muted-foreground">Optional. Melo reads it into Knowledge for Receptionist, quotes and the widget.</p>
        </div>
      ),
      can: businessName.trim().length > 1,
    },
    {
      title: "What kind of work?",
      body: (
        <div className="grid grid-cols-2 gap-2">
          {INDUSTRIES.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setIndustry(id)}
              className={cn(
                "rounded-lg border px-3 py-2 text-left text-sm capitalize",
                industry === id ? "border-primary bg-accent font-medium" : "border-border hover:bg-muted",
              )}
            >
              {id}
            </button>
          ))}
        </div>
      ),
      can: true,
    },
    {
      title: "What do you actually do?",
      body: (
        <Textarea
          value={about}
          onChange={(e) => setAbout(e.target.value)}
          placeholder="Licensed plumbing across the Inner West. Blocked drains, leaks, hot water, gas. After hours for emergencies."
          className="min-h-32"
        />
      ),
      can: about.trim().length > 12,
    },
    {
      title: "Services Melo should know",
      body: (
        <div className="space-y-3">
          <Textarea
            value={servicesRaw}
            onChange={(e) => setServicesRaw(e.target.value)}
            placeholder="Blocked drains, leaking taps, hot water, gas fitting"
          />
          <Input value={suburbsRaw} onChange={(e) => setSuburbsRaw(e.target.value)} placeholder="Suburbs — Newtown, Marrickville, Bondi" />
        </div>
      ),
      can: services.length > 0,
    },
    {
      title: "Hours",
      body: (
        <div className="space-y-3">
          <Input value={hours} onChange={(e) => setHours(e.target.value)} />
          <Textarea value={afterHours} onChange={(e) => setAfterHours(e.target.value)} />
        </div>
      ),
      can: true,
    },
    {
      title: "Tools you already use",
      body: (
        <div className="flex flex-wrap gap-2">
          {TOOLS.map((t) => {
            const on = tools.includes(t);
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTools(on ? tools.filter((x) => x !== t) : [...tools, t])}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm",
                  on ? "border-primary bg-accent font-medium" : "border-border hover:bg-muted",
                )}
              >
                {t}
              </button>
            );
          })}
        </div>
      ),
      can: true,
    },
    {
      title: "Which plan?",
      body: (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Pick one now. You can switch in Settings → Billing whenever you like.</p>
          <PlanPick
            value={planId}
            onChange={(id) => {
              setPlanId(id);
              saveChosenPlan(id);
            }}
          />
        </div>
      ),
      can: Boolean(planId),
    },
    {
      title: planId === TRIAL_PLAN_ID ? "Card for after the trial" : "Card",
      body: (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {planId === TRIAL_PLAN_ID
              ? `${TRIAL_DAYS}-day free trial on ${planById(planId).name}. Change plan anytime.`
              : `${planById(planId).name} bills to this card. Change plan anytime in Billing.`}
          </p>
          <Input value={cardName} onChange={(e) => setCardName(e.target.value)} autoComplete="cc-name" placeholder="Name on card" />
          <Input
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            inputMode="numeric"
            autoComplete="cc-number"
            placeholder="4242 4242 4242 4242"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              value={cardExpiry}
              onChange={(e) => setCardExpiry(e.target.value)}
              autoComplete="cc-exp"
              placeholder="09/28"
            />
            <Input
              value={cardCvc}
              onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
              inputMode="numeric"
              autoComplete="cc-csc"
              placeholder="CVC"
            />
          </div>
        </div>
      ),
      can: cardReady,
    },
    {
      title: "Lock the office with 2FA",
      body: secret ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Add this secret to Google Authenticator, Authy or 1Password, then enter the 6-digit code.</p>
          <div className="rounded-lg border border-border bg-muted px-3 py-2 font-mono text-sm tracking-[0.2em]">{secret}</div>
          <Input inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} placeholder="000000" autoFocus />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">An authenticator app. Required to open the office on a new device.</p>
      ),
      can: true,
    },
  ];

  const current = steps[step]!;

  return (
    <div className={cn("mx-auto flex min-h-dvh flex-col p-6", current.title === "Which plan?" ? "max-w-5xl" : "max-w-lg")}>
      <MeloWordmark />
      <div className="mt-10 text-xs font-medium text-muted-foreground">Step {step + 1} of {steps.length}</div>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">{current.title}</h1>
      <div className="mt-6">{current.body}</div>
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      <div className="mt-8 flex gap-2">
        {step > 0 ? (
          <Button type="button" variant="outline" onClick={() => setStep(step - 1)} disabled={busy}>
            Back
          </Button>
        ) : null}
        {step < steps.length - 1 ? (
          <Button type="button" className="ml-auto" disabled={!current.can || busy} onClick={() => setStep(step + 1)}>
            Continue
          </Button>
        ) : (
          <div className="ml-auto flex gap-2">
            <Button type="button" variant="outline" disabled={busy} onClick={() => void finish(false)}>
              Skip for now
            </Button>
            {secret ? (
              <Button type="button" disabled={busy || code.length !== 6} onClick={() => void confirm()}>
                {busy ? "Saving…" : "Verify and open office"}
              </Button>
            ) : (
              <Button type="button" disabled={busy} onClick={() => void startTotp()}>
                Set up 2FA
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
