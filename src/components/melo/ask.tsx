import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowUp, AtSign, Mic, Paperclip, Phone, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AgentPortrait } from "@/components/melo/portrait";
import { askMeloFn } from "@/lib/ai";
import { systemPrompt } from "@/lib/melo/ask";
import { localAsk } from "@/lib/melo/ask";
import { parseMoneyAsk } from "@/lib/melo/price-ask";
import { useMelo } from "@/lib/melo/store";
import type { ChatChip } from "@/lib/melo/types";
import { cn, uid } from "@/lib/utils";

function shouldOpenDrawer() {
  return true;
}

export function useChipHandler() {
  const navigate = useNavigate();
  const bookSlot = useMelo((s) => s.bookSlot);
  const selectReview = useMelo((s) => s.selectReview);
  const selectJob = useMelo((s) => s.selectJob);
  const selectConversation = useMelo((s) => s.selectConversation);
  const setAskOpen = useMelo((s) => s.setAskOpen);
  const approve = useMelo((s) => s.approveReview);

  return (chip: ChatChip) => {
    if (chip.action === "book") {
      bookSlot(chip.payload?.staffId ?? "sam", chip.payload?.start ?? "", chip.payload?.jobId);
    } else if (chip.action === "approve_send") {
      approve(chip.payload?.id ?? "");
    } else if (chip.action === "open_review" || chip.action === "draft_quote") {
      selectReview(chip.payload?.id ?? "rev-q2041");
      setAskOpen(false);
      void navigate({ to: "/app/review" });
    } else if (chip.action === "open_job") {
      selectJob(chip.payload?.id ?? null);
      setAskOpen(false);
      void navigate({ to: "/app/pipeline" });
    } else if (chip.action === "open_inbox") {
      selectConversation(chip.payload?.id ?? "conv-mia");
      setAskOpen(false);
      void navigate({ to: "/app/inbox" });
    } else if (chip.action === "run") {
      const run = chip.payload?.run;
      setAskOpen(false);
      if (run === "knowledge") void navigate({ to: "/app/knowledge" });
      if (run === "reach") void navigate({ to: "/app/reach" });
      if (run === "overnight") void navigate({ to: "/app" });
      if (run === "calendar") void navigate({ to: "/app/calendar" });
      if (run === "reception") void navigate({ to: "/app/reception" });
      if (run === "firm") void navigate({ to: "/app/firm" });
      if (run === "invoices") {
        useMelo.getState().setPipelineTab("invoices");
        void navigate({ to: "/app/pipeline" });
      }
      if (run === "train") {
        useMelo.getState().setSettingsTab("train");
        void navigate({ to: "/app/settings" });
      }
      if (run === "sign") {
        void navigate({ to: "/sign/$quoteId", params: { quoteId: chip.payload?.id ?? "q-2041" } });
      }
    }
  };
}

export async function submitAsk(text: string, opts?: { openDrawer?: boolean }) {
  const trimmed = text.trim();
  if (!trimmed) return;
  const store = useMelo.getState();
  const openDrawer = opts?.openDrawer ?? shouldOpenDrawer();
  if (openDrawer) store.setAskOpen(true);
  if (parseMoneyAsk(trimmed) || localAsk(trimmed, store)) {
    store.sendAsk(trimmed);
    return;
  }
  store.setAsking(true);
  store.pushChat({ id: uid("chat"), at: new Date().toISOString(), role: "user", text: trimmed });
  const fallback =
    "Helix can take that. I mapped it as a goal — specialists will draft in Review if it touches money, messages or public content.";
  try {
    const res = await askMeloFn({ data: { message: trimmed, system: systemPrompt(useMelo.getState()) } });
    store.pushChat({
      id: uid("chat"),
      at: new Date().toISOString(),
      role: "melo",
      text: res.ok && res.text.trim() ? res.text : fallback,
      agentId: "helix",
    });
  } catch {
    useMelo.getState().pushChat({
      id: uid("chat"),
      at: new Date().toISOString(),
      role: "melo",
      text: fallback,
      agentId: "helix",
    });
  } finally {
    useMelo.getState().setAsking(false);
  }
}

export function AskComposer({
  variant = "hero",
  autoFocus,
}: {
  variant?: "hero" | "bar" | "drawer";
  autoFocus?: boolean;
}) {
  const [value, setValue] = useState("");
  const asking = useMelo((s) => s.asking);
  const navigate = useNavigate();

  const send = () => {
    const t = value;
    setValue("");
    void submitAsk(t);
  };

  return (
    <div
      className={cn(
        "border border-border bg-canvas",
        variant === "hero" && "rounded-xl p-3",
        variant === "bar" && "rounded-lg",
        variant === "drawer" && "rounded-xl p-2",
      )}
    >
      <textarea
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
          }
        }}
        placeholder="Ask Melo to handle anything in your business…"
        rows={variant === "hero" ? 3 : 2}
        className="w-full resize-none bg-transparent px-2 py-2 text-[15px] outline-none placeholder:text-subtle"
      />
      <div className="flex items-center justify-between px-1 pb-1">
        <div className="flex items-center gap-0.5">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label="Attach"
            className="size-8 text-muted-foreground"
            onClick={() => toast.message("Drop files on a job record — Pipeline → Attachments")}
          >
            <Paperclip />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label="Mention an AI agent"
            className="size-8 text-muted-foreground"
            onClick={() => setValue((v) => `${v}${v && !v.endsWith(" ") ? " " : ""}@`)}
          >
            <AtSign />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label="Voice"
            className="size-8 text-muted-foreground"
            onClick={() => toast.message("Voice lives on Reception. Type here, or press ⌘K.")}
          >
            <Mic />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label="Open reception"
            className="size-8 text-muted-foreground"
            onClick={() => void navigate({ to: "/app/reception" })}
          >
            <Phone />
          </Button>
        </div>
        <Button type="button" size="icon" className="size-8 rounded-full" onClick={send} disabled={!value.trim() || asking} aria-label="Send">
          <ArrowUp />
        </Button>
      </div>
    </div>
  );
}

export function AskChips({ onPick }: { onPick?: (t: string) => void }) {
  const chips = [
    "What should I do first?",
    "Draft a quote for a new customer",
    "Who’s on today?",
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => {
            onPick?.(c);
            void submitAsk(c);
          }}
          className="rounded-full border border-border bg-canvas px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-muted"
        >
          {c}
        </button>
      ))}
    </div>
  );
}

export function AskThread({ className }: { className?: string }) {
  const chat = useMelo((s) => s.chat);
  const agents = useMelo((s) => s.agents);
  const asking = useMelo((s) => s.asking);
  const onChip = useChipHandler();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [chat.length, asking]);

  return (
    <div ref={ref} className={cn("melo-scroll space-y-4 overflow-y-auto", className)}>
      {chat.map((m) => {
        const agent = agents.find((a) => a.id === m.agentId);
        if (m.role === "user") {
          return (
            <div key={m.id} className="ml-10 rounded-xl bg-primary px-3 py-2 text-sm text-primary-foreground">
              {m.text}
            </div>
          );
        }
        return (
          <div key={m.id} className="flex gap-2">
            {agent ? <AgentPortrait agent={agent} size={28} /> : <span className="size-7 shrink-0" />}
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium text-muted-foreground">{agent?.name ?? "Helix"}</div>
              <div className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-pretty">{m.text}</div>
              {m.chips?.length ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {m.chips.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => onChip(c)}
                      className="rounded-full border border-border bg-canvas px-2.5 py-1 text-xs font-medium transition-colors hover:bg-muted"
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
      {asking ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="size-1.5 rounded-full bg-primary live-dot" />
          Helix is assigning specialists…
        </div>
      ) : null}
    </div>
  );
}

export function AskDrawer() {
  const open = useMelo((s) => s.askOpen);
  const setOpen = useMelo((s) => s.setAskOpen);
  if (!open) return null;
  return (
    <div className="fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col border-l border-border bg-canvas shadow-hairline">
      <div className="flex h-14 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="size-4 text-primary" />
          Ask Melo
        </div>
        <Button size="icon" variant="ghost" onClick={() => setOpen(false)} aria-label="Close">
          <X />
        </Button>
      </div>
      <AskThread className="flex-1 p-4" />
      <div className="border-t border-border p-3">
        <AskComposer variant="drawer" autoFocus />
      </div>
    </div>
  );
}
