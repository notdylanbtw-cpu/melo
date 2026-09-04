import { useState } from "react";
import { MessageCircle, Phone, X } from "lucide-react";
import { toast } from "sonner";
import { MeloMark } from "@/components/brand/melo-mark";
import { Button } from "@/components/ui/button";
import { useMelo } from "@/lib/melo/store";
import { cn } from "@/lib/utils";

export function WidgetOverlay() {
  const open = useMelo((s) => s.widgetOpen);
  const setOpen = useMelo((s) => s.setWidgetOpen);
  const messages = useMelo((s) => s.widgetMessages);
  const send = useMelo((s) => s.widgetSend);
  const book = useMelo((s) => s.widgetBook);
  const step = useMelo((s) => s.widgetStep);
  const greeting = useMelo((s) => s.workspace.widgetGreeting);
  const brand = useMelo((s) => s.workspace.brandName);
  const [text, setText] = useState("Blocked drain in Newtown");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end bg-ink/20 p-4 sm:items-center sm:justify-center">
      <div className="flex w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-canvas shadow-hairline md:flex-row">
        <div className="hidden flex-1 bg-background p-8 md:block">
          <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Customer site preview</div>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">{brand}</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Licensed plumbing across the Inner West, Burwood and Bondi. The widget on the right uses the same knowledge as Receptionist and Ask Melo.
          </p>
          <pre className="mt-6 overflow-x-auto rounded-lg bg-ink p-4 text-xs text-primary-foreground">
            {`<script src="https://officialmelo.com/widget.js" data-melo="your-office" async></script>`}
          </pre>
        </div>
        <div className="flex h-[min(640px,90vh)] w-full flex-col md:w-[380px] md:border-l md:border-border">
          <div className="flex items-center justify-between bg-primary px-4 py-3 text-primary-foreground">
            <div className="flex items-center gap-2">
              <MeloMark className="size-7" />
              <div>
                <div className="text-sm font-semibold">{brand}</div>
                <div className="text-[11px] text-primary-foreground/80">Usually replies in seconds</div>
              </div>
            </div>
            <Button size="icon" variant="ghost" className="text-primary-foreground hover:bg-primary-hover" onClick={() => setOpen(false)} aria-label="Close widget">
              <X />
            </Button>
          </div>
          <div className="melo-scroll flex-1 space-y-3 overflow-y-auto bg-background p-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed",
                  m.from === "visitor" ? "ml-auto bg-primary text-primary-foreground" : "bg-canvas border border-border",
                )}
              >
                {m.text}
              </div>
            ))}
          </div>
          {step === "chat" ? (
            <div className="space-y-2 border-t border-border p-3">
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => send("Blocked drain in Newtown")}>
                  Blocked drain in Newtown
                </Button>
                <Button size="sm" variant="outline" className="flex-1" onClick={() => book()}>
                  Book Thu 7:30
                </Button>
              </div>
              <div className="flex gap-2">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      send(text);
                      setText("");
                    }
                  }}
                  className="h-9 flex-1 rounded-md border border-border px-3 text-sm outline-none"
                  placeholder={greeting}
                />
                <Button size="sm" onClick={() => { send(text); setText(""); }}>
                  Send
                </Button>
              </div>
              <button
                type="button"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => toast.success("Talk is ringing Northside · Receptionist will pick up")}
              >
                <Phone className="size-3" /> Talk instead
              </button>
            </div>
          ) : (
            <div className="border-t border-border p-4 text-sm">
              <div className="font-medium">You’re booked</div>
              <p className="mt-1 text-muted-foreground">Sam · Thursday 7:30 am · Newtown. This also landed in Inbox, Calendar and Pipeline.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function WidgetFab() {
  const setOpen = useMelo((s) => s.setWidgetOpen);
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="fixed right-4 bottom-20 z-30 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-hairline hover:bg-primary-hover lg:bottom-4"
      aria-label="Preview customer widget"
    >
      <MessageCircle className="size-5" />
    </button>
  );
}
