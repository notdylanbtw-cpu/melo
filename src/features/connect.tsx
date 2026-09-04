import { useEffect, useMemo, useState } from "react";
import { Check } from "lucide-react";
import { AgentPortrait } from "@/components/melo/portrait";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/misc";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NATIVE_MCP, ROLE_SUGGESTED_APPS } from "@/lib/melo/agent-tools";
import { APP_LOGO, metaFor } from "@/lib/melo/connect-apps";
import { useMelo } from "@/lib/melo/store";
import { cn } from "@/lib/utils";
import type { Agent, Integration, IntegrationStatus } from "@/lib/melo/types";
import { ChannelConnectDialog, type ConnectKind } from "@/features/channel-connect";
import { listChannelAccounts } from "@/lib/channels/actions";
import { MeloMark } from "@/components/brand/melo-mark";

const GROUPS: { id: string; label: string }[] = [
  { id: "voice", label: "Voice" },
  { id: "calendar", label: "Calendar" },
  { id: "jobs", label: "Job systems" },
  { id: "payments", label: "Payments" },
  { id: "accounting", label: "Accounting" },
  { id: "crm", label: "CRM" },
  { id: "mail", label: "Mail" },
  { id: "social", label: "Messaging" },
  { id: "web", label: "Web & listings" },
  { id: "collab", label: "Collaboration" },
];

const REAL: Record<string, ConnectKind> = {
  twilio: "twilio",
  whatsapp: "whatsapp",
  instagram: "instagram",
  messenger: "messenger",
  facebook: "facebook",
  imessage: "imessage",
};

const STATUS: Record<IntegrationStatus, string> = {
  connected: "text-success",
  needs_attention: "text-warning",
  available: "text-muted-foreground",
};

const PERMS: { id: Agent["permissions"][number]; label: string; hint: string }[] = [
  { id: "read", label: "Read", hint: "See jobs, threads and the book" },
  { id: "draft", label: "Draft", hint: "File work in Review" },
  { id: "write", label: "Write", hint: "Act when autopilot allows" },
  { id: "call", label: "Call", hint: "Answer and place voice" },
];

export function ConnectPage() {
  const automations = useMelo((s) => s.automations);
  const toggleAuto = useMelo((s) => s.toggleAutomation);
  const agents = useMelo((s) => s.agents);
  const add = useMelo((s) => s.addConnector);
  const addMcp = useMelo((s) => s.addMcpServer);
  const connectors = useMelo((s) => s.connectors);
  const mcpServers = useMelo((s) => s.mcpServers);
  const [selectedId, setSelectedId] = useState(agents[0]?.id ?? "helix");
  const [wiz, setWiz] = useState(false);
  const [mcpOpen, setMcpOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ name: "Custom jobs API", baseUrl: "https://api.example.com", auth: "Bearer ••••" });
  const [mcpForm, setMcpForm] = useState({ name: "Job system MCP", url: "https://mcp.northsideplumbing.com.au/jobs" });
  const [connectKind, setConnectKind] = useState<ConnectKind | null>(null);
  const [consentId, setConsentId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const sync = useMelo((s) => s.syncChannelStatus);

  const refreshChannels = () => {
    void listChannelAccounts()
      .then((acc) => sync(acc.channels))
      .catch(() => undefined);
  };

  useEffect(() => {
    refreshChannels();
  }, []);

  const selected = agents.find((a) => a.id === selectedId) ?? agents[0];
  const mcp = mcpServers?.length ? mcpServers : NATIVE_MCP;

  return (
    <div className="p-4 sm:p-6">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-xl font-semibold">Connect</h1>
        <p className="mt-1 text-sm text-muted-foreground text-pretty">
          Apps for the workspace. Tools for each AI agent. MCP is how specialists call Knowledge, Jobs, Inbox and anything you host.
        </p>

        <Tabs defaultValue="apps" className="mt-5">
          <TabsList>
            <TabsTrigger value="apps">Connectors</TabsTrigger>
            <TabsTrigger value="agents">Skills</TabsTrigger>
            <TabsTrigger value="mcp">MCP</TabsTrigger>
            <TabsTrigger value="automations">Automations</TabsTrigger>
          </TabsList>

          <TabsContent value="agents" className="mt-5">
            <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
              <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
                {agents.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setSelectedId(a.id)}
                    className={cn(
                      "flex h-10 shrink-0 items-center gap-2 rounded-lg px-2 text-left text-sm",
                      selected?.id === a.id ? "bg-muted font-medium" : "text-muted-foreground hover:bg-muted/60",
                    )}
                  >
                    <AgentPortrait agent={a} size={24} />
                    {a.name}
                  </button>
                ))}
              </nav>
              {selected ? <AgentGrants agent={selected} /> : null}
            </div>
          </TabsContent>

          <TabsContent value="apps" className="mt-5">
            <AppsPane
              query={query}
              onQuery={setQuery}
              onAdd={(id) => setConsentId(id)}
              onNew={() => {
                setStep(0);
                setWiz(true);
              }}
            />
          </TabsContent>

          <TabsContent value="mcp" className="mt-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold">MCP servers</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Native Melo tools plus any Model Context Protocol server you host. Same protocol Cursor and ChatGPT use.
                </p>
              </div>
              <Button size="sm" onClick={() => setMcpOpen(true)}>
                Add MCP server
              </Button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {mcp.map((s) => {
                const users = agents.filter((a) => (a.mcpIds ?? []).includes(s.id));
                return (
                  <div key={s.id} className="rounded-xl border border-border bg-canvas p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium">{s.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {s.kind === "native" ? "Native" : "Custom"} · {s.detail}
                        </div>
                      </div>
                      <span className={cn("text-xs", s.status === "connected" ? "text-success" : "text-muted-foreground")}>
                        {s.status}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {s.tools.map((t) => (
                        <span key={t} className="rounded-full bg-muted px-2 py-0.5 font-mono text-[11px]">
                          {t}
                        </span>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center gap-1">
                      {users.map((a) => (
                        <AgentPortrait key={a.id} agent={a} size={22} />
                      ))}
                      {!users.length ? <span className="text-xs text-muted-foreground">Not granted</span> : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="automations" className="mt-5">
            <section className="rounded-xl border border-border bg-canvas p-4">
              <h2 className="font-semibold">Zapier</h2>
              <p className="mt-1 text-sm text-muted-foreground">Official Zapier app. Make and n8n are not in v1 — use MCP for those.</p>
              {automations.map((a) => (
                <div key={a.id} className="mt-3 flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-sm">
                  <span>
                    {a.name} · {a.action}
                  </span>
                  <Switch checked={a.on} onCheckedChange={() => toggleAuto(a.id)} />
                </div>
              ))}
            </section>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={wiz} onOpenChange={setWiz}>
        <DialogContent>
          <DialogTitle>Custom connector</DialogTitle>
          <DialogDescription>Step {step + 1} of 3</DialogDescription>
          {step === 0 ? (
            <div className="mt-3 space-y-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Label>Base URL</Label>
              <Input value={form.baseUrl} onChange={(e) => setForm({ ...form, baseUrl: e.target.value })} />
            </div>
          ) : null}
          {step === 1 ? (
            <div className="mt-3 space-y-2">
              <Label>Auth</Label>
              <Input value={form.auth} onChange={(e) => setForm({ ...form, auth: e.target.value })} />
            </div>
          ) : null}
          {step === 2 ? (
            <div className="mt-3 rounded-lg bg-muted p-3 font-mono text-xs">
              POST {form.baseUrl}/jobs{"\n"}Authorization: {form.auth}{"\n"}
              {`{ "title": "Blocked drain", "suburb": "Newtown" }`}
              <div className="mt-2 font-sans text-success">Test request 200 · 1 job matched</div>
            </div>
          ) : null}
          <div className="mt-4 flex justify-end gap-2">
            {step < 2 ? (
              <Button onClick={() => setStep(step + 1)}>Continue</Button>
            ) : (
              <Button
                onClick={() => {
                  add(form.name, form.baseUrl, form.auth);
                  setWiz(false);
                }}
              >
                Save connector
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={mcpOpen} onOpenChange={setMcpOpen}>
        <DialogContent>
          <DialogTitle>Add MCP server</DialogTitle>
          <DialogDescription>Helix will handshake and grant itself the tools. You can share them to specialists after.</DialogDescription>
          <div className="mt-3 space-y-2">
            <Label>Name</Label>
            <Input value={mcpForm.name} onChange={(e) => setMcpForm({ ...mcpForm, name: e.target.value })} />
            <Label>Server URL</Label>
            <Input value={mcpForm.url} onChange={(e) => setMcpForm({ ...mcpForm, url: e.target.value })} />
          </div>
          <div className="mt-4 flex justify-end">
            <Button
              onClick={() => {
                addMcp(mcpForm.name, mcpForm.url);
                setMcpOpen(false);
              }}
            >
              Connect
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <ChannelConnectDialog kind={connectKind} open={!!connectKind} onClose={() => setConnectKind(null)} onDone={refreshChannels} />
      <ConsentScreen
        id={consentId}
        onClose={() => setConsentId(null)}
        onNeedCredentials={(kind) => {
          setConsentId(null);
          setConnectKind(kind);
        }}
      />
    </div>
  );
}

function AgentGrants({ agent }: { agent: Agent }) {
  const integrations = useMelo((s) => s.integrations);
  const mcpServers = useMelo((s) => s.mcpServers) ?? NATIVE_MCP;
  const grantApp = useMelo((s) => s.toggleAgentIntegration);
  const grantMcp = useMelo((s) => s.toggleAgentMcp);
  const setPerm = useMelo((s) => s.setAgentPermission);
  const suggested = ROLE_SUGGESTED_APPS[agent.id] ?? [];
  const apps = integrations.filter((i) => suggested.includes(i.id) || (agent.integrationIds ?? []).includes(i.id));
  const shown = apps.length ? apps : integrations.filter((i) => i.status === "connected").slice(0, 6);

  return (
    <div className="space-y-5">
      <div>
        <div className="text-sm font-semibold">{agent.name}</div>
        <p className="mt-0.5 text-sm text-muted-foreground">{agent.blurb}</p>
      </div>

      <section>
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Permissions</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {PERMS.map((p) => (
            <label key={p.id} className="flex items-center justify-between rounded-xl border border-border bg-canvas px-3 py-2">
              <span>
                <span className="block text-sm font-medium">{p.label}</span>
                <span className="text-xs text-muted-foreground">{p.hint}</span>
              </span>
              <Switch checked={agent.permissions.includes(p.id)} onCheckedChange={(c) => setPerm(agent.id, p.id, c)} />
            </label>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Apps this AI agent can use</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {shown.map((i) => {
            const on = (agent.integrationIds ?? []).includes(i.id);
            return (
              <label key={i.id} className="flex items-center justify-between rounded-xl border border-border bg-canvas px-3 py-2">
                <span>
                  <span className="block text-sm font-medium">{i.name}</span>
                  <span className={cn("text-xs", STATUS[i.status])}>{i.detail}</span>
                </span>
                <Switch checked={on} onCheckedChange={() => grantApp(agent.id, i.id)} />
              </label>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">MCP tools</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {mcpServers.map((s) => {
            const on = (agent.mcpIds ?? []).includes(s.id);
            return (
              <label key={s.id} className="flex items-center justify-between rounded-xl border border-border bg-canvas px-3 py-2">
                <span>
                  <span className="block text-sm font-medium">{s.name}</span>
                  <span className="text-xs text-muted-foreground">{s.tools.slice(0, 3).join(" · ")}</span>
                </span>
                <Switch checked={on} onCheckedChange={() => grantMcp(agent.id, s.id)} />
              </label>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function AppsPane({
  query,
  onQuery,
  onAdd,
  onNew,
}: {
  query: string;
  onQuery: (v: string) => void;
  onAdd: (id: string) => void;
  onNew: () => void;
}) {
  const integrations = useMelo((s) => s.integrations);
  const connectors = useMelo((s) => s.connectors);
  const q = query.trim().toLowerCase();
  const filtered = useMemo(
    () => integrations.filter((i) => !q || i.name.toLowerCase().includes(q) || i.detail.toLowerCase().includes(q) || i.group.includes(q)),
    [integrations, q],
  );
  const connected = filtered.filter((i) => i.status === "connected" || i.status === "needs_attention");
  const available = filtered.filter((i) => i.status === "available");

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Search…"
          className="h-10 max-w-xs rounded-full"
        />
        <Button size="sm" className="ml-auto rounded-full" onClick={onNew}>
          New connector
        </Button>
      </div>

      {connected.length ? (
        <section className="mt-8">
          <h2 className="mb-1 text-sm font-semibold">Connected</h2>
          <ul className="divide-y divide-border">
            {connected.map((i) => (
              <AppRow key={i.id} item={i} onAction={() => onAdd(i.id)} />
            ))}
          </ul>
        </section>
      ) : null}

      {GROUPS.map((g) => {
        const items = available.filter((i) => i.group === g.id);
        if (!items.length) return null;
        return (
          <section key={g.id} className="mt-8">
            <h2 className="mb-1 text-sm font-semibold">{g.label}</h2>
            <ul className="divide-y divide-border">
              {items.map((i) => (
                <AppRow key={i.id} item={i} onAction={() => onAdd(i.id)} />
              ))}
            </ul>
          </section>
        );
      })}

      {connectors.length ? (
        <section className="mt-8">
          <h2 className="mb-1 text-sm font-semibold">Custom</h2>
          {connectors.map((c) => (
            <div key={c.id} className="flex items-center justify-between border-b border-border py-3 text-sm">
              <div>
                <div className="font-medium">{c.name}</div>
                <div className="text-xs text-muted-foreground">{c.baseUrl}</div>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                <Check className="size-3" /> Added
              </span>
            </div>
          ))}
        </section>
      ) : null}
    </div>
  );
}

function AppRow({ item, onAction }: { item: Integration; onAction: () => void }) {
  const meta = metaFor(item.id, item.name);
  const added = item.status === "connected";
  return (
    <li className="flex items-center gap-3 py-3">
      <AppLogo id={item.id} name={item.name} color={meta.color} />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{item.name}</div>
        <div className="truncate text-xs text-muted-foreground">{added || item.status === "needs_attention" ? item.detail : meta.tagline}</div>
      </div>
      {added ? (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex h-8 items-center gap-1 rounded-full border border-border px-3 text-xs text-muted-foreground hover:bg-muted"
        >
          <Check className="size-3" /> Added
        </button>
      ) : item.status === "needs_attention" ? (
        <Button size="sm" className="h-8 rounded-full" onClick={onAction}>
          Reconnect
        </Button>
      ) : (
        <Button size="sm" variant="outline" className="h-8 rounded-full" onClick={onAction}>
          Add
        </Button>
      )}
    </li>
  );
}

function AppLogo({ id, name, color }: { id: string; name: string; color: string }) {
  const src = APP_LOGO[id];
  return (
    <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-white shadow-[inset_0_0_0_1px_rgba(17,17,17,0.06)]">
      {src ? (
        <img src={src} alt="" className="size-6 object-contain" />
      ) : (
        <span className="text-xs font-bold" style={{ color }}>
          {name.slice(0, 2)}
        </span>
      )}
    </span>
  );
}

function ConsentScreen({
  id,
  onClose,
  onNeedCredentials,
}: {
  id: string | null;
  onClose: () => void;
  onNeedCredentials: (kind: ConnectKind) => void;
}) {
  const integrations = useMelo((s) => s.integrations);
  const connectApp = useMelo((s) => s.connectApp);
  const disconnectApp = useMelo((s) => s.disconnectApp);
  const contact = useMelo((s) => s.billing.contact);
  const ws = useMelo((s) => s.workspace);
  const [busy, setBusy] = useState(false);
  const item = integrations.find((i) => i.id === id) ?? null;
  const meta = item ? metaFor(item.id, item.name) : null;
  const added = item?.status === "connected";

  const allow = () => {
    if (!item) return;
    const kind = REAL[item.id];
    if (kind) {
      onNeedCredentials(kind);
      return;
    }
    setBusy(true);
    window.setTimeout(() => {
      const who = contact || `${ws.name.toLowerCase().replace(/\s+/g, "")}@gmail.com`;
      connectApp(item.id, who);
      setBusy(false);
      onClose();
    }, 700);
  };

  return (
    <Dialog open={!!id} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[440px] p-0 overflow-hidden">
        {item && meta ? (
          <div className="px-6 py-7">
            <div className="flex items-center gap-3">
              <AppLogo id={item.id} name={item.name} color={meta.color} />
              <span className="text-ink/25">→</span>
              <span className="grid size-10 place-items-center rounded-xl bg-ink">
                <MeloMark className="size-6" />
              </span>
            </div>
            <DialogTitle className="mt-5 text-xl font-semibold tracking-tight">
              {added ? `${item.name} is connected` : `Melo wants to access ${item.name}`}
            </DialogTitle>
            <DialogDescription className="mt-1">
              {added ? item.detail : `This lets the office use ${item.name} the way a staff member would.`}
            </DialogDescription>

            <p className="mt-6 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {added ? "This app can" : "Melo is asking to"}
            </p>
            <ul className="mt-2 space-y-3">
              {meta.scopes.map((s) => (
                <li key={s.title} className="flex gap-3">
                  <Check className="mt-0.5 size-4 shrink-0 text-success" />
                  <span>
                    <span className="block text-sm font-medium">{s.title}</span>
                    <span className="text-xs text-muted-foreground">{s.hint}</span>
                  </span>
                </li>
              ))}
            </ul>

            <p className="mt-6 text-xs text-muted-foreground">
              Credentials stay on this workspace. Disconnect anytime. Sends still wait in Review unless autopilot is on.
            </p>

            <div className="mt-6 flex gap-2">
              {added ? (
                <>
                  <Button variant="outline" className="flex-1" onClick={onClose}>
                    Done
                  </Button>
                  <Button
                    variant="danger"
                    className="flex-1"
                    onClick={() => {
                      disconnectApp(item.id);
                      onClose();
                    }}
                  >
                    Disconnect
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" className="flex-1" onClick={onClose} disabled={busy}>
                    Cancel
                  </Button>
                  <Button className="flex-1" onClick={allow} disabled={busy}>
                    {busy ? "Connecting…" : `Allow ${item.name}`}
                  </Button>
                </>
              )}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

