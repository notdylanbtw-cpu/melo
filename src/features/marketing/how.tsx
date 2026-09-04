import { Link } from "@tanstack/react-router";
import { MarketingShell } from "./shell";

const STEPS = [
  {
    n: "01",
    t: "Train it on the business",
    d: "Paste the website, hours, suburbs and the work you do. Melo studies it so callers hear you.",
  },
  {
    n: "02",
    t: "Point the phone at Melo",
    d: "Use the number you already have, or we’ll issue one. Inbound calls hit the receptionist. It greets, books, takes a message, or transfers to your mobile.",
  },
  {
    n: "03",
    t: "Put Melo on the website",
    d: "One snippet. Chat and contact forms from the site land in the same inbox as the call.",
  },
  {
    n: "04",
    t: "Run the office from anywhere",
    d: "Quotes, calendar, the firm. Same login on the web. Seven days on Pro to try it with your number.",
  },
  {
    n: "05",
    t: "Melo Computer stays on",
    d: "Melo has its own machine. Phone, inbox and the tasks you taught keep running 24/7 — even if you close the tab.",
  },
];

export function HowPage() {
  return (
    <MarketingShell atmosphere>
      <div className="mx-auto max-w-[800px] px-6 py-16">
        <p className="text-sm font-medium text-mkt-muted">How it works</p>
        <h1 className="mt-2 text-4xl font-bold tracking-[-0.03em] sm:text-5xl">Five things. Then the office is covered.</h1>
        <p className="mt-4 max-w-lg text-mkt-muted">Phone, jobs, quotes, calendar, the firm — on Melo’s computer, 24/7. You train it once.</p>
        <ol className="mt-14 space-y-8">
          {STEPS.map((s) => (
            <li key={s.n} className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:grid sm:grid-cols-[72px_minmax(0,1fr)] sm:gap-4 sm:p-8">
              <div className="font-mono text-sm text-mkt-cream">{s.n}</div>
              <div>
                <h2 className="mt-2 text-xl font-semibold sm:mt-0">{s.t}</h2>
                <p className="mt-2 text-sm leading-relaxed text-mkt-muted">{s.d}</p>
              </div>
            </li>
          ))}
        </ol>
        <Link to="/signup" className="mkt-pill-cream mt-12 inline-flex h-12 items-center px-7 text-sm font-semibold">
          Start 7-day trial
        </Link>
      </div>
    </MarketingShell>
  );
}
