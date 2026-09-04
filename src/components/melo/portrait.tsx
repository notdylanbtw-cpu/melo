import { cn } from "@/lib/utils";
import { initials } from "@/lib/format";
import type { Agent, StaffMember } from "@/lib/melo/types";

const colorBg: Record<string, string> = {
  primary: "bg-primary",
  "agent-receptionist": "bg-agent-receptionist",
  "agent-dispatch": "bg-agent-dispatch",
  "agent-scout": "bg-agent-scout",
  "agent-quill": "bg-agent-quill",
  "agent-ledger": "bg-agent-ledger",
  "agent-brief": "bg-agent-brief",
  "agent-helix": "bg-agent-helix",
};

export function AgentPortrait({
  agent,
  size = 40,
  className,
}: {
  agent: Pick<Agent, "name" | "portrait" | "color">;
  size?: number;
  className?: string;
}) {
  const dim = { width: size, height: size };
  if (agent.portrait) {
    return (
      <img
        src={agent.portrait}
        alt={agent.name}
        style={dim}
        className={cn("rounded-full object-cover outline outline-1 -outline-offset-1 outline-ink/10", className)}
      />
    );
  }
  return (
    <span
      style={dim}
      className={cn(
        "inline-flex items-center justify-center rounded-full text-primary-foreground",
        colorBg[agent.color] ?? "bg-primary",
        className,
      )}
    >
      <span className="text-[11px] font-semibold">{initials(agent.name)}</span>
    </span>
  );
}

export function StaffAvatar({ staff, size = 28 }: { staff: StaffMember; size?: number }) {
  return (
    <span
      style={{ width: size, height: size }}
      className="inline-flex items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-primary"
    >
      {initials(staff.name)}
    </span>
  );
}
