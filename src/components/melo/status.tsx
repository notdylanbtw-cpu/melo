import { cn } from "@/lib/utils";
import type { AgentStatus, Autopilot, InvoiceStatus, JobStage } from "@/lib/melo/types";

export function StatusDot({ status }: { status: AgentStatus }) {
  const color =
    status === "working" ? "bg-success" : status === "waiting" ? "bg-warning" : status === "offline" ? "bg-subtle" : "bg-border";
  return (
    <span className="relative inline-flex size-2.5">
      <span className={cn("absolute inset-0 rounded-full", color, status === "working" && "live-dot")} />
    </span>
  );
}

export const STAGE_LABEL: Record<JobStage, string> = {
  new: "New",
  quoted: "Quoted",
  booked: "Booked",
  on_site: "On site",
  won: "Won",
};

export const AUTOPILOT_LABEL: Record<Autopilot, string> = {
  ask: "Ask me",
  draft: "Draft only",
  act: "Act within rules",
};

export const INVOICE_LABEL: Record<InvoiceStatus, string> = {
  draft: "Draft",
  awaiting_approval: "Awaiting approval",
  sent: "Sent",
  viewed: "Viewed",
  part_paid: "Part paid",
  paid: "Paid",
  overdue: "Overdue",
  void: "Void",
};

export function StagePill({ stage }: { stage: JobStage }) {
  const tone =
    stage === "won"
      ? "bg-success-soft text-success"
      : stage === "booked" || stage === "on_site"
        ? "bg-accent text-primary"
        : stage === "quoted"
          ? "bg-warning-soft text-warning"
          : "bg-muted text-muted-foreground";
  return <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", tone)}>{STAGE_LABEL[stage]}</span>;
}
