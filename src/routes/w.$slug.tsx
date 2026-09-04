import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MeloMark } from "@/components/brand/melo-mark";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/w/$slug")({
  component: PublicWidget,
});

function PublicWidget() {
  const { slug } = Route.useParams();
  const [brand, setBrand] = useState("Melo");
  const [greeting, setGreeting] = useState("How can I help?");
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [messages, setMessages] = useState<{ from: "bot" | "you"; text: string }[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void fetch(`/api/widget/${slug}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok) return;
        setBrand(d.brand);
        setGreeting(d.greeting);
        setMessages([{ from: "bot", text: d.greeting }]);
      })
      .catch(() => undefined);
  }, [slug]);

  const send = async () => {
    const t = text.trim();
    if (!t || busy) return;
    setText("");
    setMessages((m) => [...m, { from: "you", text: t }]);
    setBusy(true);
    try {
      const res = await fetch(`/api/widget/${slug}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: t, name, phone }),
      });
      const d = (await res.json()) as { ok?: boolean; reply?: string };
      setMessages((m) => [...m, { from: "bot", text: d.reply || "Thanks — we'll be in touch." }]);
    } catch {
      setMessages((m) => [...m, { from: "bot", text: "Couldn't send just then. Call the office." }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex items-center gap-2 bg-primary px-4 py-3 text-primary-foreground">
        <MeloMark className="size-7" />
        <div>
          <div className="text-sm font-semibold">{brand}</div>
          <div className="text-[11px] text-primary-foreground/80">Usually replies in seconds</div>
        </div>
      </header>
      <div className="melo-scroll flex-1 space-y-2 overflow-y-auto p-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.from === "you"
                ? "ml-auto max-w-[85%] rounded-xl bg-primary px-3 py-2 text-sm text-primary-foreground"
                : "max-w-[85%] rounded-xl border border-border bg-canvas px-3 py-2 text-sm"
            }
          >
            {m.text}
          </div>
        ))}
      </div>
      <form
        className="space-y-2 border-t border-border p-3"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <div className="grid grid-cols-2 gap-2">
          <input className="h-9 rounded-md border border-border px-2 text-sm" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="h-9 rounded-md border border-border px-2 text-sm" placeholder="Mobile" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <input
            className="h-10 flex-1 rounded-md border border-border px-3 text-sm"
            placeholder="Ask about a job, a price, a booking…"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <Button type="submit" disabled={busy || !text.trim()}>
            Send
          </Button>
        </div>
      </form>
    </div>
  );
}
