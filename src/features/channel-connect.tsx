import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { connectIMessage, connectMetaChannel, connectTwilio } from "@/lib/channels/actions";
import { toast } from "sonner";

export type ConnectKind = "twilio" | "whatsapp" | "instagram" | "messenger" | "facebook" | "imessage";

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
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogTitle>Connect {label(kind)}</DialogTitle>
        <DialogDescription>Credentials stay on your workspace. Melo uses them to send and receive.</DialogDescription>
        {kind === "twilio" ? <TwilioFields onClose={onClose} onDone={onDone} /> : null}
        {kind === "imessage" ? <IMessageFields onClose={onClose} onDone={onDone} /> : null}
        {kind !== "twilio" && kind !== "imessage" ? <MetaFields kind={kind} onClose={onClose} onDone={onDone} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function label(kind: ConnectKind) {
  return { twilio: "Twilio", whatsapp: "WhatsApp", instagram: "Instagram", messenger: "Messenger", facebook: "Facebook", imessage: "iMessage" }[kind];
}

function TwilioFields({ onClose, onDone }: { onClose: () => void; onDone?: () => void }) {
  const [accountSid, setAccountSid] = useState("");
  const [authToken, setAuthToken] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="mt-4 space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        setBusy(true);
        void connectTwilio({ data: { accountSid, authToken, phoneNumber, ownerPhone } })
          .then((r) => {
            toast.success(`Receptionist live on ${r.number}`);
            onDone?.();
            onClose();
          })
          .catch((err: Error) => toast.error(err.message))
          .finally(() => setBusy(false));
      }}
    >
      <Field label="Account SID">
        <Input value={accountSid} onChange={(e) => setAccountSid(e.target.value)} placeholder="ACxxxxxxxx" required />
      </Field>
      <Field label="Auth token">
        <Input type="password" value={authToken} onChange={(e) => setAuthToken(e.target.value)} required />
      </Field>
      <Field label="Twilio number">
        <Input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+61…" required />
      </Field>
      <Field label="Your mobile (transfers)">
        <Input value={ownerPhone} onChange={(e) => setOwnerPhone(e.target.value)} placeholder="+61…" required />
      </Field>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={busy}>
          {busy ? "Connecting…" : "Connect"}
        </Button>
      </div>
    </form>
  );
}

function MetaFields({
  kind,
  onClose,
  onDone,
}: {
  kind: Exclude<ConnectKind, "twilio" | "imessage">;
  onClose: () => void;
  onDone?: () => void;
}) {
  const [token, setToken] = useState("");
  const [externalId, setExternalId] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="mt-4 space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        setBusy(true);
        void connectMetaChannel({ data: { kind, token, externalId } })
          .then((r) => {
            toast.success(`${label(kind)} live · ${r.label}`);
            onDone?.();
            onClose();
          })
          .catch((err: Error) => toast.error(err.message))
          .finally(() => setBusy(false));
      }}
    >
      <Field label={kind === "whatsapp" ? "Phone number ID" : "Page or account ID"}>
        <Input value={externalId} onChange={(e) => setExternalId(e.target.value)} required />
      </Field>
      <Field label="Access token">
        <Input type="password" value={token} onChange={(e) => setToken(e.target.value)} required />
      </Field>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={busy}>
          {busy ? "Connecting…" : "Connect"}
        </Button>
      </div>
    </form>
  );
}

function IMessageFields({ onClose, onDone }: { onClose: () => void; onDone?: () => void }) {
  const [apiKey, setApiKey] = useState("");
  const [from, setFrom] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="mt-4 space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        setBusy(true);
        void connectIMessage({ data: { provider: "sendblue", apiKey, from } })
          .then(() => {
            toast.success("iMessage connected");
            onDone?.();
            onClose();
          })
          .catch((err: Error) => toast.error(err.message))
          .finally(() => setBusy(false));
      }}
    >
      <Field label="Sendblue API key">
        <Input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} required />
      </Field>
      <Field label="From number">
        <Input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="+61…" required />
      </Field>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={busy}>
          {busy ? "Connecting…" : "Connect"}
        </Button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
