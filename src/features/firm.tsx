import { useState } from "react";
import { Plus } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { AgentPortrait } from "@/components/melo/portrait";
import { submitAsk } from "@/components/melo/ask";
import { AUTOPILOT_LABEL, StatusDot } from "@/components/melo/status";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/misc";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { Autopilot } from "@/lib/melo/types";
import { useMelo } from "@/lib/melo/store";

export function FirmPage() {
  const agents = useMelo((s) => s.agents);
  const market = useMelo((s) => s.marketplace);
  const setAuto = useMelo((s) => s.setAutopilot);
  const create = useMelo((s) => s.createAgent);
  const hire = useMelo((s) => s.hireSpecialist);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    role: "",
    voice: "Australian English · Isla",
    tools: "Inbox, Knowledge",
    call: false,
    autopilot: "draft" as Autopilot,
  });
  const unhired = market.filter((m) => !agents.some((a) => a.marketplaceId === m.id));

  return (
    <div className="p-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Firm</h1>
          <p className="text-sm text-muted-foreground">Helix orchestrates these specialists in parallel. Money and public sends still land in Review unless autopilot is Act.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link to="/app/connect">Agent tools</Link>
          </Button>
          <Button onClick={() => setOpen(true)}>
            <Plus /> Create an AI agent
          </Button>
        </div>
      </div>
      <div className="mb-4 rounded-xl border border-border bg-canvas p-4">
        <div className="text-sm font-medium">Helix is the floor manager</div>
        <p className="mt-1 text-sm text-muted-foreground">
          It decomposes goals from Ask Melo, assigns specialists, collects drafts in Review and writes every action to the activity log. Click an AI agent to ask what they’re on.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {agents.map((a) => (
          <article key={a.id} className="rounded-xl border border-border bg-canvas p-4">
            <button
              type="button"
              className="flex w-full items-start gap-3 text-left"
              onClick={() => void submitAsk(`@${a.name} what are you working on?`)}
            >
              <AgentPortrait agent={a} size={56} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold">{a.name}</h2>
                  <StatusDot status={a.status} />
                </div>
                <div className="text-xs text-muted-foreground">{a.role}</div>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{a.blurb}</p>
              </div>
            </button>
            <div className="mt-3 text-sm">
              <span className="text-muted-foreground">Now · </span>
              {a.currentTask ?? "Idle"}
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {a.tools.map((t) => (
                <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-[11px]">
                  {t}
                </span>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
              <span className="text-xs text-muted-foreground">{a.taskCount} tasks</span>
              <Select value={a.autopilot} onValueChange={(v) => setAuto(a.id, v as Autopilot)}>
                <SelectTrigger className="h-8 w-[160px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["ask", "draft", "act"] as const).map((k) => (
                    <SelectItem key={k} value={k}>
                      {AUTOPILOT_LABEL[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </article>
        ))}
      </div>

      {unhired.length > 0 ? (
        <section className="mt-8">
          <div className="mb-3">
            <h2 className="text-sm font-semibold">Specialists</h2>
            <p className="text-sm text-muted-foreground">Add a roster specialist, or create your own above.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {unhired.map((m) => (
              <article key={m.id} className="flex items-start justify-between gap-3 rounded-xl border border-border bg-canvas p-4">
                <div className="flex min-w-0 gap-3">
                  <AgentPortrait agent={m} size={44} />
                  <div className="min-w-0">
                    <div className="font-medium">{m.name}</div>
                    <div className="text-xs text-muted-foreground">{m.role}{m.pack ? ` · ${m.pack}` : ""}</div>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{m.blurb}</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => hire(m.id)}>
                  Add
                </Button>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>Create an AI agent</DialogTitle>
          <DialogDescription>Persists to this workspace. Helix can assign them work immediately.</DialogDescription>
          <div className="mt-4 grid gap-3">
            <div>
              <Label>Name</Label>
              <Input className="mt-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Role</Label>
              <Input className="mt-1" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
            </div>
            <div>
              <Label>Voice</Label>
              <Input className="mt-1" value={form.voice} onChange={(e) => setForm({ ...form, voice: e.target.value })} />
            </div>
            <div>
              <Label>Tools</Label>
              <Input className="mt-1" value={form.tools} onChange={(e) => setForm({ ...form, tools: e.target.value })} />
            </div>
            <label className="flex items-center justify-between text-sm">
              Handle calls
              <Switch checked={form.call} onCheckedChange={(c) => setForm({ ...form, call: c })} />
            </label>
            <Button
              onClick={() => {
                if (!form.name.trim()) return;
                create({
                  name: form.name,
                  role: form.role || "Specialist",
                  voice: form.voice,
                  tools: form.tools.split(",").map((t) => t.trim()).filter(Boolean),
                  permissions: form.call ? ["read", "draft", "call"] : ["read", "draft"],
                  autopilot: form.autopilot,
                });
                setOpen(false);
                setForm({ name: "", role: "", voice: "Australian English · Isla", tools: "Inbox, Knowledge", call: false, autopilot: "draft" });
              }}
            >
              Add to firm
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
