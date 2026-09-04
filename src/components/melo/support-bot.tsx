import { useEffect, useRef, useState } from "react";
import { ArrowUp, X } from "lucide-react";
import { MeloMark } from "@/components/brand/melo-mark";
import { askMeloFn } from "@/lib/ai";
import {
  SUPPORT_CHIPS_APP,
  SUPPORT_CHIPS_WEB,
  SUPPORT_GREETING,
  SUPPORT_SYSTEM,
  answerSupport,
  type SupportLink,
} from "@/lib/melo/support";
import { cn, uid } from "@/lib/utils";

type Msg = { id: string; role: "melo" | "you"; text: string; links?: SupportLink[]; chips?: string[] };

export function SupportBot({
  tone = "light",
  surface = "web",
  hidden,
}: {
  tone?: "dark" | "light";
  surface?: "web" | "app";
  hidden?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>(() => [
    {
      id: "hi",
      role: "melo",
      text: SUPPORT_GREETING,
      chips: surface === "app" ? SUPPORT_CHIPS_APP : SUPPORT_CHIPS_WEB,
    },
  ]);
  const scroller = useRef<HTMLDivElement>(null);
  const dark = tone === "dark";
  const label = surface === "app" ? "Help" : "Ask Melo";

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [msgs, open]);

  if (hidden) return null;

  const send = async (raw: string) => {
    const q = raw.trim();
    if (!q || busy) return;
    setText("");
    setMsgs((m) => [...m, { id: uid("s"), role: "you", text: q }]);
    const local = answerSupport(q);
    const known = !local.text.startsWith("I can cover plans");
    if (known) {
      setMsgs((m) => [...m, { id: uid("s"), role: "melo", ...local }]);
      return;
    }
    setBusy(true);
    const ai = await askMeloFn({ data: { message: q, system: SUPPORT_SYSTEM } }).catch(() => ({ ok: false as const }));
    setBusy(false);
    if (ai && "ok" in ai && ai.ok && ai.text.trim()) {
      setMsgs((m) => [...m, { id: uid("s"), role: "melo", text: ai.text.trim(), chips: local.chips, links: local.links }]);
      return;
    }
    setMsgs((m) => [...m, { id: uid("s"), role: "melo", ...local }]);
  };

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-40 flex flex-col items-end gap-3">
      {open ? (
        <div
          className={cn(
            "pointer-events-auto flex h-[min(540px,calc(100dvh-6.5rem))] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.28)] mkt-support-in",
            dark ? "border border-white/10 bg-[#10131a] text-mkt-fg" : "border border-border bg-canvas text-foreground",
          )}
        >
          <div className={cn("flex items-center gap-3 px-4 py-3", dark ? "border-b border-white/10" : "border-b border-border")}>
            <MeloMark className="size-8" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold tracking-tight">Melo</div>
              <div className={cn("text-[11px]", dark ? "text-mkt-muted" : "text-muted-foreground")}>Support · usually seconds</div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className={cn("grid size-8 place-items-center rounded-full", dark ? "hover:bg-white/10" : "hover:bg-muted")}
              aria-label="Close support"
            >
              <X className="size-4" />
            </button>
          </div>

          <div ref={scroller} className="melo-scroll min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {msgs.map((m) => (
              <div key={m.id} className={cn("flex", m.role === "you" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed",
                    m.role === "you"
                      ? "rounded-br-md bg-primary text-primary-foreground"
                      : dark
                        ? "rounded-bl-md bg-white/5"
                        : "rounded-bl-md bg-muted",
                  )}
                >
                  {m.text}
                  {m.links?.length ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {m.links.map((l) => (
                        <a
                          key={l.href}
                          href={l.href}
                          className={cn(
                            "rounded-full px-2.5 py-1 text-[12px] font-medium",
                            dark ? "bg-white/10 hover:bg-white/15" : "bg-background hover:bg-canvas",
                          )}
                        >
                          {l.label}
                        </a>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
            {busy ? (
              <div className={cn("w-fit rounded-2xl rounded-bl-md px-3.5 py-2.5 text-xs", dark ? "bg-white/5 text-mkt-muted" : "bg-muted text-muted-foreground")}>
                Thinking…
              </div>
            ) : null}
          </div>

          <div className={cn("px-3 pb-2", dark ? "border-t border-white/10" : "border-t border-border")}>
            <div className="flex flex-wrap gap-1.5 py-2">
              {(surface === "app" ? SUPPORT_CHIPS_APP : SUPPORT_CHIPS_WEB).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => void send(c)}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[12px] transition-colors",
                    dark ? "bg-white/5 text-mkt-fg hover:bg-white/10" : "bg-muted text-foreground hover:bg-accent",
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
            <form
              className={cn("mb-2 flex items-center gap-2 rounded-full px-3 py-1.5", dark ? "bg-white/5" : "bg-muted")}
              onSubmit={(e) => {
                e.preventDefault();
                void send(text);
              }}
            >
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Ask about Melo…"
                className={cn(
                  "h-9 min-w-0 flex-1 bg-transparent text-sm outline-none",
                  dark ? "placeholder:text-mkt-muted" : "placeholder:text-muted-foreground",
                )}
              />
              <button
                type="submit"
                disabled={!text.trim() || busy}
                className="grid size-8 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-40"
                aria-label="Send"
              >
                <ArrowUp className="size-4" />
              </button>
            </form>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "pointer-events-auto flex items-center gap-2 rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.28)] transition-transform hover:scale-[1.03]",
          open ? "size-12 justify-center bg-primary" : "h-12 pl-1.5 pr-4",
          !open && (dark ? "bg-[#10131a] ring-1 ring-white/12" : "bg-canvas ring-1 ring-border"),
        )}
        aria-label={open ? "Close Melo support" : "Open Melo support"}
      >
        {open ? (
          <X className="size-5 text-white" />
        ) : (
          <>
            <MeloMark className="size-9" />
            <span className={cn("text-sm font-medium", dark ? "text-mkt-fg" : "text-foreground")}>{label}</span>
          </>
        )}
      </button>
    </div>
  );
}
