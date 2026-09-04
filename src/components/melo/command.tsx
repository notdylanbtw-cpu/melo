import { useEffect, useState, type ReactNode } from "react";
import { Command } from "cmdk";
import { useNavigate } from "@tanstack/react-router";
import { useMelo } from "@/lib/melo/store";
import { submitAsk } from "@/components/melo/ask";
import { FLAT_NAV } from "@/components/shell/nav";
import { STAGE_LABEL } from "@/components/melo/status";

export function CommandPalette() {
  const open = useMelo((s) => s.commandOpen);
  const setOpen = useMelo((s) => s.setCommandOpen);
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const customers = useMelo((s) => s.customers);
  const jobs = useMelo((s) => s.jobs);
  const conversations = useMelo((s) => s.conversations);
  const agents = useMelo((s) => s.agents);
  const reviewItems = useMelo((s) => s.reviewItems);
  const selectConversation = useMelo((s) => s.selectConversation);
  const selectJob = useMelo((s) => s.selectJob);
  const selectReview = useMelo((s) => s.selectReview);
  const approve = useMelo((s) => s.approveReview);
  const setWidget = useMelo((s) => s.setWidgetOpen);
  const setAsk = useMelo((s) => s.setAskOpen);
  const setHelp = useMelo((s) => s.setHelpOpen);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!useMelo.getState().commandOpen);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);

  useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  if (!open) return null;

  const close = () => setOpen(false);
  const needle = q.trim().toLowerCase();
  const hit = (s: string) => !needle || s.toLowerCase().includes(needle);

  const shownCustomers = customers.filter((c) => c.id !== "visitor" && hit(`${c.name} ${c.phone} ${c.email} ${c.sites[0]?.suburb ?? ""}`)).slice(0, 5);
  const shownJobs = jobs.filter((j) => hit(`${j.number} ${j.title} ${j.suburb}`)).slice(0, 5);
  const shownConv = conversations.filter((c) => {
    const cust = customers.find((x) => x.id === c.customerId);
    return hit(`${c.subject} ${cust?.name ?? ""} ${c.preview}`);
  }).slice(0, 5);
  const shownAgents = agents.filter((a) => hit(`${a.name} ${a.role} ${a.currentTask ?? ""}`)).slice(0, 6);
  const shownReview = reviewItems
    .filter((r) => r.status === "pending" && hit(`${r.title} ${r.summary}`))
    .slice(0, 5);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-ink/30 pt-[12vh]" onClick={close}>
      <Command
        className="w-[min(560px,calc(100%-24px))] overflow-hidden rounded-xl border border-border bg-canvas shadow-hairline"
        onClick={(e) => e.stopPropagation()}
      >
        <Command.Input
          autoFocus
          value={q}
          onValueChange={setQ}
          placeholder="Search jobs, people, threads — or ask Melo"
          className="h-12 w-full border-b border-border px-4 text-sm outline-none"
        />
        <Command.List className="melo-scroll max-h-[min(70vh,420px)] overflow-y-auto p-2">
          <Command.Empty className="px-3 py-6 text-center text-sm text-muted-foreground">No results</Command.Empty>

          <Command.Group heading="Ask" className="px-2 py-1 text-xs font-medium text-muted-foreground">
            {["Who is free Thursday?", "Quote tombrennan@fastmail.com overflow after hours", "What happened overnight?", "Callback Tom Brennan"].map((c) => (
              <Item
                key={c}
                value={c}
                onSelect={() => {
                  close();
                  void submitAsk(c);
                }}
              >
                {c}
              </Item>
            ))}
            {q.trim() ? (
              <Item
                value={`ask ${q}`}
                onSelect={() => {
                  close();
                  void submitAsk(q);
                }}
              >
                Ask Melo “{q}”
              </Item>
            ) : null}
          </Command.Group>

          <Command.Group heading="Go to" className="mt-2 px-2 py-1 text-xs font-medium text-muted-foreground">
            {FLAT_NAV.filter((n) => hit(n.label)).map((n) => (
              <Item
                key={n.to}
                value={`go ${n.label}`}
                onSelect={() => {
                  close();
                  void navigate({ to: n.to });
                }}
              >
                {n.label}
              </Item>
            ))}
          </Command.Group>

          {shownCustomers.length ? (
            <Command.Group heading="People" className="mt-2 px-2 py-1 text-xs font-medium text-muted-foreground">
              {shownCustomers.map((c) => (
                <Item
                  key={c.id}
                  value={`person ${c.name} ${c.phone}`}
                  onSelect={() => {
                    const conv = conversations.find((x) => x.customerId === c.id);
                    close();
                    if (conv) {
                      selectConversation(conv.id);
                      void navigate({ to: "/app/inbox" });
                    } else {
                      void navigate({ to: "/app/pipeline" });
                    }
                  }}
                >
                  {c.name}
                  <span className="ml-auto text-xs text-muted-foreground">{c.sites[0]?.suburb}</span>
                </Item>
              ))}
            </Command.Group>
          ) : null}

          {shownJobs.length ? (
            <Command.Group heading="Jobs" className="mt-2 px-2 py-1 text-xs font-medium text-muted-foreground">
              {shownJobs.map((j) => (
                <Item
                  key={j.id}
                  value={`job ${j.number} ${j.title} ${j.suburb}`}
                  onSelect={() => {
                    close();
                    selectJob(j.id);
                    void navigate({ to: "/app/pipeline" });
                  }}
                >
                  {j.number} · {j.title}
                  <span className="ml-auto text-xs text-muted-foreground">{STAGE_LABEL[j.stage]}</span>
                </Item>
              ))}
            </Command.Group>
          ) : null}

          {shownConv.length ? (
            <Command.Group heading="Inbox" className="mt-2 px-2 py-1 text-xs font-medium text-muted-foreground">
              {shownConv.map((c) => {
                const cust = customers.find((x) => x.id === c.customerId);
                return (
                  <Item
                    key={c.id}
                    value={`inbox ${cust?.name} ${c.subject}`}
                    onSelect={() => {
                      close();
                      selectConversation(c.id);
                      void navigate({ to: "/app/inbox" });
                    }}
                  >
                    {cust?.name}
                    <span className="ml-auto truncate pl-3 text-xs text-muted-foreground">{c.subject}</span>
                  </Item>
                );
              })}
            </Command.Group>
          ) : null}

          {shownReview.length ? (
            <Command.Group heading="Review" className="mt-2 px-2 py-1 text-xs font-medium text-muted-foreground">
              {shownReview.map((r) => (
                <Item
                  key={r.id}
                  value={`review ${r.title}`}
                  onSelect={() => {
                    close();
                    selectReview(r.id);
                    void navigate({ to: "/app/review" });
                  }}
                >
                  {r.title}
                </Item>
              ))}
            </Command.Group>
          ) : null}

          {shownAgents.length ? (
            <Command.Group heading="Firm" className="mt-2 px-2 py-1 text-xs font-medium text-muted-foreground">
              {shownAgents.map((a) => (
                <Item
                  key={a.id}
                  value={`agent ${a.name} ${a.role}`}
                  onSelect={() => {
                    close();
                    void submitAsk(`@${a.name} what are you working on?`);
                  }}
                >
                  @{a.name}
                  <span className="ml-auto truncate pl-3 text-xs text-muted-foreground">{a.currentTask ?? a.role}</span>
                </Item>
              ))}
            </Command.Group>
          ) : null}

          <Command.Group heading="Actions" className="mt-2 px-2 py-1 text-xs font-medium text-muted-foreground">
            <Item
              value="send invoice helen filter"
              onSelect={() => {
                close();
                useMelo.getState().setPipelineTab("invoices");
                void navigate({ to: "/app/pipeline" });
              }}
            >
              Send invoices
            </Item>
            <Item
              value="send quote mia signature"
              onSelect={() => {
                close();
                approve("rev-q2041");
              }}
            >
              Send Q-2041 for signature
            </Item>
            <Item
              value="sign quote mia approve job"
              onSelect={() => {
                close();
                void navigate({ to: "/sign/$quoteId", params: { quoteId: "q-2041" } });
              }}
            >
              Open Q-2041 signing page
            </Item>
            <Item
              value="preview widget"
              onSelect={() => {
                close();
                setWidget(true);
              }}
            >
              Preview customer widget
            </Item>
            <Item
              value="ask melo drawer"
              onSelect={() => {
                close();
                setAsk(true);
              }}
            >
              Open Ask Melo
            </Item>
            <Item
              value="help shortcuts"
              onSelect={() => {
                close();
                setHelp(true);
              }}
            >
              Keyboard shortcuts
            </Item>
          </Command.Group>
        </Command.List>
        <div className="border-t border-border px-3 py-2 text-[11px] text-muted-foreground">↵ to run · esc to close · ? for help</div>
      </Command>
    </div>
  );
}

function Item({
  value,
  onSelect,
  children,
}: {
  value: string;
  onSelect: () => void;
  children: ReactNode;
}) {
  return (
    <Command.Item
      value={value}
      onSelect={onSelect}
      className="flex cursor-pointer items-center rounded-md px-2 py-2 text-sm text-foreground data-[selected=true]:bg-muted"
    >
      {children}
    </Command.Item>
  );
}
