import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MeloMark } from "@/components/brand/melo-mark";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/book/$slug")({
  component: PublicBook,
  head: () => ({ meta: [{ title: "Book — Melo" }] }),
});

const SLOTS = ["Thu 7:30 am", "Thu 9:00 am", "Fri 8:00 am", "Fri 11:30 am"];

function PublicBook() {
  const { slug } = Route.useParams();
  const [brand, setBrand] = useState("Melo");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [suburb, setSuburb] = useState("");
  const [slot, setSlot] = useState(SLOTS[0]!);
  const [note, setNote] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void fetch(`/api/widget/${slug}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setBrand(d.brand);
      })
      .catch(() => undefined);
  }, [slug]);

  const submit = async () => {
    if (!name.trim() || !phone.trim() || busy) return;
    setBusy(true);
    try {
      await fetch(`/api/widget/${slug}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          source: "form",
          name: name.trim(),
          phone: phone.trim(),
          text: `Booking ${slot}${suburb ? ` · ${suburb}` : ""}${note ? ` — ${note}` : ""}`,
        }),
      });
      setDone(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-dvh bg-background px-4 py-16 text-foreground">
      <div className="mx-auto w-full max-w-md">
        <MeloMark className="size-9" />
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">Book with {brand}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Pick a window. It lands in Inbox, Calendar and Pipeline.</p>
        {done ? (
          <p className="mt-8 rounded-xl border border-border bg-canvas p-5 text-sm">
            Locked {slot}. We’ll text {phone} when we’re 20 minutes away.
          </p>
        ) : (
          <form
            className="mt-8 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
          >
            <label className="block text-sm">
              Name
              <input className="mt-1 h-10 w-full rounded-md border border-border px-3" value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
            <label className="block text-sm">
              Mobile
              <input className="mt-1 h-10 w-full rounded-md border border-border px-3" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </label>
            <label className="block text-sm">
              Suburb
              <input className="mt-1 h-10 w-full rounded-md border border-border px-3" value={suburb} onChange={(e) => setSuburb(e.target.value)} />
            </label>
            <div>
              <div className="text-sm">Window</div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {SLOTS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSlot(s)}
                    className={`h-10 rounded-md border text-sm ${slot === s ? "border-primary bg-accent font-medium" : "border-border"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <label className="block text-sm">
              What’s the job
              <textarea className="mt-1 w-full rounded-md border border-border p-3 text-sm" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
            </label>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Booking…" : "Book this window"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
