import { useEffect, useState } from "react";
import { Pause, Play, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ComputerDesk } from "@/features/computer-desk";
import { getComputer, runComputerNow, updateComputer } from "@/lib/computer/actions";
import type { ComputerSkill } from "@/lib/computer/skill-types";
import { cn } from "@/lib/utils";

type Snapshot = Awaited<ReturnType<typeof getComputer>>;

function connectParams() {
  if (typeof window === "undefined") return { app: "", open: "" };
  const q = new URLSearchParams(window.location.search);
  return { app: q.get("connect") || "", open: q.get("open") || "" };
}

export function ComputerPage() {
  const [data, setData] = useState<Snapshot | null>(null);
  const [busy, setBusy] = useState(false);
  const [skills, setSkills] = useState<ComputerSkill[]>([]);
  const [link, setLink] = useState(connectParams);

  const refresh = async () => {
    const next = await getComputer();
    setData(next);
    setSkills(next.skills ?? []);
  };

  useEffect(() => {
    void refresh().catch(() => undefined);
    const t = setInterval(() => void refresh().catch(() => undefined), 12000);
    return () => clearInterval(t);
  }, []);

  const computer = data?.computer;
  const online = computer?.status === "online";

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">Melo Computer</h1>
            {computer ? (
              <Badge tone={online ? "success" : "warning"}>{online ? "Online" : "Paused"}</Badge>
            ) : null}
          </div>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {link.app
              ? "Sign in on this machine. The session stays with this office."
              : "Melo’s machine — a real browser that stays logged in. Teach a task once. It runs here even when this tab is closed."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => {
              setBusy(true);
              void runComputerNow()
                .then((r) => {
                  setData({ computer: r.computer, log: r.log, skills: r.skills });
                  setSkills(r.skills ?? []);
                })
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

      <ComputerDesk
        skills={skills}
        onSkills={setSkills}
        initialUrl={link.open || undefined}
        connectApp={link.app || undefined}
        onConnected={() => setLink({ app: "", open: "" })}
      />
    </div>
  );
}
