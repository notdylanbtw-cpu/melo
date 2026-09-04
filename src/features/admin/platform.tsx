import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/misc";
import { getPlatformStatus, savePlatform } from "@/lib/admin/platform-actions";
import { toast } from "sonner";

const FIELDS: { key: string; label: string; hint: string }[] = [
  { key: "GOOGLE_CLIENT_ID", label: "Google client ID", hint: "Melo AI OAuth client — Gmail, Calendar, Business Profile" },
  { key: "GOOGLE_CLIENT_SECRET", label: "Google client secret", hint: "" },
  { key: "META_APP_ID", label: "Meta app ID", hint: "Facebook, Messenger, Instagram, WhatsApp" },
  { key: "META_APP_SECRET", label: "Meta app secret", hint: "" },
  { key: "TWILIO_ACCOUNT_SID", label: "Twilio account SID", hint: "Melo’s carrier — starts with AC" },
  { key: "TWILIO_AUTH_TOKEN", label: "Twilio auth token", hint: "" },
  { key: "MICROSOFT_CLIENT_ID", label: "Microsoft client ID", hint: "Outlook, Teams" },
  { key: "MICROSOFT_CLIENT_SECRET", label: "Microsoft client secret", hint: "" },
  { key: "STRIPE_CLIENT_ID", label: "Stripe client ID", hint: "Connect" },
  { key: "STRIPE_SECRET_KEY", label: "Stripe secret key", hint: "" },
  { key: "XERO_CLIENT_ID", label: "Xero client ID", hint: "" },
  { key: "XERO_CLIENT_SECRET", label: "Xero client secret", hint: "" },
  { key: "SLACK_CLIENT_ID", label: "Slack client ID", hint: "" },
  { key: "SLACK_CLIENT_SECRET", label: "Slack client secret", hint: "" },
];

export function AdminPlatform() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [ready, setReady] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void getPlatformStatus()
      .then((r) => {
        setReady(r.ready);
        setValues(r.masked);
      })
      .catch((err: Error) => toast.error(err.message));
  }, []);

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-xl font-semibold">Platform</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Melo’s vendor apps. Customers never see these. Paste once — Connect uses them as Melo, not Grok.
        </p>
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        {Object.entries(ready).map(([k, on]) => (
          <span key={k} className={on ? "text-success" : "text-muted-foreground"}>
            {k} {on ? "live" : "off"}
          </span>
        ))}
      </div>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setBusy(true);
          void savePlatform({ data: values })
            .then((r) => {
              setReady(r.ready);
              toast.success("Platform keys saved");
            })
            .catch((err: Error) => toast.error(err.message))
            .finally(() => setBusy(false));
        }}
      >
        {FIELDS.map((f) => (
          <label key={f.key} className="block space-y-1.5">
            <Label>{f.label}</Label>
            {f.hint ? <p className="text-xs text-muted-foreground">{f.hint}</p> : null}
            <Input
              value={values[f.key] ?? ""}
              onChange={(e) => setValues((s) => ({ ...s, [f.key]: e.target.value }))}
              autoComplete="off"
            />
          </label>
        ))}
        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : "Save platform keys"}
        </Button>
      </form>
    </div>
  );
}
