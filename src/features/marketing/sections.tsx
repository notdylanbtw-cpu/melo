import { Link } from "@tanstack/react-router";
import { MeloMark } from "@/components/brand/melo-mark";
import { Check, ChevronLeft, ChevronRight, Minus, Pause, Play, X, Phone, CalendarDays, FileText, Inbox, Radio, Receipt } from "lucide-react";
import { COMPARE_GROUPS, PLAN_COMPARE, PLANS, TRIAL_DAYS, type CompareCell } from "@/lib/melo/billing";
import { money } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState, Fragment } from "react";
import { ComputerShot } from "./computer-shot";

export function LandingBody() {
  return (
    <>
      <div className="mt-20 bg-white text-ink">
        <Reveal>
          <WhoBlock />
        </Reveal>
        <Reveal>
          <OfficeBento />
        </Reveal>
      </div>
      <Reveal>
        <AskDemoBlock />
      </Reveal>
      <Reveal>
        <HowBlock />
      </Reveal>
      <Reveal>
        <ComputerBlock />
      </Reveal>
      <Reveal>
        <IntegrationsBlock />
      </Reveal>
      <div className="bg-white text-ink">
        <Reveal>
          <VersusBlock />
        </Reveal>
        <Reveal>
          <PricingBlock />
        </Reveal>
        <Reveal>
          <FaqBlock />
        </Reveal>
      </div>
      <Reveal>
        <JoinBlock />
      </Reveal>
    </>
  );
}

function Reveal({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("is-in");
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          el.classList.add("is-in");
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className="mkt-reveal">
      {children}
    </div>
  );
}

const WHO = [
  {
    t: "Plumber",
    slug: "plumber",
    role: "After hours",
    d: "Overflow, after hours, same-day windows.",
    say: "Northside Plumbing, after hours. If it’s overflowing, say emergency.",
    audio: "/mkt-who-plumber.mp3?v=jordan",
    orb: "/mkt-orb-plumber.jpg",
    voice: "Jordan",
  },
  {
    t: "Electrician",
    slug: "electrician",
    role: "Call-outs",
    d: "Call-outs and switchboard quotes.",
    say: "Brightspark Electrical. I can book a call-out or take a quote.",
    audio: "/mkt-who-electrician.mp3?v=mac",
    orb: "/mkt-orb-electrician.jpg",
    voice: "Mac",
  },
  {
    t: "Dentist",
    slug: "dentist",
    role: "Clinic",
    d: "New patients, hygiene, after-hours pain.",
    say: "Brightside Dental. I can book a consult, or take a message.",
    audio: "/mkt-who-dentist.mp3?v=mia",
    orb: "/mkt-orb-dentist.jpg",
    voice: "Mia",
  },
  {
    t: "Salon",
    slug: "salon",
    role: "Front of house",
    d: "Colour consults, no-shows, DMs.",
    say: "Atelier. Colour consult or a cut — I can hold a chair.",
    audio: "/mkt-who-salon.mp3?v=ava",
    orb: "/mkt-orb-salon.jpg",
    voice: "Ava",
  },
  {
    t: "Cafe / venue",
    slug: "cafe",
    role: "Bookings",
    d: "Functions, suppliers, service.",
    say: "Harbour Room. For bookings say the date. Suppliers, leave a name.",
    audio: "/mkt-who-cafe.mp3?v=mia",
    orb: "/mkt-orb-cafe.jpg",
    voice: "Mia",
  },
  {
    t: "Builder",
    slug: "builder",
    role: "Site",
    d: "Variations, site queries, signed quotes.",
    say: "Hart Build. Site query or a variation — I’ll get it to the office.",
    audio: "/mkt-who-builder.mp3?v=jordan",
    orb: "/mkt-orb-builder.jpg",
    voice: "Jordan",
  },
  {
    t: "Lawyer",
    slug: "lawyer",
    role: "Chambers",
    d: "New matters, existing files, the right person.",
    say: "Blackwell Law. New matter or an existing file — I’ll take your name and get it to the right person.",
    audio: "/mkt-who-lawyer.mp3?v=ava",
    orb: "/mkt-orb-lawyer.jpg",
    voice: "Ava",
  },
] as const;

let whoAudio: HTMLAudioElement | null;
let whoToken = 0;

function stopWho() {
  whoToken += 1;
  if (!whoAudio) return;
  whoAudio.onended = null;
  whoAudio.onerror = null;
  whoAudio.pause();
  whoAudio.src = "";
  whoAudio = null;
}

function WhoBlock() {
  const [on, setOn] = useState(0);
  const [playing, setPlaying] = useState(false);
  const n = WHO.length;
  const wrap = (i: number) => (i + n) % n;
  const w = WHO[on]!;
  const left = WHO[wrap(on - 1)]!;
  const right = WHO[wrap(on + 1)]!;

  const hear = (i: number, { toggle = false } = {}) => {
    const clip = WHO[i];
    if (!clip || typeof window === "undefined") return;
    if (toggle && playing && i === on) {
      stopWho();
      setPlaying(false);
      return;
    }
    window.dispatchEvent(new Event("melo-stop-audio"));
    const token = whoToken;
    const audio = new Audio(clip.audio);
    whoAudio = audio;
    audio.preload = "auto";
    setPlaying(true);
    audio.onended = () => {
      if (token === whoToken) {
        setPlaying(false);
        whoAudio = null;
      }
    };
    void audio.play().catch(() => {
      if (token === whoToken) setPlaying(false);
    });
  };

  useEffect(() => {
    const onStop = () => {
      stopWho();
      setPlaying(false);
    };
    window.addEventListener("melo-stop-audio", onStop);
    return () => window.removeEventListener("melo-stop-audio", onStop);
  }, []);

  const go = (i: number) => {
    const next = wrap(i);
    if (next === on) return;
    setOn(next);
    hear(next);
  };

  const offsetOf = (i: number) => {
    let off = i - on;
    if (off > n / 2) off -= n;
    if (off < -n / 2) off += n;
    return off;
  };

  return (
    <section id="who" className="scroll-mt-24 mx-auto max-w-[1120px] px-6 py-24">
      <h2 className="text-center text-4xl font-bold tracking-[-0.035em] sm:text-5xl">Hear it as your business.</h2>
      <p className="mx-auto mt-3 max-w-md text-center text-[1.05rem] leading-relaxed text-ink/55">
        Mia, Jordan, Ava or Mac answers as that shop.
      </p>

      <div className="relative mt-10">
        <div className="relative mx-auto h-[240px] w-full max-w-[920px] overflow-hidden sm:h-[280px]">
          {WHO.map((item, i) => {
            const off = offsetOf(i);
            const abs = Math.abs(off);
            const center = off === 0;
            const hidden = abs > 2;
            return (
              <button
                key={item.slug}
                type="button"
                onClick={() => (center ? hear(on, { toggle: true }) : go(i))}
                className="mkt-who-orb absolute top-1/2 left-1/2"
                style={{
                  zIndex: hidden ? 0 : 10 - abs,
                  opacity: hidden ? 0 : abs === 2 ? 0.42 : 1,
                  transform: `translate(-50%, -50%) translateX(${off * 168}px) scale(${center ? 1 : abs === 1 ? 0.7 : 0.52})`,
                  pointerEvents: hidden ? "none" : "auto",
                }}
                aria-label={center ? `Play ${item.t}` : item.t}
                tabIndex={hidden ? -1 : 0}
              >
                <img src={item.orb} alt="" className="mkt-who-orb-img size-full" />
                {center ? (
                  <span className="absolute inset-0 grid place-items-center">
                    <span className="grid size-14 place-items-center rounded-full bg-white text-ink shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
                      {playing ? <Pause className="size-5 fill-current" /> : <Play className="size-5 fill-current pl-0.5" />}
                    </span>
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="mt-4 grid grid-cols-3 items-start gap-4 text-center">
          <button type="button" onClick={() => go(on - 1)} className="hidden sm:block">
            <div key={left.slug} className="mkt-who-copy">
              <div className="text-sm font-medium">{left.t}</div>
              <p className="mx-auto mt-1 max-w-[12rem] text-sm text-ink/45">{left.d}</p>
            </div>
          </button>
          <div>
            <div className="flex items-center justify-center gap-3">
              <button type="button" onClick={() => go(on - 1)} className="grid size-8 place-items-center rounded-full text-ink/40 hover:text-ink" aria-label="Previous">
                <ChevronLeft className="size-4" />
              </button>
              <div key={w.slug} className="mkt-who-copy">
                <div className="text-sm font-semibold">{w.t}</div>
                <p className="mx-auto mt-1 max-w-[14rem] text-sm text-ink/50">{w.d}</p>
              </div>
              <button type="button" onClick={() => go(on + 1)} className="grid size-8 place-items-center rounded-full text-ink/40 hover:text-ink" aria-label="Next">
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
          <button type="button" onClick={() => go(on + 1)} className="hidden sm:block">
            <div key={right.slug} className="mkt-who-copy">
              <div className="text-sm font-medium">{right.t}</div>
              <p className="mx-auto mt-1 max-w-[12rem] text-sm text-ink/45">{right.d}</p>
            </div>
          </button>
        </div>
      </div>
    </section>
  );
}

function OfficeBento() {
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-[1120px] px-6">
        <h2 className="max-w-xl text-4xl font-bold tracking-[-0.035em] sm:text-5xl">The whole office.</h2>
        <p className="mt-3 max-w-lg text-[1.05rem] leading-relaxed text-ink/55">
          Inbox, the phone, quotes, the firm. One desk — so the work doesn’t live in six tabs.
        </p>

        <div className="mt-12 grid gap-3 lg:grid-cols-12">
          <article className="mkt-bento-dark flex flex-col p-6 sm:p-7 lg:col-span-7">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-medium tracking-[0.14em] text-white/40 uppercase">Phone</p>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/8 px-2 py-0.5 text-[11px] text-white/70">
                <span className="mkt-live-dot" />
                Live
              </span>
            </div>
            <h3 className="mt-3 max-w-sm text-[1.35rem] font-semibold tracking-tight">Answers. Books a window. Or puts them through.</h3>
            <ul className="mt-8 divide-y divide-white/8 rounded-xl bg-white/5">
              {[
                ["Live", "Overflow — Newtown", "now"],
                ["Hold", "Call-out quote", "2m"],
                ["Done", "Window locked Tue 8:30", ""],
              ].map(([k, v, t]) => (
                <li key={k} className="flex items-center gap-3 px-4 py-3 text-sm">
                  <span className="w-10 text-[11px] font-medium tracking-wide text-white/35 uppercase">{k}</span>
                  <span className="flex-1">{v}</span>
                  {t ? <span className="text-xs text-white/35 tabular">{t}</span> : null}
                </li>
              ))}
            </ul>
          </article>

          <div className="grid gap-3 lg:col-span-5">
            <article className="mkt-bento-light p-6">
              <p className="text-[11px] font-medium tracking-[0.14em] text-ink/35 uppercase">Calendar</p>
              <h3 className="mt-2 text-lg font-semibold tracking-tight">Staff columns. Travel already in.</h3>
              <div className="mt-5 flex gap-1">
                {["M", "T", "W", "T", "F"].map((d, i) => (
                  <span
                    key={`${d}-${i}`}
                    className={cn(
                      "grid h-8 flex-1 place-items-center rounded-md text-xs font-medium",
                      i === 3 ? "bg-ink text-white" : "bg-black/4 text-ink/45",
                    )}
                  >
                    {d}
                  </span>
                ))}
              </div>
              <div className="mt-3 rounded-lg bg-black/4 px-3 py-2.5">
                <p className="text-sm font-medium">Hot water — Newtown</p>
                <p className="mt-0.5 text-xs text-ink/45">Thu 08:00–09:30 · Sam</p>
              </div>
            </article>

            <article className="mkt-bento-light p-6">
              <p className="text-[11px] font-medium tracking-[0.14em] text-ink/35 uppercase">Inbox</p>
              <h3 className="mt-2 text-lg font-semibold tracking-tight">Site, WhatsApp, the call — one thread.</h3>
              <div className="mt-4 space-y-2">
                <p className="max-w-[92%] rounded-2xl rounded-tl-md bg-black/5 px-3 py-2 text-[13px] leading-snug text-ink/70">
                  Leaking tap in the kitchen — can you come today?
                </p>
                <p className="ml-auto max-w-[88%] rounded-2xl rounded-tr-md bg-ink px-3 py-2 text-[13px] leading-snug text-white">
                  2–4pm held in Newtown. Name for the job?
                </p>
              </div>
            </article>
          </div>

          <article className="mkt-bento-light p-6 lg:col-span-4">
            <p className="text-[11px] font-medium tracking-[0.14em] text-ink/35 uppercase">Quotes</p>
            <h3 className="mt-2 text-lg font-semibold tracking-tight">Priced from the book. Signed in the thread.</h3>
            <div className="mt-5 flex items-end justify-between border-t border-black/8 pt-4">
              <div>
                <p className="text-sm font-medium">Blocked drain</p>
                <p className="mt-1 text-xs text-emerald-700">Signed · QU-1044</p>
              </div>
              <p className="text-xl font-semibold tabular tracking-tight">$280</p>
            </div>
          </article>

          <article className="mkt-bento-light p-6 lg:col-span-4">
            <p className="text-[11px] font-medium tracking-[0.14em] text-ink/35 uppercase">Firm</p>
            <h3 className="mt-2 text-lg font-semibold tracking-tight">AI agents on the floor. Same login.</h3>
            <ul className="mt-5 space-y-2.5 text-sm">
              {[
                ["#2dd4bf", "Receptionist", "Live"],
                ["#14b8a6", "Dispatch", "Window held"],
                ["#8b7cf6", "Quill", "Quote sent"],
              ].map(([c, n, s]) => (
                <li key={n} className="flex items-center gap-2.5">
                  <span className="size-1.5 rounded-full" style={{ background: c }} />
                  <span className="flex-1">{n}</span>
                  <span className="text-ink/40">{s}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="mkt-bento-light p-6 lg:col-span-4">
            <p className="text-[11px] font-medium tracking-[0.14em] text-ink/35 uppercase">Pipeline</p>
            <h3 className="mt-2 text-lg font-semibold tracking-tight">Quote. Approved. On site. Paid.</h3>
            <div className="mt-5 flex gap-1 text-[11px] font-medium">
              {["Quote", "Signed", "Booked", "Paid"].map((s, i) => (
                <span
                  key={s}
                  className={cn(
                    "flex-1 rounded-md py-1.5 text-center",
                    i === 2 ? "bg-ink text-white" : "bg-black/4 text-ink/40",
                  )}
                >
                  {s}
                </span>
              ))}
            </div>
            <p className="mt-3 text-sm">Tap replacement · Mike Wilson</p>
            <p className="mt-0.5 text-xs text-ink/45">8:30am · confirmed</p>
          </article>
        </div>
      </div>
    </section>
  );
}

const ASK_DEMOS = [
  {
    title: "After-hours overflow",
    tag: "Phone",
    color: "#2B7FFF",
    Icon: Phone,
    prompt: "Overflow in Newtown after ten. If it’s not an emergency, book first thing and text them the window.",
    steps: ["Reading booking rules", "Sam 7:30 am is free", "SMS sitting in Review"],
    result: "Window locked. They get the text when you approve.",
  },
  {
    title: "Quote from the book",
    tag: "Quotes",
    color: "#12B76A",
    Icon: FileText,
    prompt: "Create a quote for tombrennan@fastmail.com — gully overflow, after hours. Send for signature.",
    steps: ["Price book · after-hours rate", "Draft QU-2048", "Waiting on you in Review"],
    result: "$370 inc GST. One tap to send and e-sign.",
  },
  {
    title: "Book a window",
    tag: "Calendar",
    color: "#F79009",
    Icon: CalendarDays,
    prompt: "Hold Thursday 7:30 for a blocked drain in Newtown. Travel buffer in.",
    steps: ["Checking Sam’s column", "20-minute travel hold", "Job on the board"],
    result: "Thursday 7:30 · Sam · Newtown. In Calendar and Pipeline.",
  },
  {
    title: "Website enquiry",
    tag: "Inbox",
    color: "#2B7FFF",
    Icon: Inbox,
    prompt: "Someone on the site asked if we can come today for a leaking tap.",
    steps: ["Same thread as the call", "2–4pm still open", "Name on the job"],
    result: "Reply in Inbox. Window held until they confirm.",
  },
  {
    title: "Missed-call follow-up",
    tag: "Reach",
    color: "#FB923C",
    Icon: Radio,
    prompt: "They rang twice and hung up. Follow up on SMS, don’t be pushy.",
    steps: ["Scout sequence on", "First SMS in 4 minutes", "Stop if they book"],
    result: "Sequence armed. It stops itself if they reply or book.",
  },
  {
    title: "Send the invoice",
    tag: "Money",
    color: "#E2A336",
    Icon: Receipt,
    prompt: "Job’s done. Send Dana the tax invoice from the signed quote.",
    steps: ["Quote accepted → invoice", "Template · email", "Xero when they pay"],
    result: "INV-1044 in the thread. You approve send.",
  },
] as const;

function AskDemoBlock() {
  const [on, setOn] = useState(0);
  const [typed, setTyped] = useState("");
  const [phase, setPhase] = useState<"type" | "work" | "done">("type");
  const [step, setStep] = useState(0);
  const demo = ASK_DEMOS[on]!;

  useEffect(() => {
    const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setTyped(reduce ? demo.prompt : "");
    setPhase(reduce ? "work" : "type");
    setStep(0);
    const timers: number[] = [];
    if (reduce) {
      timers.push(window.setTimeout(() => setPhase("done"), 900));
      timers.push(window.setTimeout(() => setOn((i) => (i + 1) % ASK_DEMOS.length), 3200));
      return () => timers.forEach(clearTimeout);
    }
    let i = 0;
    const tick = window.setInterval(() => {
      i += 1;
      setTyped(demo.prompt.slice(0, i));
      if (i >= demo.prompt.length) {
        window.clearInterval(tick);
        setPhase("work");
      }
    }, 16);
    return () => {
      window.clearInterval(tick);
      timers.forEach(clearTimeout);
    };
  }, [on, demo.prompt]);

  useEffect(() => {
    if (phase !== "work") return;
    setStep(0);
    const timers: number[] = [];
    demo.steps.forEach((_, i) => {
      timers.push(window.setTimeout(() => setStep(i + 1), 420 * (i + 1)));
    });
    timers.push(
      window.setTimeout(() => setPhase("done"), 420 * demo.steps.length + 280),
    );
    return () => timers.forEach(clearTimeout);
  }, [phase, demo.steps]);

  useEffect(() => {
    if (phase !== "done") return;
    const t = window.setTimeout(() => setOn((i) => (i + 1) % ASK_DEMOS.length), 3400);
    return () => window.clearTimeout(t);
  }, [phase]);

  return (
    <section id="ask" className="scroll-mt-24 bg-mkt px-6 py-28 text-mkt-fg">
      <div className="mx-auto max-w-[1120px] text-center">
        <h2 className="text-4xl font-bold tracking-[-0.035em] sm:text-5xl">Ask Melo. Watch it work.</h2>
        <p className="mx-auto mt-3 max-w-lg text-[1.05rem] leading-relaxed text-mkt-muted">
          A sentence. It prices, books, drafts — then waits on you for the send.
        </p>
        <Link to="/signup" className="mkt-pill-cream mt-8 inline-flex h-11 items-center px-6 text-[15px] font-semibold">
          Get Melo
        </Link>
      </div>

      <div className="mkt-demo mx-auto mt-12 max-w-[1080px] rounded-[28px] bg-[#dfe4ea] p-2 shadow-[0_40px_80px_rgba(0,0,0,0.35)]">
        <div className="grid overflow-hidden rounded-[22px] bg-white text-ink lg:grid-cols-[minmax(240px,280px)_1fr]">
          <ul className="space-y-1.5 border-b border-black/6 p-3 lg:border-r lg:border-b-0 lg:p-4">
            {ASK_DEMOS.map((d, i) => {
              const Icon = d.Icon;
              const active = i === on;
              return (
                <li key={d.title}>
                  <button
                    type="button"
                    onClick={() => setOn(i)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-[background,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                      active ? "bg-[#eef5ff] shadow-[inset_0_0_0_1px_rgba(43,127,255,0.22)]" : "hover:bg-black/4",
                    )}
                  >
                    <span className="grid size-9 place-items-center rounded-xl text-white" style={{ background: d.color }}>
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{d.title}</span>
                      <span className="block text-xs text-ink/40">{d.tag}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="min-h-[420px] p-5 sm:p-7">
            <div className="flex items-center gap-2 text-sm">
              <MeloMark className="size-5" />
              <span className="font-medium">Ask Melo</span>
              <span className="rounded-full bg-[#ecfdf3] px-2 py-0.5 text-[11px] font-medium text-[#12B76A]">{demo.tag}</span>
            </div>

            <div key={`${on}-prompt`} className="mkt-demo-in mt-5 rounded-2xl bg-[#f4f5f7] px-4 py-3 text-sm leading-relaxed text-ink/80">
              {typed}
              {phase === "type" ? <span className="mkt-demo-caret">|</span> : null}
            </div>

            {phase !== "type" ? (
              <div key={`${on}-work`} className="mkt-demo-in mt-6">
                <div className="flex items-center gap-2 text-sm text-ink/50">
                  <MeloMark className="size-4" />
                  {phase === "work" ? "Working…" : "Done."}
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/6">
                  <div className={cn("h-full rounded-full bg-primary", phase === "done" ? "w-full" : "mkt-demo-bar")} />
                </div>
                <ul className="mt-4 space-y-2">
                  {demo.steps.map((s, i) => (
                    <li
                      key={s}
                      className={cn(
                        "flex items-center gap-2 text-sm transition-opacity duration-300",
                        i < step ? "opacity-100" : "opacity-0",
                      )}
                    >
                      <Check className="size-3.5 text-[#12B76A]" />
                      {s}
                    </li>
                  ))}
                </ul>
                {phase === "done" ? (
                  <p key={`${on}-result`} className="mkt-demo-in mt-5 text-sm font-medium">
                    {demo.result}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function HowIcon({ kind }: { kind: "train" | "phone" | "site" | "inbox" | "quote" | "firm" | "comp" }) {
  const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg viewBox="0 0 32 32" className="size-10 text-[#5ba3ff]" aria-hidden>
      {kind === "train" ? (
        <>
          <circle cx="10" cy="12" r="3" fill="currentColor" opacity="0.95" />
          <circle cx="18" cy="10" r="2.2" fill="currentColor" opacity="0.7" />
          <circle cx="16" cy="18" r="2.6" fill="currentColor" opacity="0.85" />
          <circle cx="23" cy="16" r="2" fill="currentColor" opacity="0.55" />
        </>
      ) : null}
      {kind === "phone" ? (
        <>
          <rect x="11" y="4" width="10" height="24" rx="3" {...stroke} />
          <path d="M14 24h4" {...stroke} />
        </>
      ) : null}
      {kind === "site" ? (
        <>
          <rect x="4" y="7" width="24" height="18" rx="3" {...stroke} />
          <path d="M4 12h24" {...stroke} />
          <circle cx="8" cy="9.5" r="1" fill="currentColor" />
          <circle cx="11.5" cy="9.5" r="1" fill="currentColor" opacity="0.6" />
        </>
      ) : null}
      {kind === "inbox" ? (
        <>
          <path d="M5 11 16 4l11 7v13a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V11Z" {...stroke} />
          <path d="M5 12h22" {...stroke} />
        </>
      ) : null}
      {kind === "quote" ? (
        <>
          <rect x="8" y="4" width="16" height="24" rx="2" {...stroke} />
          <path d="M12 11h8M12 16h8M12 21h5" {...stroke} />
        </>
      ) : null}
      {kind === "firm" ? (
        <>
          <rect x="5" y="5" width="8" height="8" rx="1.5" fill="currentColor" />
          <rect x="16" y="5" width="8" height="8" rx="1.5" fill="currentColor" opacity="0.7" />
          <rect x="5" y="16" width="8" height="8" rx="1.5" fill="currentColor" opacity="0.45" />
          <rect x="16" y="16" width="8" height="8" rx="1.5" fill="currentColor" opacity="0.85" />
        </>
      ) : null}
      {kind === "comp" ? (
        <>
          <rect x="4" y="6" width="24" height="16" rx="2" {...stroke} />
          <path d="M10 26h12M16 22v4" {...stroke} />
        </>
      ) : null}
    </svg>
  );
}

function HowBlock() {
  const items = [
    { k: "train" as const, t: "Train Melo", d: "Website, hours, suburbs, the work you do. It studies it once." },
    { k: "phone" as const, t: "Point the phone", d: "Your number. Melo answers, books a window, or puts them through." },
    { k: "site" as const, t: "Put it on the site", d: "A snippet or your contact form. Enquiries land in Inbox." },
    { k: "inbox" as const, t: "One inbox", d: "Calls, WhatsApp, Instagram, the web — one thread, one reply." },
    { k: "quote" as const, t: "Quote and sign", d: "Priced from your book, emailed, e-signed. That’s the job approved." },
    { k: "firm" as const, t: "Run the firm", d: "AI agents on calendar, quotes and follow-up. Same login." },
    { k: "comp" as const, t: "Melo Computer", d: "Stays on 24/7. Phone, inbox, the tasks you taught — even if you close the tab." },
  ];
  return (
    <section id="how" className="relative scroll-mt-24 overflow-hidden bg-mkt py-28 text-mkt-fg">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(ellipse_at_top,_rgba(80,150,255,0.22),_transparent_70%)]"
      />
      <div className="relative mx-auto max-w-[1120px] px-6">
        <h2 className="text-4xl font-bold tracking-[-0.035em] sm:text-5xl">How it works</h2>
        <ul className="mt-16 grid gap-x-12 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((s, i) => (
            <li key={s.k} className="mkt-how-item" style={{ animationDelay: `${i * 70}ms` }}>
              <HowIcon kind={s.k} />
              <h3 className="mt-5 text-xl font-semibold tracking-tight">{s.t}</h3>
              <p className="mt-2 max-w-xs text-[15px] leading-relaxed text-mkt-muted">{s.d}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function PricingGrid({ compact, light }: { compact?: boolean; light?: boolean }) {
  return (
    <div className="grid gap-3 lg:grid-cols-3">
      {PLANS.map((p) => {
        const cmp = PLAN_COMPARE.find((c) => c.id === p.id)!;
        const trial = p.id === "growth";
        return (
          <div
            key={p.id}
            className={cn(
              "flex flex-col rounded-2xl border p-6",
              light
                ? trial
                  ? "border-ink bg-ink text-white"
                  : "border-black/10 bg-white text-ink"
                : trial
                  ? "border-mkt-cream/40 bg-white/5"
                  : "border-white/10",
            )}
          >
            <div className="text-lg font-semibold">{p.name}</div>
            <p className={cn("mt-1 text-sm", light ? (trial ? "text-white/60" : "text-ink/55") : "text-mkt-muted")}>{p.blurb}</p>
            <div className="mt-6 flex items-baseline gap-1">
              <span className="text-3xl font-semibold tabular tracking-tight">{money(p.priceMonthly)}</span>
              <span className={cn("text-sm", light ? (trial ? "text-white/50" : "text-ink/40") : "text-mkt-muted")}>/ mo</span>
            </div>
            {trial ? (
              <p className={cn("mt-1 text-sm", light ? "text-white/70" : "text-mkt-cream")}>{TRIAL_DAYS}-day free trial</p>
            ) : (
              <p className={cn("mt-1 text-sm", light ? "text-ink/40" : "text-mkt-muted")}>ex GST</p>
            )}
            {!compact ? (
              <>
                <ul className="mt-6 space-y-1.5 text-sm">
                  {cmp.included.map((f) => (
                    <li key={f} className="flex gap-2">
                      <Check className="mt-0.5 size-3.5 shrink-0 text-success" /> {f}
                    </li>
                  ))}
                </ul>
                {cmp.excluded.length ? (
                  <ul className={cn("mt-3 space-y-1.5 text-sm", light ? (trial ? "text-white/40" : "text-ink/40") : "text-mkt-muted")}>
                    {cmp.excluded.map((f) => (
                      <li key={f} className="flex gap-2">
                        <Minus className="mt-0.5 size-3.5 shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </>
            ) : null}
            <Link
              to="/signup"
              className={cn(
                "mt-8 inline-flex h-11 items-center justify-center rounded-full text-sm font-semibold",
                trial
                  ? light
                    ? "bg-white text-ink"
                    : "mkt-pill-cream"
                  : light
                    ? "border border-black/10"
                    : "border border-white/15",
              )}
            >
              {trial ? `Start ${TRIAL_DAYS}-day trial` : `Choose ${p.name}`}
            </Link>
          </div>
        );
      })}
    </div>
  );
}

function ComputerBlock() {
  const items = [
    { t: "Always on", d: "Not your laptop. A machine in the cloud that doesn’t go home, take lunch, or close the tab." },
    { t: "Its own browser", d: "Logged into Jobber, Xero, Gmail — on Melo’s computer. Teach a task once. Melo runs it again." },
    { t: "Phone never waits", d: "Calls hit this machine directly. Inbox, quotes, taught work — 24/7, even after you log out." },
  ];
  return (
    <section className="bg-mkt py-28 text-mkt-fg">
      <div className="mx-auto max-w-[1120px] px-6">
        <p className="text-sm font-medium text-mkt-muted">Melo Computer</p>
        <h2 className="mt-3 max-w-3xl text-4xl font-bold tracking-[-0.035em] sm:text-5xl sm:leading-[1.05]">
          Melo has a computer.
          <br />
          It works 24/7.
        </h2>
        <p className="mt-5 max-w-lg text-[1.05rem] leading-relaxed text-mkt-muted">
          Close the app. Go home. The receptionist still answers. The inbox still files. The jobs you taught still run — on Melo’s machine, not yours.
        </p>
        <div className="mt-12">
          <ComputerShot />
        </div>
        <ul className="mt-16 grid gap-10 sm:grid-cols-3">
          {items.map((s) => (
            <li key={s.t}>
              <h3 className="text-xl font-semibold tracking-tight">{s.t}</h3>
              <p className="mt-2 max-w-xs text-[15px] leading-relaxed text-mkt-muted">{s.d}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function IntegrationsBlock() {
  const rowA = [
    { name: "WhatsApp", src: "/logos/whatsapp.svg?v=real" },
    { name: "Instagram", src: "/logos/instagram.svg?v=real" },
    { name: "Messenger", src: "/logos/messenger.png?v=live" },
    { name: "Facebook", src: "/logos/facebook.svg?v=real" },
    { name: "Twilio", src: "/logos/twilio.png?v=live" },
    { name: "Slack", src: "/logos/slack.png?v=live" },
    { name: "Gmail", src: "/logos/gmail.svg?v=real" },
    { name: "Stripe", src: "/logos/stripe.svg?v=real" },
    { name: "Xero", src: "/logos/xero.svg?v=real" },
    { name: "Shopify", src: "/logos/shopify.svg?v=real" },
    { name: "HubSpot", src: "/logos/hubspot.svg?v=real" },
    { name: "Zapier", src: "/logos/zapier.svg?v=real" },
  ];
  const rowB = [
    { name: "Google Calendar", src: "/logos/googlecalendar.svg?v=real" },
    { name: "Outlook", src: "/logos/microsoftoutlook.svg?v=real" },
    { name: "Square", src: "/logos/square.svg?v=real" },
    { name: "Zendesk", src: "/logos/zendesk.svg?v=real" },
    { name: "Calendly", src: "/logos/calendly.svg?v=real" },
    { name: "Salesforce", src: "/logos/salesforce.svg?v=real" },
    { name: "QuickBooks", src: "/logos/quickbooks.svg?v=real" },
    { name: "MYOB", src: "/logos/myob.svg?v=real" },
    { name: "ServiceM8", src: "/logos/servicem8.png?v=live" },
    { name: "Jobber", src: "/logos/jobber.svg?v=badge" },
    { name: "Fergus", src: "/logos/fergus.png?v=live" },
    { name: "Simpro", src: "/logos/simpro.png?v=live" },
    { name: "Pipedrive", src: "/logos/pipedrive.png?v=live" },
  ];
  return (
    <section className="overflow-hidden bg-[#f4f4f2] py-24 text-ink">
      <div className="mx-auto max-w-[1120px] px-6">
        <h2 className="text-4xl font-bold tracking-[-0.035em] sm:text-5xl">Plugs into the stack.</h2>
        <p className="mt-3 max-w-lg text-[1.05rem] leading-relaxed text-ink/55">
          Keep what already works. Melo is the office around it — so you can drop the answering service and the extra subscriptions.
        </p>
      </div>
      <div className="mt-12 space-y-6">
        <Escalator items={rowA} />
        <Escalator items={rowB} reverse />
      </div>
    </section>
  );
}

function Escalator({ items, reverse }: { items: { name: string; src: string }[]; reverse?: boolean }) {
  const loop = [...items, ...items];
  return (
    <div className="mkt-escalator-track">
      <div className={cn("mkt-escalator", reverse && "mkt-escalator-rev")}>
        {loop.map((l, i) => (
          <div key={`${l.name}-${i}`} className="flex w-[108px] shrink-0 flex-col items-center gap-2">
            <div className="grid size-[76px] place-items-center rounded-[18px] bg-white shadow-[0_8px_24px_rgba(17,17,17,0.06)]">
              <img src={l.src} alt={l.name} className="size-10 object-contain" />
            </div>
            <span className="text-[11px] text-ink/45">{l.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function VersusBlock() {
  const rows = [
    { label: "Monthly cost", human: "$70k+ per person, plus super", melo: "From $249. Flat." },
    { label: "Hours", human: "Shifts, leave, lunch", melo: "Melo Computer. 24/7." },
    { label: "Who answers", human: "One person. They get sick.", melo: "The firm — receptionist plus agents" },
    { label: "Quotes", human: "Another app, when they remember", melo: "Priced, emailed, e-signed" },
    { label: "Jobs", human: "A spreadsheet they keep", melo: "Pipeline, calendar, the lot" },
    { label: "At once", human: "One caller. Everyone else waits.", melo: "Unlimited. No queue." },
    { label: "Setup", human: "Weeks to hire and train", melo: "Live the same day" },
    { label: "When they leave", human: "The knowledge walks out", melo: "Trained on your site. Stays." },
  ];
  const last = rows.length - 1;
  return (
    <section className="mx-auto max-w-[1120px] px-6 pt-24">
      <h2 className="text-4xl font-bold tracking-[-0.035em] sm:text-5xl">
        Why businesses
        <br />
        choose Melo
      </h2>
      <p className="mt-3 max-w-lg text-[1.05rem] text-ink/55">
        Human agents vs an AI firm. See how we stack up — no fine print.
      </p>
      <div className="mt-10 overflow-x-auto">
        <div className="min-w-[640px] overflow-hidden rounded-[28px] bg-[#f2f2f0]">
          <div className="grid grid-cols-[minmax(132px,0.85fr)_1fr_1.2fr]">
            <div className="p-6" />
            <div className="p-6 text-[17px] font-semibold leading-tight">Human agents</div>
            <div className="flex items-center gap-2 rounded-t-[22px] bg-ink p-6 text-[17px] font-semibold text-white">
              <MeloMark className="size-6" />
              Melo
            </div>
            {rows.map((r, i) => (
              <Fragment key={r.label}>
                <div className="border-t border-black/8 px-6 py-5 text-sm font-medium">{r.label}</div>
                <VersusBad text={r.human} />
                <div
                  className={cn(
                    "flex items-start gap-2.5 border-t border-white/10 bg-ink px-6 py-5 text-sm text-white",
                    i === last && "rounded-b-[22px]",
                  )}
                >
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-[#2B7FFF]" />
                  <span>{r.melo}</span>
                </div>
              </Fragment>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function VersusBad({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2.5 border-t border-black/8 px-6 py-5 text-sm text-ink/50">
      <X className="mt-0.5 size-4 shrink-0 text-[#ff5a5a]" strokeWidth={2.4} />
      <span>{text}</span>
    </div>
  );
}

function PricingBlock() {
  return (
    <section id="pricing" className="scroll-mt-24 mx-auto max-w-[1120px] px-6 py-24">
      <h2 className="text-4xl font-bold tracking-[-0.035em] sm:text-5xl">Plans</h2>
      <p className="mt-3 max-w-xl text-[1.05rem] text-ink/55">
        Basic is the front desk. Pro is the office — seven days free. Agency is everything.
      </p>
      <div className="mt-10">
        <PricingGrid light />
      </div>
      <div className="mt-16">
        <CompareTable light />
      </div>
    </section>
  );
}

function Cell({ value, light }: { value: CompareCell; light?: boolean }) {
  if (value === true) return <Check className="mx-auto size-4 text-success" />;
  if (value === false) return <Minus className={cn("mx-auto size-4", light ? "text-ink/20" : "text-white/20")} />;
  return <span className="tabular">{value}</span>;
}

export function CompareTable({ light }: { light?: boolean }) {
  const cols = ["starter", "growth", "firm"] as const;
  return (
    <div className={cn("overflow-x-auto rounded-2xl border", light ? "border-black/10" : "border-white/10")}>
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className={light ? "border-b border-black/10" : "border-b border-white/10"}>
            <th className="px-4 py-3 font-medium">What’s included</th>
            {PLANS.map((p) => (
              <th
                key={p.id}
                className={cn("px-4 py-3 text-center font-semibold", p.id === "growth" && (light ? "bg-ink text-white" : "bg-white/10"))}
              >
                {p.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {COMPARE_GROUPS.map((g) => (
            <Fragment key={g.name}>
              <tr className={light ? "bg-zinc-50" : "bg-white/5"}>
                <td colSpan={4} className={cn("px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em]", light ? "text-ink/40" : "text-mkt-muted")}>
                  {g.name}
                </td>
              </tr>
              {g.rows.map((r) => (
                <tr key={r.label} className={light ? "border-t border-black/6" : "border-t border-white/10"}>
                  <td className="px-4 py-3">{r.label}</td>
                  {cols.map((c) => (
                    <td
                      key={c}
                      className={cn(
                        "px-4 py-3 text-center",
                        c === "growth" && (light ? "bg-ink/[0.03]" : "bg-white/5"),
                      )}
                    >
                      <Cell value={r[c]} light={light} />
                    </td>
                  ))}
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FaqBlock() {
  const faqs = [
    ["Does Melo run if I close the app?", "Yes. Melo has its own computer. Phone, inbox and taught tasks keep going 24/7 — not on your laptop."],
    ["Do I need a new number?", "No. Point the number you already have at Melo, or we’ll issue one."],
    ["Does it work on my website?", "Yes. Paste a snippet, or send your contact form to Melo. Enquiries land in Inbox."],
    ["What if I want to take the call?", "Transfer. Melo dials your mobile. You can barge in from Reception."],
    ["Do I need a card for the trial?", "Yes. Card at signup. You won’t be charged until day 8 unless you cancel."],
    ["Can I cancel?", "Yes. In Billing. The firm stays on until the period ends."],
    ["Does this replace my other tools?", "The answering service, the job board, quotes, follow-up — yes. Keep Xero, WhatsApp, Google Calendar; Melo connects and the rest can go."],
  ];
  return (
    <section className="mx-auto max-w-[1120px] px-6 py-24">
      <h2 className="text-4xl font-bold tracking-[-0.035em] sm:text-5xl">Questions</h2>
      <dl className="mt-10 divide-y divide-black/8 border-t border-black/8">
        {faqs.map(([q, a]) => (
          <div key={q} className="grid gap-2 py-5 sm:grid-cols-2">
            <dt className="text-sm font-medium">{q}</dt>
            <dd className="text-sm leading-relaxed text-ink/55">{a}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function JoinBlock() {
  return (
    <section className="relative overflow-hidden px-6 py-28">
      <div aria-hidden className="mkt-join-beam mkt-join-beam-warm" />
      <div aria-hidden className="mkt-join-beam mkt-join-beam-cool" />
      <div className="relative mx-auto grid max-w-[1120px] items-center gap-16 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="flex justify-center lg:justify-start">
          <div className="mkt-join-mark">
            <MeloMark className="relative z-10 size-28" />
          </div>
        </div>
        <div>
          <h2 className="text-4xl font-bold tracking-[-0.035em] sm:text-5xl sm:leading-[1.05]">
            One platform.
            <br />
            The whole office.
          </h2>
          <p className="mt-4 max-w-md text-[1.05rem] leading-relaxed text-mkt-muted">
            Phone, jobs, quotes, calendar, AI agents — on Melo’s computer, 24/7. Plug in Xero, WhatsApp, the tools you keep — cancel the rest.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/signup" className="mkt-pill-cream inline-flex h-12 items-center px-7 text-[15px] font-semibold">
              Get Melo
            </Link>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event("melo-hear-sample"))}
              className="inline-flex h-12 items-center rounded-full border border-white/15 px-6 text-[15px] font-medium"
            >
              Hear a sample
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
