import { useCallback, useEffect, useRef, useState } from "react";
import { Home, Loader2, Lock, MonitorPlay, Plus, Square } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input, Textarea } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  removeComputerSkill,
  runComputerSkill,
  saveComputerSkill,
  setComputerSkillStatus,
} from "@/lib/computer/actions";
import { confirmConnect } from "@/lib/channels/actions";
import {
  bootMeloDrive,
  driveClick,
  driveClearHold,
  driveGoto,
  driveHome,
  driveKey,
  drivePlay,
  driveStartTeach,
  driveStopTeach,
  driveType,
  getMeloFrame,
} from "@/lib/computer/drive";
import type { ComputerSkill, DriveStatus } from "@/lib/computer/skill-types";
import { relative } from "@/lib/format";
import { useMelo } from "@/lib/melo/store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const TEACH_MAX_MS = 10 * 60 * 1000;

const STARTERS = [
  {
    name: "Jobber job from a signed quote",
    goal: "When a quote is signed in Melo, open Jobber and create the job with the same client, suburb and scope.",
  },
  {
    name: "Morning Gmail sweep",
    goal: "Open Gmail, take unread customer mail, and file each thread into Melo Inbox.",
  },
  {
    name: "Mark Xero invoice paid",
    goal: "Open the matching invoice in Xero and mark it paid when Melo records a payment.",
  },
];

export function ComputerDesk({
  skills,
  onSkills,
  initialUrl,
  connectApp,
  onConnected,
}: {
  skills: ComputerSkill[];
  onSkills: (next: ComputerSkill[]) => void;
  initialUrl?: string;
  connectApp?: string;
  onConnected?: () => void;
}) {
  const ws = useMelo((s) => s.workspace);
  const site = useMelo((s) => s.training?.website || "");
  const meta = { brand: ws.name, site };

  const [status, setStatus] = useState<DriveStatus | null>(null);
  const [jpeg, setJpeg] = useState<string | null>(null);
  const [bar, setBar] = useState("");
  const [teachOpen, setTeachOpen] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftGoal, setDraftGoal] = useState("");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [control, setControl] = useState(true);
  const [busy, setBusy] = useState(false);
  const [typeBuf, setTypeBuf] = useState("");
  const imgRef = useRef<HTMLImageElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);

  const teaching = Boolean(status?.teaching);
  const recording = teaching && startedAt !== null;

  const refreshFrame = useCallback(async () => {
    try {
      const r = await getMeloFrame();
      setJpeg(r.jpeg);
      setStatus(r.status);
      if (r.status.url && !r.status.url.startsWith("data:")) {
        try {
          setBar(r.status.url.startsWith("http") ? r.status.url.replace(/^https?:\/\//, "") : r.status.url);
        } catch {
          /* */
        }
      }
    } catch {
      /* boot may still be coming up */
    }
  }, []);

  useEffect(() => {
    void bootMeloDrive({ data: meta })
      .then((st) => {
        setStatus(st);
        if (st.error) toast.message("Computer needs a host with Chrome — retrying.");
      })
      .then(() => refreshFrame())
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!initialUrl) return;
    const t = window.setTimeout(() => {
      void driveGoto({ data: { url: initialUrl } }).then((st) => {
        setStatus(st);
        void refreshFrame();
      });
    }, 600);
    return () => window.clearTimeout(t);
  }, [initialUrl]);

  useEffect(() => {
    const t = setInterval(() => {
      if (document.hidden) return;
      void refreshFrame();
    }, 450);
    return () => clearInterval(t);
  }, [refreshFrame]);

  useEffect(() => {
    if (!recording || !startedAt) return;
    const t = setInterval(() => {
      const ms = Date.now() - startedAt;
      setElapsed(ms);
      if (ms >= TEACH_MAX_MS) void endTeach(true);
    }, 250);
    return () => clearInterval(t);
  }, [recording, startedAt]);

  const beginTeach = async () => {
    setTeachOpen(false);
    await driveStartTeach();
    setStartedAt(Date.now());
    setElapsed(0);
    setControl(true);
    toast.message("Melo is on this machine. Click the screen. Ten minutes. Don’t type passwords — use Secret.");
    void refreshFrame();
  };

  const endTeach = async (timedOut = false) => {
    await driveStopTeach();
    setStartedAt(null);
    if (timedOut) toast.message("Ten minutes — recording stopped.");
    void refreshFrame();
  };

  const saveTeach = async () => {
    const steps = status?.steps ?? [];
    if (!steps.length) {
      toast.message("Do the task on the screen first.");
      return;
    }
    const name = draftName.trim() || "Untitled task";
    const res = await saveComputerSkill({
      data: {
        name,
        goal: draftGoal.trim(),
        status: "draft",
        steps,
      },
    });
    onSkills(res.skills);
    await endTeach();
    toast.success(`Draft saved — ${name}. Run it once before you turn it on.`);
  };

  const onScreenClick = async (e: React.MouseEvent<HTMLImageElement>) => {
    if (!control && !teaching) return;
    const img = imgRef.current;
    if (!img) return;
    const map = mapClick(e, img);
    if (!map) return;
    setBusy(true);
    try {
      const st = await driveClick({ data: map });
      setStatus(st);
    } finally {
      setBusy(false);
      void refreshFrame();
    }
  };

  useEffect(() => {
    const el = screenRef.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (!control && !teaching) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      e.preventDefault();
      const key = e.key === " " ? "Space" : e.key.length === 1 ? e.key : e.key;
      void driveKey({ data: { key: e.key } }).then((st) => {
        setStatus(st);
        void refreshFrame();
      });
      void key;
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [control, teaching, refreshFrame]);

  const playSkill = async (skill: ComputerSkill) => {
    const res = await runComputerSkill({ data: { id: skill.id } });
    if (!res.ok || !res.skill) return;
    onSkills(res.skills);
    toast.message(`Running “${skill.name}” on this computer`);
    const st = await drivePlay({ data: { steps: res.skill.steps, ...meta } });
    setStatus(st);
    void refreshFrame();
    if (st.hold) toast.message("Take over for this step, then continue.");
    else toast.success(`Finished “${skill.name}”`);
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
      {connectApp ? (
        <div className="xl:col-span-2 flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-canvas px-4 py-3">
          <MonitorPlay className="size-4 text-primary" />
          <p className="min-w-0 flex-1 text-sm">
            Sign into <span className="font-medium">{connectApp}</span> on this computer. Melo keeps the session. Don’t paste passwords into chat — type them on the screen.
          </p>
          <Button
            size="sm"
            onClick={() => {
              void confirmConnect({ data: { appId: connectApp, detail: `Signed in on Melo Computer` } }).then(() => {
                useMelo.getState().connectApp(connectApp, "Signed in on Melo Computer");
                toast.success(`${connectApp} connected`);
                onConnected?.();
                window.history.replaceState({}, "", "/app/computer");
              });
            }}
          >
            Signed in — connect
          </Button>
        </div>
      ) : null}
      <div className="overflow-hidden rounded-2xl border border-border bg-ink text-primary-foreground">
        <div className="flex flex-wrap items-center gap-2 border-b border-white/10 px-3 py-2">
          <div className="flex gap-1.5 px-1">
            <span className="size-2.5 rounded-full bg-white/25" />
            <span className="size-2.5 rounded-full bg-white/25" />
            <span className="size-2.5 rounded-full bg-white/25" />
          </div>
          <form
            className="flex min-w-0 flex-1 items-center gap-2 rounded-lg bg-white/8 px-3 py-1.5"
            onSubmit={(e) => {
              e.preventDefault();
              if (!bar.trim()) return;
              void driveGoto({ data: { url: bar.trim() } }).then((st) => {
                setStatus(st);
                void refreshFrame();
              });
            }}
          >
            <Lock className="size-3 shrink-0 opacity-50" />
            <input
              value={bar}
              onChange={(e) => setBar(e.target.value)}
              placeholder="Open a site on this computer"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-white/35"
            />
          </form>
          <Button
            size="sm"
            variant="outline"
            className="border-white/15 bg-transparent text-primary-foreground hover:bg-white/10"
            onClick={() => void driveHome({ data: meta }).then((st) => { setStatus(st); void refreshFrame(); })}
          >
            <Home className="size-3.5" />
            Desk
          </Button>
          <div className="flex flex-wrap gap-1.5">
            <Button size="sm" onClick={() => setTeachOpen(true)}>
              Teach a task
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-white/15 bg-transparent text-primary-foreground hover:bg-white/10"
              onClick={() => {
                setControl((v) => !v);
                screenRef.current?.focus();
              }}
            >
              {control ? "You’re driving" : "Take control"}
            </Button>
          </div>
        </div>

        {recording ? (
          <div className="flex flex-wrap items-center gap-2 border-b border-white/10 bg-white/5 px-3 py-2">
            <span className="size-2 rounded-full bg-destructive" />
            <span className="text-xs font-medium">Watching this computer · {clock(elapsed)} / 10:00</span>
            <span className="text-xs text-white/50">Clicks and keys are real. No mic. Secrets stay off the recording.</span>
            <div className="ml-auto flex flex-wrap gap-1.5">
              <Button size="sm" onClick={() => void saveTeach()}>
                Save draft
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-white/15 bg-transparent text-primary-foreground hover:bg-white/10"
                onClick={() => void endTeach()}
              >
                <Square className="size-3.5" />
                Discard
              </Button>
            </div>
          </div>
        ) : null}

        <div
          ref={screenRef}
          tabIndex={0}
          className="relative min-h-[420px] bg-ink outline-none"
          onMouseDown={() => screenRef.current?.focus()}
        >
          {jpeg ? (
            <img
              ref={imgRef}
              alt={status?.title || "Melo Computer"}
              src={`data:image/jpeg;base64,${jpeg}`}
              className={cn("mx-auto h-[420px] w-full object-contain", (control || teaching) && "cursor-crosshair")}
              onClick={(e) => void onScreenClick(e)}
              draggable={false}
            />
          ) : (
            <div className="grid h-[420px] place-items-center text-sm text-white/50">
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                Booting the machine…
              </span>
            </div>
          )}
          {busy ? <div className="pointer-events-none absolute inset-0 bg-black/10" /> : null}
          {status?.hold ? (
            <div className="absolute inset-x-4 bottom-4 rounded-xl border border-white/15 bg-ink/90 p-3">
              <p className="text-sm">{status.hold}</p>
              <Button
                className="mt-2"
                size="sm"
                onClick={() => void driveClearHold().then((st) => { setStatus(st); void refreshFrame(); })}
              >
                Continue
              </Button>
            </div>
          ) : null}
        </div>

        {(control || teaching) && (
          <form
            className="flex gap-2 border-t border-white/10 p-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!typeBuf.trim()) return;
              void driveType({ data: { text: typeBuf, secret: false } }).then((st) => {
                setStatus(st);
                setTypeBuf("");
                void refreshFrame();
              });
            }}
          >
            <Input
              value={typeBuf}
              onChange={(e) => setTypeBuf(e.target.value)}
              placeholder="Type into the page — click a field on the screen first"
              className="border-white/15 bg-white/8 text-primary-foreground placeholder:text-white/35"
            />
            <Button type="submit" size="sm" variant="outline" className="border-white/15 bg-transparent text-primary-foreground hover:bg-white/10">
              Type
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-white/15 bg-transparent text-primary-foreground hover:bg-white/10"
              onClick={() => {
                void driveType({ data: { text: "secret", secret: true } }).then((st) => {
                  setStatus(st);
                  void refreshFrame();
                });
              }}
            >
              Secret
            </Button>
          </form>
        )}
      </div>

      <aside className="space-y-4">
        {recording ? (
          <section className="rounded-2xl border border-border bg-canvas p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Steps Melo is learning</div>
            {(status?.steps ?? []).length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Click the screen. Open Gmail, Jobber, Xero — this is a real browser.</p>
            ) : (
              <ol className="mt-2 space-y-1.5">
                {(status?.steps ?? []).map((s, i) => (
                  <li key={s.id} className="text-sm">
                    {i + 1}. {s.label}
                  </li>
                ))}
              </ol>
            )}
          </section>
        ) : null}

        <section className="rounded-2xl border border-border bg-canvas">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold">Taught tasks</h2>
            <Button size="sm" variant="outline" onClick={() => setTeachOpen(true)}>
              <Plus className="size-3.5" />
              Teach
            </Button>
          </div>
          {skills.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">
              Show Melo a job on this computer once. Cookies stay on the machine. It can run when you’re closed.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {skills.map((sk) => (
                <li key={sk.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium">{sk.name}</span>
                        <Badge tone={sk.status === "ready" ? "success" : "default"}>{sk.status}</Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {sk.steps.length} steps
                        {sk.lastRunAt ? ` · last ${relative(sk.lastRunAt)}` : ""}
                      </p>
                    </div>
                    <Button size="sm" disabled={sk.steps.length === 0} onClick={() => void playSkill(sk)}>
                      Run
                    </Button>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Switch
                        checked={sk.status === "ready"}
                        onCheckedChange={(on) => {
                          void setComputerSkillStatus({ data: { id: sk.id, status: on ? "ready" : "draft" } }).then((r) => onSkills(r.skills));
                        }}
                      />
                      On
                    </label>
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Switch
                        checked={sk.schedule === "daily"}
                        onCheckedChange={(on) => {
                          void saveComputerSkill({
                            data: {
                              id: sk.id,
                              name: sk.name,
                              goal: sk.goal,
                              status: sk.status,
                              steps: sk.steps,
                              approvals: sk.approvals,
                              schedule: on ? "daily" : "manual",
                            },
                          }).then((r) => onSkills(r.skills));
                        }}
                      />
                      Daily
                    </label>
                    <button
                      type="button"
                      className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                      onClick={() => void removeComputerSkill({ data: { id: sk.id } }).then((r) => onSkills(r.skills))}
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </aside>

      <Dialog open={teachOpen} onOpenChange={setTeachOpen}>
        <DialogContent className="max-w-lg">
          <DialogTitle>Teach a task</DialogTitle>
          <DialogDescription>
            Melo watches this computer — a real browser on its machine, not yours. Click the screen. Cookies stay logged in for next time.
          </DialogDescription>
          <div className="mt-4 space-y-3">
            <Input value={draftName} onChange={(e) => setDraftName(e.target.value)} placeholder="Name — e.g. Create the Jobber job" />
            <Textarea value={draftGoal} onChange={(e) => setDraftGoal(e.target.value)} placeholder="When you’re done, what should have happened?" rows={3} />
            <div className="flex flex-wrap gap-2">
              {STARTERS.map((s) => (
                <button
                  key={s.name}
                  type="button"
                  className="rounded-full border border-border px-3 py-1 text-xs hover:bg-muted"
                  onClick={() => {
                    setDraftName(s.name);
                    setDraftGoal(s.goal);
                  }}
                >
                  {s.name}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Keep passwords off the demonstration. Use Secret — Melo stops at run time and you take over.
            </p>
            <Button className="w-full" onClick={() => void beginTeach()}>
              <MonitorPlay className="size-4" />
              Start on Melo’s computer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function mapClick(e: React.MouseEvent<HTMLImageElement>, img: HTMLImageElement) {
  const r = img.getBoundingClientRect();
  const natW = 1280;
  const natH = 800;
  const scale = Math.min(r.width / natW, r.height / natH);
  const dw = natW * scale;
  const dh = natH * scale;
  const ox = r.left + (r.width - dw) / 2;
  const oy = r.top + (r.height - dh) / 2;
  const x = e.clientX - ox;
  const y = e.clientY - oy;
  if (x < 0 || y < 0 || x > dw || y > dh) return null;
  return { x, y, w: dw, h: dh };
}

function clock(ms: number) {
  const s = Math.min(600, Math.floor(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
