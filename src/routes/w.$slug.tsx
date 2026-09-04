import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Minus, Send, X } from "lucide-react";
import { MeloMark } from "@/components/brand/melo-mark";

export const Route = createFileRoute("/w/$slug")({
  headers: () => ({
    "Content-Security-Policy": "frame-ancestors *",
  }),
  component: PublicWidget,
});

function PublicWidget() {
  const { slug } = Route.useParams();
  const embed = typeof window !== "undefined" && (new URLSearchParams(window.location.search).has("embed") || window.self !== window.top);
  const [brand, setBrand] = useState("the office");
  const [greeting, setGreeting] = useState("How can I help you today?");
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [messages, setMessages] = useState<{ from: "bot" | "you"; text: string; at: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void fetch(`/api/widget/${slug}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok) return;
        setBrand(d.brand);
        setGreeting(d.greeting);
        setMessages([{ from: "bot", text: d.greeting, at: stamp() }]);
        setReady(true);
      })
      .catch(() => undefined);
  }, [slug]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  const send = async () => {
    const t = text.trim();
    if (!t || busy) return;
    setText("");
    setMessages((m) => [...m, { from: "you", text: t, at: stamp() }]);
    setBusy(true);
    try {
      const res = await fetch(`/api/widget/${slug}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: t, name, phone, source: "chat" }),
      });
      const d = (await res.json()) as { ok?: boolean; reply?: string };
      setMessages((m) => [...m, { from: "bot", text: d.reply || "Thanks — we’ll be in touch.", at: stamp() }]);
    } catch {
      setMessages((m) => [...m, { from: "bot", text: "Couldn’t send just then. Leave a mobile and we’ll call you.", at: stamp() }]);
    } finally {
      setBusy(false);
    }
  };

  const ping = (event: "close" | "minimize") => {
    if (window.parent !== window) window.parent.postMessage({ source: "melo-widget", event }, "*");
  };

  return (
    <div className={embed ? "flex h-dvh flex-col bg-white text-zinc-900" : "flex min-h-dvh flex-col bg-background"}>
      <header className="flex items-center gap-3 border-b border-zinc-100 px-4 py-3">
        <span className="grid size-9 place-items-center overflow-hidden rounded-full bg-[#2B7FFF]">
          <MeloMark className="size-9" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{ready ? brand : "Melo"}</div>
          <div className="text-[11px] text-zinc-500">Usually replies in seconds</div>
        </div>
        {embed ? (
          <div className="flex items-center gap-1 text-zinc-400">
            <button type="button" className="grid size-8 place-items-center rounded-md hover:bg-zinc-100" aria-label="Minimise" onClick={() => ping("minimize")}>
              <Minus className="size-4" />
            </button>
            <button type="button" className="grid size-8 place-items-center rounded-md hover:bg-zinc-100" aria-label="Close" onClick={() => ping("close")}>
              <X className="size-4" />
            </button>
          </div>
        ) : null}
      </header>

      <div ref={scroller} className="melo-scroll min-h-0 flex-1 overflow-y-auto px-4 py-5">
        {messages.length <= 1 ? (
          <div className="mb-8 flex flex-col items-center text-center">
            <span className="grid size-16 place-items-center overflow-hidden rounded-full bg-[#2B7FFF] shadow-sm">
              <MeloMark className="size-16" />
            </span>
            <div className="mt-3 text-base font-semibold">{brand}</div>
            <p className="mt-1 max-w-[16rem] text-sm text-zinc-500">Our virtual agent is here to help you today</p>
          </div>
        ) : null}

        <div className="space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={m.from === "you" ? "ml-auto max-w-[85%]" : "max-w-[88%]"}>
              <div
                className={
                  m.from === "you"
                    ? "rounded-2xl bg-[#2B7FFF] px-3.5 py-2.5 text-sm leading-relaxed text-white"
                    : "rounded-2xl bg-zinc-50 px-3.5 py-2.5 text-sm leading-relaxed text-zinc-800"
                }
              >
                {m.text}
              </div>
              <div className="mt-1 px-1 text-[10px] text-zinc-400">{m.at}</div>
            </div>
          ))}
          {busy ? <div className="max-w-[88%] rounded-2xl bg-zinc-50 px-3.5 py-2.5 text-sm text-zinc-400">Typing…</div> : null}
        </div>
      </div>

      <form
        className="border-t border-zinc-100 p-3"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        {messages.some((m) => m.from === "you") ? null : (
          <div className="mb-2 grid grid-cols-2 gap-2">
            <input className="h-9 rounded-lg border border-zinc-200 px-2.5 text-sm outline-none focus:border-[#2B7FFF]" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
            <input className="h-9 rounded-lg border border-zinc-200 px-2.5 text-sm outline-none focus:border-[#2B7FFF]" placeholder="Mobile" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        )}
        <div className="flex items-end gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 focus-within:border-[#2B7FFF]">
          <textarea
            rows={1}
            className="max-h-24 min-h-10 flex-1 resize-none bg-transparent py-2 text-sm outline-none"
            placeholder="Write your message here…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
          />
          <button type="submit" disabled={busy || !text.trim()} className="grid size-9 place-items-center rounded-lg bg-[#2B7FFF] text-white disabled:opacity-40" aria-label="Send">
            <Send className="size-4" />
          </button>
        </div>
        <p className="mt-2 text-center text-[11px] text-zinc-400">
          Powered by <span className="font-medium text-zinc-600">Melo</span>
        </p>
      </form>
    </div>
  );
}

function stamp() {
  try {
    return new Intl.DateTimeFormat("en-AU", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Australia/Sydney",
    }).format(new Date());
  } catch {
    return "";
  }
}
