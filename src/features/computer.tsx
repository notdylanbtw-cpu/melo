import { useEffect, useState } from "react";
import { Cpu, Pause, Play, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { getComputer, runComputerNow, updateComputer } from "@/lib/computer/actions";
import { relative } from "@/lib/format";
import { cn } from "@/lib/utils";

type Snapshot = Awaited<ReturnType<typeof getComputer>>;

export function ComputerPage() {
  const [data, setData] = useState<Snapshot | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    const next = await getComputer();
    setData(next);
  };

  useEffect(() => {
    void refresh().catch(() => undefined);
    const t = setInterval(() => void refresh().catch(() => undefined), 8000);
    return () => clearInterval(t);
  }, []);

  const computer = data?.computer;
  const online = computer?.status === "online";

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">Melo Computer</h1>
            {computer ? (
              <Badge tone={online ? "success" : "warning"}>{online ? "Online" : "Paused"}</Badge>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            This office’s machine. It answers the phone, watches the inbox and chases quotes even when this tab is closed.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => {
              setBusy(true);
              void runComputerNow()
                .then((r) => setData({ computer: r.computer, log: r.log }))
                .finally(() => setBusy(false));
            }}
          >
            <RefreshCw className={cn("size-4", busy && "animate-spin")} />
            Run now
          </Button>
          <Button
            variant={online ? "outline" : "default"}
            disabled={!computer}
            onClick={() => {
              const next = online ? "paused" : "online";
              void updateComputer({ data: { status: next } }).then((r) => {
                if (!data) return;
                setData({ ...data, computer: r.computer });
              });
            }}
          >
            {online ? <Pause className="size-4" /> : <Play className="size-4" />}
            {online ? "Pause" : "Resume"}
          </Button>
        </div>
      </div>

      <section className="rounded-2xl border border-border bg-canvas p-5">
        <div className="flex items-start gap-4">
          <div className={cn("grid size-12 place-items-center rounded-xl", online ? "bg-success-soft text-success" : "bg-muted text-muted-foreground")}>
            <Cpu className="size-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{computer?.region ?? "ap-sydney-1"}</span>
              {online ? <span className="size-1.5 rounded-full bg-success live-dot" /> : null}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{computer?.currentTask ?? "Booting…"}</p>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <Stat label="Uptime" value={computer ? uptime(computer.startedAt) : "—"} />
              <Stat label="Jobs done" value={computer ? String(computer.jobsDone) : "—"} />
              <Stat label="Last tick" value={computer?.lastTickAt ? relative(computer.lastTickAt) : "—"} />
              <Stat label="Shift" value={computer?.mode === "hours" ? "Business hours" : "Always on"} />
            </dl>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-canvas p-5">
        <h2 className="text-sm font-semibold">How it runs</h2>
        <ul className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          <li className="rounded-xl border border-border p-3">
            <div className="font-medium">Phone, 24/7</div>
            <p className="mt-1 text-muted-foreground">Your Melo number hits this computer directly. The receptionist answers whether you’re in the app or not.</p>
          </li>
          <li className="rounded-xl border border-border p-3">
            <div className="font-medium">Inbox watch</div>
            <p className="mt-1 text-muted-foreground">Widget, SMS, WhatsApp and voice messages are filed into the office and land in Review.</p>
          </li>
          <li className="rounded-xl border border-border p-3">
            <div className="font-medium">Quote chase</div>
            <p className="mt-1 text-muted-foreground">If a client hasn’t signed after four hours, Ledger logs a follow-up.</p>
          </li>
          <li className="rounded-xl border border-border p-3">
            <div className="font-medium">Isolated</div>
            <p className="mt-1 text-muted-foreground">This machine is only this office. Another account never sees these jobs or numbers.</p>
          </li>
        </ul>
        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center justify-between gap-3 text-sm sm:justify-start">
            <span>Always on — including nights and weekends</span>
            <Switch
              checked={computer?.mode !== "hours"}
              onCheckedChange={(on) => {
                void updateComputer({ data: { mode: on ? "always" : "hours" } }).then((r) => {
                  if (!data) return;
                  setData({ ...data, computer: r.computer });
                });
              }}
            />
          </label>
          <label className="flex items-center justify-between gap-3 text-sm sm:justify-start">
            <span>Take after-hours messages</span>
            <Switch
              checked={computer?.actAfterHours !== false}
              onCheckedChange={(on) => {
                void updateComputer({ data: { actAfterHours: on } }).then((r) => {
                  if (!data) return;
                  setData({ ...data, computer: r.computer });
                });
              }}
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-canvas">
        <div className="border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold">Machine log</h2>
        </div>
        <ol className="divide-y divide-border">
          {(data?.log ?? []).length === 0 ? (
            <li className="px-5 py-8 text-sm text-muted-foreground">The computer will write here as it works. Phone, widget and follow-ups show up even when you’re offline.</li>
          ) : (
            data!.log.map((row) => (
              <li key={row.id} className="flex gap-3 px-5 py-3">
                <div className="w-16 shrink-0 pt-0.5 text-xs tabular text-muted-foreground">{clock(row.at)}</div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm">{row.text}</div>
                  <div className="mt-0.5 text-xs capitalize text-muted-foreground">
                    {row.agent} · {row.kind}
                  </div>
                </div>
              </li>
            ))
          )}
        </ol>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium tabular">{value}</dd>
    </div>
  );
}

function uptime(startedAt: string) {
  const ms = Date.now() - new Date(startedAt).getTime();
  const h = Math.floor(ms / 36e5);
  const m = Math.floor((ms % 36e5) / 6e4);
  if (h > 48) return `${Math.floor(h / 24)}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${Math.max(1, m)}m`;
}

function clock(iso: string) {
  try {
    return new Intl.DateTimeFormat("en-AU", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Australia/Sydney" }).format(new Date(iso));
  } catch {
    return "";
  }
}
