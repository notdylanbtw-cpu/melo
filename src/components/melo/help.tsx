import { X } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/melo/empty";
import { useMelo } from "@/lib/melo/store";

const SHORTCUTS: { keys: string; label: string }[] = [
  { keys: "⌘K", label: "Search or ask Melo" },
  { keys: "⌘J", label: "Open Ask Melo" },
  { keys: "⌘.", label: "Preview customer widget" },
  { keys: "G then H", label: "Home" },
  { keys: "G then I", label: "Inbox" },
  { keys: "G then R", label: "Reception" },
  { keys: "G then F", label: "Firm" },
  { keys: "G then C", label: "Calendar" },
  { keys: "G then P", label: "Pipeline" },
  { keys: "G then V", label: "Review" },
  { keys: "G then S", label: "Settings" },
  { keys: "?", label: "This help" },
  { keys: "Esc", label: "Close overlay" },
];

export function HelpOverlay() {
  const open = useMelo((s) => s.helpOpen);
  const setOpen = useMelo((s) => s.setHelpOpen);
  const setWidget = useMelo((s) => s.setWidgetOpen);
  const selectReview = useMelo((s) => s.selectReview);
  const navigate = useNavigate();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-ink/30 px-4 pt-[8vh]" onClick={() => setOpen(false)}>
      <div
        role="dialog"
        aria-labelledby="help-title"
        className="melo-scroll max-h-[min(80vh,720px)] w-full max-w-xl overflow-y-auto rounded-xl border border-border bg-canvas p-5 shadow-hairline"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="help-title" className="text-base font-semibold">
              How this office runs
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">Melo is the office. You hire the staff. Helix is the floor manager.</p>
          </div>
          <Button size="icon" variant="ghost" onClick={() => setOpen(false)} aria-label="Close help">
            <X />
          </Button>
        </div>

        <ol className="mt-5 space-y-3 text-sm">
          <li className="rounded-lg border border-border p-3">
            <div className="font-medium">One brain</div>
            <p className="mt-0.5 text-muted-foreground">
              Knowledge feeds Receptionist, Ask Melo and the website widget. Train Melo in Settings — paste the website, the work and the tools you already use. Change a price once — all three move.
            </p>
          </li>
          <li className="rounded-lg border border-border p-3">
            <div className="font-medium">Helix assigns in parallel</div>
            <p className="mt-0.5 text-muted-foreground">
              Ask for an outcome. Specialists draft. Money, public posts and customer messages land in Review unless autopilot is Act within rules. Connect grants apps and MCP tools per AI agent.
            </p>
          </li>
          <li className="rounded-lg border border-border p-3">
            <div className="font-medium">You stay on the money</div>
            <p className="mt-0.5 text-muted-foreground">
              Send quotes for e-signature — the client’s sign-off approves the job. Ask Melo “create a quote for email … ” or “create an invoice for email …” and Ledger prices from the book, then waits for you to approve send.
            </p>
          </li>
        </ol>

        <div className="mt-5">
          <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">This morning</div>
          <div className="mt-2 flex flex-col gap-1.5">
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => {
                selectReview("rev-q2041");
                setOpen(false);
                void navigate({ to: "/app/review" });
              }}
            >
              Send Q-2041 for Mia Thompson to e-sign
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => {
                setOpen(false);
                void navigate({ to: "/app/reception" });
              }}
            >
              Sit in on James Wilson’s live call
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => {
                setOpen(false);
                useMelo.getState().setPipelineTab("invoices");
                void navigate({ to: "/app/pipeline" });
              }}
            >
              Send INV-3204 to Helen Cho
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => {
                setOpen(false);
                setWidget(true);
              }}
            >
              Preview the customer widget
            </Button>
          </div>
        </div>

        <div className="mt-5">
          <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Keyboard</div>
          <ul className="mt-2 divide-y divide-border rounded-lg border border-border">
            {SHORTCUTS.map((s) => (
              <li key={s.keys} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <span>{s.label}</span>
                <Kbd>{s.keys}</Kbd>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
