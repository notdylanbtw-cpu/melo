import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Phone } from "lucide-react";
import { MeloMark } from "@/components/brand/melo-mark";
import { MarketingShell } from "./shell";
import { LandingBody } from "./sections";
import { OfficeShot } from "./office-shot";

const SAMPLE_SRC = "/samples/mia.mp3";

let current: HTMLAudioElement | null;

function stopHero() {
  if (!current) return;
  current.onended = null;
  current.pause();
  current.src = "";
  current = null;
}

function playSample() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("melo-stop-audio"));
  stopHero();
  current = new Audio(SAMPLE_SRC);
  current.currentTime = 0;
  void current.play();
  current.onended = () => window.dispatchEvent(new Event("melo-sample-ended"));
}

export function MarketingHome() {
  const [playing, setPlaying] = useState(false);
  const hear = () => {
    playSample();
    setPlaying(true);
  };

  useEffect(() => {
    const onHear = () => hear();
    const onEnd = () => setPlaying(false);
    const onStop = () => {
      stopHero();
      setPlaying(false);
    };
    window.addEventListener("melo-hear-sample", onHear);
    window.addEventListener("melo-sample-ended", onEnd);
    window.addEventListener("melo-stop-audio", onStop);
    return () => {
      window.removeEventListener("melo-hear-sample", onHear);
      window.removeEventListener("melo-sample-ended", onEnd);
      window.removeEventListener("melo-stop-audio", onStop);
    };
  }, []);

  return (
    <MarketingShell atmosphere>
      <section className="mx-auto max-w-[1120px] px-6 pb-8 pt-8 lg:pt-14">
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="max-w-xl pt-4">
            <h1 className="text-[2.75rem] font-bold leading-[1.05] tracking-[-0.035em] text-mkt-fg sm:text-6xl lg:text-[4.25rem]">
              Run the business.
              <br />
              Cancel the rest.
            </h1>
            <p className="mt-6 max-w-[28rem] text-[1.05rem] leading-relaxed text-mkt-muted">
              Phone, inbox, quotes, calendar, the firm — on Melo’s computer, 24/7.
              <br />
              Keep Xero, WhatsApp, the calendar. Cancel the rest.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link to="/signup" className="mkt-pill-cream inline-flex h-12 items-center px-7 text-[15px] font-semibold">
                Start free trial
              </Link>
              <button type="button" onClick={hear} className="inline-flex h-12 items-center rounded-full border border-white/15 px-6 text-[15px] font-medium">
                {playing ? "Playing sample…" : "Hear a sample"}
              </button>
            </div>
            <p className="mt-4 text-sm text-mkt-muted">Seven days on Pro. Cancel anytime.</p>
            <ul className="mt-6 flex flex-wrap gap-2 text-xs text-mkt-muted">
              {["Trades", "Clinics", "Law", "Hospitality", "Real estate", "Retail"].map((t) => (
                <li key={t} className="rounded-full border border-white/12 px-3 py-1">
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mx-auto flex w-full max-w-xs flex-col items-center pt-6 lg:pt-16">
            <button
              type="button"
              onClick={hear}
              className="flex size-[92px] items-center justify-center rounded-full bg-mkt-fg text-mkt-cream-fg shadow-[0_0_0_14px_rgba(255,255,255,0.08)] transition-transform hover:scale-[1.03] active:scale-[0.98]"
              aria-label="Start a sample call"
            >
              <Phone className="size-8" strokeWidth={1.75} />
            </button>
            <p className="mt-3 text-sm font-medium tracking-tight text-mkt-fg">Start a call</p>
            <MeloMark className="mt-10 size-11" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1120px] px-6 pb-8">
        <OfficeShowcase />
      </section>
      <section className="mx-auto max-w-[1120px] px-6 pb-16 pt-4">
        <dl className="grid grid-cols-2 gap-8 border-t border-white/10 pt-10 sm:grid-cols-4">
          {[
            ["24/7", "Melo Computer. Always on."],
            ["One inbox", "Calls, WhatsApp, Instagram, web."],
            ["Signed", "Quote in the thread. That’s the job."],
            ["One login", "Calendar, firm, invoices, reach."],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="text-2xl font-semibold tracking-tight text-mkt-fg">{k}</dt>
              <dd className="mt-1 text-sm text-mkt-muted">{v}</dd>
            </div>
          ))}
        </dl>
      </section>
      <LandingBody />
    </MarketingShell>
  );
}

function OfficeShowcase() {
  return (
    <div className="relative">
      <div className="mkt-shot-fade">
        <OfficeShot page="home" height={680} />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-[-1px] bottom-0 h-56 bg-gradient-to-b from-transparent via-mkt/75 to-mkt"
      />
    </div>
  );
}
