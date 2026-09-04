import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { QuoteSheet } from "@/components/melo/quote-sheet";
import { SignaturePad, type SignatureValue } from "@/components/melo/signature-pad";
import { MeloMark } from "@/components/brand/melo-mark";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/misc";
import { dt, moneyExact } from "@/lib/format";
import { useMelo } from "@/lib/melo/store";
import { totals } from "@/lib/melo/totals";

export function SignQuotePage({ quoteId }: { quoteId: string }) {
  const navigate = useNavigate();
  const jobs = useMelo((s) => s.jobs);
  const customers = useMelo((s) => s.customers);
  const workspace = useMelo((s) => s.workspace);
  const sign = useMelo((s) => s.signQuote);
  const decline = useMelo((s) => s.declineQuote);
  const [ready, setReady] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [sig, setSig] = useState<SignatureValue>({ name: "", method: "drawn", image: null });
  const [done, setDone] = useState(false);

  useEffect(() => {
    const result = useMelo.persist.rehydrate();
    void Promise.resolve(result).then(() => setReady(true));
  }, []);

  const job = jobs.find((j) => j.quote?.id === quoteId || j.quote?.number.toLowerCase() === quoteId.toLowerCase());
  const quote = job?.quote;
  const customer = job ? customers.find((c) => c.id === job.customerId) : undefined;

  useEffect(() => {
    if (customer && !sig.name) setSig((s) => ({ ...s, name: customer.name }));
  }, [customer?.name]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!ready) {
    return <div className="flex min-h-dvh items-center justify-center text-sm text-muted-foreground">Loading quote…</div>;
  }

  if (!job || !quote || !customer) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center px-6 text-center">
        <h1 className="text-xl font-semibold">Quote not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">This signing link is invalid or has expired.</p>
        <Button className="mt-4" variant="outline" onClick={() => void navigate({ to: "/app" })}>
          Back
        </Button>
      </div>
    );
  }

  const signed = quote.status === "accepted" || quote.signature?.status === "signed" || done;
  const declined = quote.status === "declined" || quote.signature?.status === "declined";
  const t = totals(quote.items, quote.discount);
  const canSign = agreed && Boolean(sig.name.trim()) && Boolean(sig.image) && !signed && !declined;

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border bg-canvas">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {workspace.brandName.slice(0, 1)}
            </span>
            <div>
              <div className="text-sm font-semibold">{workspace.brandName}</div>
              <div className="text-xs text-muted-foreground">ABN {workspace.abn}</div>
            </div>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            Quote {quote.number}
            <div>Valid until {dt(`${quote.expiry}T09:00:00+10:00`, "d MMM yyyy")}</div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="mb-5">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            {signed ? "Job approved" : `Sign to approve this job`}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground text-pretty">
            {signed
              ? `${quote.signature?.signerName ?? customer.name} signed ${quote.number}. ${workspace.brandName} can proceed.`
              : `Hi ${customer.name.split(" ")[0]} — signing ${quote.number} is your contract. It approves the ${job.title.toLowerCase()} at ${job.suburb} for ${moneyExact(t.inc)}.`}
          </p>
        </div>

        <QuoteSheet job={job} customer={customer} workspace={workspace} />

        {signed ? (
          <section className="mt-6 rounded-2xl border border-success/30 bg-success-soft p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-success">
              <Check className="size-4" /> Signed — job approved
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Northside has been notified. {job.scheduledStart ? "Your window is locked." : "They’ll book a tech next."}
            </p>
            <Link to="/" className="mt-3 inline-block text-sm font-medium text-primary">
              Back to the office
            </Link>
          </section>
        ) : declined ? (
          <section className="mt-6 rounded-2xl border border-border bg-canvas p-5 text-sm text-muted-foreground">
            This quote was declined.
          </section>
        ) : (
          <section className="mt-6 rounded-2xl border border-border bg-canvas p-5">
            <h2 className="text-sm font-semibold">E-signature</h2>
            <p className="mt-1 text-sm text-muted-foreground text-pretty">
              By signing you approve this job, accept the scope, price and terms on {quote.number}, and authorise{" "}
              {workspace.brandName} to proceed. This is a contract.
            </p>
            <div className="mt-4">
              <SignaturePad defaultName={customer.name} onChange={setSig} />
            </div>
            <label className="mt-4 flex items-start gap-2.5 text-sm">
              <Checkbox checked={agreed} onCheckedChange={(c) => setAgreed(c === true)} className="mt-0.5" />
              <span>
                I am {sig.name.trim() || customer.name}, I have authority to approve this work, and I sign to approve the job.
              </span>
            </label>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button
                disabled={!canSign}
                onClick={() => {
                  if (!sig.image || !sig.name.trim()) return;
                  sign(job.id, { signerName: sig.name.trim(), method: sig.method, image: sig.image });
                  setDone(true);
                }}
              >
                Sign & approve job · {moneyExact(t.inc)}
              </Button>
              <Button variant="outline" onClick={() => decline(job.id)}>
                Decline quote
              </Button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              A copy stays on the job record. Deposit terms: {quote.terms}
            </p>
          </section>
        )}

        <p className="mt-8 flex items-center justify-center gap-1.5 text-[11px] text-subtle">
          <MeloMark className="size-4" /> Quotes signed in Melo
        </p>
      </main>
    </div>
  );
}
