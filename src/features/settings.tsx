import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Separator } from "@/components/ui/misc";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { persistOfficeCopy } from "@/lib/account";
import { INDUSTRY_OPTIONS } from "@/lib/melo/terminology";
import { useMelo } from "@/lib/melo/store";
import type { Industry, InvoiceTemplateKind } from "@/lib/melo/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { TEMPLATE_TOKENS } from "@/lib/melo/invoice-templates";
import { SUGGESTED_TOOLS } from "@/lib/melo/train";
import { dt } from "@/lib/format";
import { BillingPane } from "@/features/billing";
import { ChannelConnectDialog } from "@/features/channel-connect";
import { listChannelAccounts, testTwilioCall } from "@/lib/channels/actions";

const TABS = [
  { id: "workspace", label: "Workspace" },
  { id: "train", label: "Train Melo" },
  { id: "playbooks", label: "Playbooks" },
  { id: "numbers", label: "Numbers" },
  { id: "billing", label: "Billing" },
  { id: "brand", label: "Brand" },
  { id: "templates", label: "Templates" },
  { id: "team", label: "Team" },
  { id: "voice", label: "Voice" },
] as const;

export function SettingsPage() {
  const tab = useMelo((s) => s.settingsTab);
  const setTab = useMelo((s) => s.setSettingsTab);
  return (
    <div className="flex h-[calc(100dvh-56px)] min-h-0 flex-col lg:flex-row">
      <nav className="flex shrink-0 gap-1 overflow-x-auto border-b border-border bg-canvas p-2 lg:w-48 lg:flex-col lg:overflow-visible lg:border-r lg:border-b-0 lg:p-3">
        <div className="hidden px-2 pb-2 text-sm font-semibold lg:block">Settings</div>
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "flex h-9 shrink-0 items-center rounded-md px-3 text-sm lg:w-full lg:px-2",
              tab === t.id ? "bg-muted font-medium" : "text-muted-foreground hover:bg-muted/60",
            )}
          >
            {t.label}
          </button>
        ))}
      </nav>
      <div className="melo-scroll min-w-0 flex-1 overflow-y-auto p-4 sm:p-6">
        {tab === "workspace" && <WorkspacePane />}
        {tab === "train" && <TrainPane />}
        {tab === "playbooks" && <PlaybooksPane />}
        {tab === "numbers" && <NumbersPane />}
        {tab === "billing" && <BillingPane />}
        {tab === "brand" && <BrandPane />}
        {tab === "templates" && <TemplatesPane />}
        {tab === "team" && <TeamPane />}
        {tab === "voice" && <VoicePane />}
      </div>
    </div>
  );
}

function TrainPane() {
  const training = useMelo((s) => s.training);
  const seed = { website: "", description: "", tools: "", runs: [] as typeof training.runs };
  const t = training ?? seed;
  const setDraft = useMelo((s) => s.setTrainingDraft);
  const train = useMelo((s) => s.trainMelo);
  const knowledge = useMelo((s) => s.knowledge);
  const navigate = useNavigate();
  const [website, setWebsite] = useState(t.website);
  const [description, setDescription] = useState(t.description);
  const [tools, setTools] = useState(t.tools);
  const [phase, setPhase] = useState<"idle" | "study" | "done">("idle");
  const [step, setStep] = useState(0);
  const STEPS = ["Reading the website", "Studying the work you do", "Matching the tools you already use", "Writing into Knowledge"];

  useEffect(() => {
    if (phase !== "study") return;
    if (step >= STEPS.length) {
      train({ website, description, tools });
      const k = useMelo.getState().knowledge;
      void persistOfficeCopy({
        data: {
          about: description,
          website,
          hours: k.hours,
          afterHours: k.afterHours,
          services: k.services.map((s) => s.name),
          suburbs: k.areas,
        },
      }).catch(() => undefined);
      setPhase("done");
      return;
    }
    const id = window.setTimeout(() => setStep((n) => n + 1), 420);
    return () => window.clearTimeout(id);
  }, [phase, step]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggleTool(name: string) {
    const parts = tools.split(/[,/\n]+/).map((x) => x.trim()).filter(Boolean);
    const has = parts.some((p) => p.toLowerCase() === name.toLowerCase());
    const next = has ? parts.filter((p) => p.toLowerCase() !== name.toLowerCase()) : [...parts, name];
    const joined = next.join(", ");
    setTools(joined);
    setDraft({ tools: joined });
  }

  const last = t.runs[0];
  const busy = phase === "study";

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Train Melo</h1>
        <p className="mt-1 text-sm text-muted-foreground text-pretty">
          Paste the website, describe the work, and name the tools you already use. Melo studies them into Knowledge — Receptionist, Ask Melo and the widget all read the same brain.
        </p>
      </div>

      <Field label="Business website">
        <Input
          placeholder="https://northsideplumbing.com.au"
          value={website}
          onChange={(e) => {
            setWebsite(e.target.value);
            setDraft({ website: e.target.value });
          }}
        />
        <p className="mt-1 text-xs text-muted-foreground">We’ll read the domain as a source and use it when customers ask where to look.</p>
      </Field>

      <Field label="What work do you do?">
        <Textarea
          className="min-h-36"
          placeholder="Licensed plumbing across the Inner West. Blocked drains, leaks, hot water, gas. After hours for emergencies. Newtown, Marrickville, Burwood…"
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            setDraft({ description: e.target.value });
          }}
        />
        <p className="mt-1 text-xs text-muted-foreground">Services, suburbs, hours and prices — write it the way you’d brief a new receptionist.</p>
      </Field>

      <div>
        <div className="mb-1 text-sm font-medium">Tools you already use</div>
        <div className="mb-2 flex flex-wrap gap-1.5">
          {SUGGESTED_TOOLS.map((name) => {
            const on = tools.toLowerCase().includes(name.toLowerCase());
            return (
              <button
                key={name}
                type="button"
                onClick={() => toggleTool(name)}
                className={cn(
                  "h-8 rounded-full border px-3 text-xs font-medium",
                  on ? "border-primary bg-accent text-foreground" : "border-border bg-canvas text-muted-foreground hover:bg-muted",
                )}
              >
                {name}
              </button>
            );
          })}
        </div>
        <Input
          placeholder="Xero, Stripe, ServiceM8 — or anything else"
          value={tools}
          onChange={(e) => {
            setTools(e.target.value);
            setDraft({ tools: e.target.value });
          }}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          disabled={busy || (!website.trim() && !description.trim() && !tools.trim())}
          onClick={() => {
            setPhase("study");
            setStep(0);
          }}
        >
          {busy ? "Studying…" : "Train Melo"}
        </Button>
        <Button variant="outline" onClick={() => void navigate({ to: "/app/knowledge" })}>
          Open Knowledge
        </Button>
      </div>

      {busy ? (
        <ul className="rounded-2xl border border-border bg-canvas p-4 text-sm">
          {STEPS.map((label, i) => (
            <li key={label} className="flex items-center gap-2 py-1.5">
              <span className={cn("size-1.5 rounded-full", i < step ? "bg-success" : i === step ? "bg-primary live-dot" : "bg-border")} />
              <span className={i <= step ? "text-foreground" : "text-muted-foreground"}>{label}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {phase === "done" || last ? (
        <section className="rounded-2xl border border-border bg-canvas p-4">
          <div className="text-sm font-semibold">{phase === "done" ? "What Melo learned" : "Last training"}</div>
          {last ? (
            <p className="mt-1 text-sm text-muted-foreground">
              {dt(last.at, "d MMM, h:mm a")}
              {last.website ? ` · ${last.website.replace(/^https?:\/\//, "")}` : ""} · {last.services.length} services · {last.areas.length} areas · {last.toolsMatched.length} tools · {last.faqsAdded} FAQs
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {knowledge.services.filter((s) => s.active).map((s) => (
              <span key={s.id} className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                {s.name}
              </span>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {knowledge.areas.slice(0, 10).map((a) => (
              <span key={a} className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
                {a}
              </span>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Receptionist, Ask Melo and the widget now cite this. Retrain anytime — we merge, we don’t wipe the book.</p>
        </section>
      ) : null}

      {t.runs.length > 1 ? (
        <section>
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Earlier runs</div>
          <ul className="mt-2 space-y-2">
            {t.runs.slice(1).map((r) => (
              <li key={r.id} className="text-sm text-muted-foreground">
                {dt(r.at, "d MMM, h:mm a")} · {r.services.slice(0, 3).join(", ") || "briefing"}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function WorkspacePane() {
  const ws = useMelo((s) => s.workspace);
  const update = useMelo((s) => s.updateWorkspace);
  const setIndustry = useMelo((s) => s.setIndustry);
  const reset = useMelo((s) => s.resetDemo);
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Workspace</h1>
        <p className="mt-1 text-sm text-muted-foreground">Industry changes jobs / appointments / reservations language across the office.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name">
          <Input value={ws.name} onChange={(e) => update({ name: e.target.value })} />
        </Field>
        <Field label="Industry">
          <Select value={ws.industry} onValueChange={(v) => setIndustry(v as Industry)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INDUSTRY_OPTIONS.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Owner">
          <Input value={ws.ownerName} onChange={(e) => update({ ownerName: e.target.value })} />
        </Field>
        <Field label="Owner email">
          <Input value={ws.ownerEmail} onChange={(e) => update({ ownerEmail: e.target.value })} />
        </Field>
        <Field label="Timezone">
          <Input value={ws.timezone} readOnly />
        </Field>
        <Field label="ABN">
          <Input value={ws.abn} onChange={(e) => update({ abn: e.target.value })} />
        </Field>
        <Field label="Address" className="sm:col-span-2">
          <Input value={ws.address} onChange={(e) => update({ address: e.target.value })} />
        </Field>
      </div>
      <Separator />
      <Button variant="outline" onClick={reset}>
        Reset demo data
      </Button>
    </div>
  );
}

function PlaybooksPane() {
  const automations = useMelo((s) => s.automations);
  const toggle = useMelo((s) => s.toggleAutomation);
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Playbooks</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          What Melo does without you — after hours, missed calls, the website, unsigned quotes.
        </p>
      </div>
      <ul className="space-y-2">
        {automations.map((a) => (
          <li key={a.id} className="flex items-center justify-between gap-4 rounded-xl border border-border bg-canvas px-4 py-3">
            <div>
              <div className="text-sm font-medium">{a.name}</div>
              <p className="text-xs text-muted-foreground">
                {a.trigger} → {a.action}
              </p>
            </div>
            <Switch checked={a.on} onCheckedChange={() => toggle(a.id)} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function NumbersPane() {
  const number = useMelo((s) => s.workspace.number);
  const sync = useMelo((s) => s.syncChannelStatus);
  const update = useMelo((s) => s.updateWorkspace);
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = () => {
    void listChannelAccounts()
      .then((acc) => {
        sync(acc.channels);
        const voice = acc.channels.find((c) => c.kind === "voice");
        if (voice?.externalId) update({ number: voice.externalId });
        setDetail(voice?.detail ?? "");
      })
      .catch(() => undefined);
  };

  useEffect(() => {
    refresh();
  }, []);

  const connected = /live|connected/i.test(detail) || detail.includes("receptionist");

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-xl font-semibold">Numbers</h1>
      <div className="rounded-xl border border-border bg-canvas p-4">
        <div className="text-sm text-muted-foreground">Primary · hosted by Melo</div>
        <div className="mt-1 text-lg font-semibold tabular">{number || "No number yet"}</div>
        <div className={cn("mt-2 text-sm", connected ? "text-success" : "text-muted-foreground")}>
          {detail || "Melo buys an Australian number and points it at your receptionist. You don’t need Twilio."}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Included in your plan. Melo pays the carrier. Warm-transfer to your mobile when they ask for you.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => setOpen(true)}>
            {connected ? "Replace number" : "Get a Melo number"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => {
              setBusy(true);
              void testTwilioCall()
                .then(() => toast.success("Test call ringing your mobile"))
                .catch((e: Error) => toast.error(e.message))
                .finally(() => setBusy(false));
            }}
          >
            Test call
          </Button>
        </div>
      </div>
      <ChannelConnectDialog kind="twilio" open={open} onClose={() => setOpen(false)} onDone={refresh} />
    </div>
  );
}

function BrandPane() {
  const ws = useMelo((s) => s.workspace);
  const update = useMelo((s) => s.updateWorkspace);
  const setWidget = useMelo((s) => s.setWidgetOpen);
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-xl font-semibold">Brand</h1>
      <Field label="Public name">
        <Input value={ws.brandName} onChange={(e) => update({ brandName: e.target.value })} />
      </Field>
      <Field label="Widget greeting">
        <Textarea value={ws.widgetGreeting} onChange={(e) => update({ widgetGreeting: e.target.value })} />
      </Field>
      <Button onClick={() => setWidget(true)}>Preview widget</Button>
    </div>
  );
}

const KIND_LABEL: Record<InvoiceTemplateKind, string> = {
  invoice: "Invoice",
  deposit: "Deposit",
  reminder: "Reminder",
  overdue: "Overdue",
};

function TemplatesPane() {
  const templates = useMelo((s) => s.invoiceTemplates);
  const update = useMelo((s) => s.updateInvoiceTemplate);
  const add = useMelo((s) => s.addInvoiceTemplate);
  const [id, setId] = useState(templates[0]?.id ?? "");
  const tpl = templates.find((t) => t.id === id) ?? templates[0];

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Invoice templates</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Used when you send a tax invoice to a client. Tokens fill from the job at send time.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={add}>
          New template
        </Button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {templates.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setId(t.id)}
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-medium",
              t.id === tpl?.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
            )}
          >
            {t.name} · {t.channel === "email" ? "Email" : "SMS"}
          </button>
        ))}
      </div>
      {tpl ? (
        <div className="space-y-3 rounded-2xl border border-border bg-canvas p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Name">
              <Input value={tpl.name} onChange={(e) => update(tpl.id, { name: e.target.value })} />
            </Field>
            <Field label="Kind">
              <Select value={tpl.kind} onValueChange={(v) => update(tpl.id, { kind: v as InvoiceTemplateKind })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(KIND_LABEL) as InvoiceTemplateKind[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {KIND_LABEL[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Channel">
              <Select value={tpl.channel} onValueChange={(v) => update(tpl.id, { channel: v as "email" | "sms" })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS / WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            {tpl.channel === "email" ? (
              <Field label="Subject" className="sm:col-span-2">
                <Input value={tpl.subject} onChange={(e) => update(tpl.id, { subject: e.target.value })} />
              </Field>
            ) : null}
          </div>
          <Field label="Body">
            <Textarea value={tpl.body} onChange={(e) => update(tpl.id, { body: e.target.value })} className="min-h-48" />
          </Field>
          <div>
            <div className="mb-1.5 text-xs font-medium text-muted-foreground">Tokens</div>
            <div className="flex flex-wrap gap-1">
              {TEMPLATE_TOKENS.map((tok) => (
                <span key={tok} className="rounded-full bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                  {`{{${tok}}}`}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TeamPane() {
  const staff = useMelo((s) => s.staff);
  return (
    <div className="mx-auto max-w-xl space-y-3">
      <div className="flex items-end justify-between">
        <h1 className="text-xl font-semibold">Team</h1>
        <Button size="sm" variant="outline" onClick={() => toast.message("Invite link copied — simulated")}>
          Invite
        </Button>
      </div>
      {staff.map((s) => (
        <div key={s.id} className="flex items-center justify-between rounded-xl border border-border bg-canvas p-4">
          <div>
            <div className="font-medium">{s.name}</div>
            <div className="text-sm text-muted-foreground">
              {s.role} · {s.email}
            </div>
          </div>
          <div className="text-xs text-muted-foreground">{s.phone}</div>
        </div>
      ))}
    </div>
  );
}

function VoicePane() {
  const voice = useMelo((s) => s.voice);
  const update = useMelo((s) => s.updateVoice);
  const [playing, setPlaying] = useState(false);

  const play = () => {
    setPlaying(true);
    void (async () => {
      try {
        const res = await fetch("/api/voice/sample", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            text: voice.greeting,
            voice: voice.voice,
          }),
        });
        if (!res.ok) throw new Error("sample failed");
        const blob = await res.blob();
        const a = new Audio(URL.createObjectURL(blob));
        a.onended = () => setPlaying(false);
        await a.play();
      } catch {
        const fallback = new Audio("/sample-isla.mp3");
        fallback.onended = () => setPlaying(false);
        void fallback.play();
      }
    })();
  };

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-xl font-semibold">Receptionist voice</h1>
      <p className="text-sm text-muted-foreground">
        Melo hosts the voice. Isla is the Australian receptionist. Included in every plan — you don’t need ElevenLabs.
      </p>
      <p className="rounded-lg border border-border bg-muted px-3 py-2 text-sm">Hosted by Melo · ElevenLabs on our account</p>
      <Field label="Locale">
        <Input value={voice.locale} readOnly />
      </Field>
      <Field label="Voice">
        <Select value={voice.voice} onValueChange={(v) => update({ voice: v })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Isla">Isla · Emma, Australian</SelectItem>
            <SelectItem value="Matilda">Matilda · Sarah</SelectItem>
            <SelectItem value="Jack">Jack · Charlie, Australian</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <Field label={`Warmth ${voice.warmth}`}>
        <Slider value={[voice.warmth]} onValueChange={(v) => update({ warmth: v[0] ?? 50 })} max={100} />
      </Field>
      <Field label={`Pace ${voice.pace}`}>
        <Slider value={[voice.pace]} onValueChange={(v) => update({ pace: v[0] ?? 50 })} max={100} />
      </Field>
      <Field label="Greeting">
        <Textarea value={voice.greeting} onChange={(e) => update({ greeting: e.target.value })} />
      </Field>
      <label className="flex items-center justify-between text-sm">
        Interruption / barge-in
        <Switch checked={voice.bargeIn} onCheckedChange={(c) => update({ bargeIn: c })} />
      </label>
      <Field label="Transfer rules">
        <Textarea value={voice.transferRules} onChange={(e) => update({ transferRules: e.target.value })} />
      </Field>
      <Field label="After hours">
        <Textarea value={voice.afterHours} onChange={(e) => update({ afterHours: e.target.value })} />
      </Field>
      <div className="flex gap-2">
        <Button size="sm" onClick={play}>
          {playing ? "Playing…" : "Play sample"}
        </Button>
      </div>
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}
