import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { enableMeloChannel, listMeloNumbers, provisionMeloNumber } from "@/lib/channels/actions";
import { toast } from "sonner";

export type ConnectKind = "twilio" | "whatsapp" | "instagram" | "messenger" | "facebook" | "imessage";

const CITIES: { label: string; area: string }[] = [
  { label: "Sydney", area: "2" },
  { label: "Melbourne", area: "3" },
  { label: "Brisbane", area: "7" },
  { label: "Adelaide / Perth", area: "8" },
];

export function ChannelConnectDialog({
  kind,
  open,
  onClose,
  onDone,
}: {
  kind: ConnectKind | null;
  open: boolean;
  onClose: () => void;
  onDone?: () => void;
}) {
  if (!kind) return null;
  const number = kind === "twilio";
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogTitle>{number ? "Get a Melo number" : `Turn on ${label(kind)}`}</DialogTitle>
        <DialogDescription>
          {number
            ? "Melo buys and hosts the line. You don’t need Twilio. Voice, SMS and the receptionist are included in your plan."
            : "Melo hosts this channel on your office. No API keys — we pay the vendor, you just use it."}
        </DialogDescription>
        {number ? <MeloNumberFields onClose={onClose} onDone={onDone} /> : <EnableFields kind={kind} onClose={onClose} onDone={onDone} />}
      </DialogContent>
    </Dialog>
  );
}

function label(kind: ConnectKind) {
  return { twilio: "Melo number", whatsapp: "WhatsApp", instagram: "Instagram", messenger: "Messenger", facebook: "Facebook", imessage: "iMessage" }[kind];
}

function MeloNumberFields({ onClose, onDone }: { onClose: () => void; onDone?: () => void }) {
  const [ownerPhone, setOwnerPhone] = useState("");
  const [area, setArea] = useState("2");
  const [pick, setPick] = useState("");
  const [choices, setChoices] = useState<{ phone: string; locality: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(true);

  useEffect(() => {
    void listMeloNumbers({ data: { areaCode: area } })
      .then((r) => {
        setReady(r.ready);
        setChoices(r.numbers.map((n) => ({ phone: n.phone, locality: n.locality })));
        if (r.numbers[0] && !pick) setPick(r.numbers[0].phone);
      })
      .catch(() => setReady(false));
  }, [area]);

  return (
    <form
      className="mt-4 space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        setBusy(true);
        void provisionMeloNumber({ data: { ownerPhone, areaCode: area, phone: pick || undefined } })
          .then((r) => {
            toast.success(`Receptionist live on ${r.number}`);
            onDone?.();
            onClose();
          })
          .catch((err: Error) => toast.error(err.message))
          .finally(() => setBusy(false));
      }}
    >
      {!ready ? (
        <p className="rounded-lg border border-border bg-muted px-3 py-2 text-sm">
          Melo’s carrier is coming online. Leave your mobile — we’ll drop a number on this office the moment it’s attached.
        </p>
      ) : null}
      <Field label="City">
        <div className="flex flex-wrap gap-1.5">
          {CITIES.map((c) => (
            <button
              key={c.area}
              type="button"
              onClick={() => setArea(c.area)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${area === c.area ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </Field>
      {choices.length ? (
        <Field label="Number">
          <select
            className="h-10 w-full rounded-md border border-border bg-canvas px-3 text-sm"
            value={pick}
            onChange={(e) => setPick(e.target.value)}
          >
            {choices.map((n) => (
              <option key={n.phone} value={n.phone}>
                {n.phone} {n.locality ? `· ${n.locality}` : ""}
              </option>
            ))}
          </select>
        </Field>
      ) : null}
      <Field label="Your mobile — for transfers">
        <Input value={ownerPhone} onChange={(e) => setOwnerPhone(e.target.value)} placeholder="04…" required />
      </Field>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={busy}>
          {busy ? "Getting the number…" : "Get this number"}
        </Button>
      </div>
    </form>
  );
}

function EnableFields({ kind, onClose, onDone }: { kind: ConnectKind; onClose: () => void; onDone?: () => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="mt-4 space-y-4">
      <p className="text-sm text-muted-foreground">
        Melo pays {label(kind)} and routes it to this office. Callers and messages stay on your Melo Computer.
      </p>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          disabled={busy}
          onClick={() => {
            setBusy(true);
            void enableMeloChannel({ data: kind === "twilio" ? "voice" : kind })
              .then((r) => {
                toast.success(r.detail);
                onDone?.();
                onClose();
              })
              .catch((err: Error) => toast.error(err.message))
              .finally(() => setBusy(false));
          }}
        >
          {busy ? "Turning on…" : "Turn on"}
        </Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}
