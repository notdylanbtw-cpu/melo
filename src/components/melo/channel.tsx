import { Instagram, Mail, MessageSquare, Phone, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Channel } from "@/lib/melo/types";

export const CHANNELS: Channel[] = ["voice", "sms", "whatsapp", "messenger", "instagram", "facebook", "imessage", "email", "widget"];

const meta: Record<Channel, { label: string; className: string; Icon: typeof Phone }> = {
  voice: { label: "Voice", className: "bg-accent text-primary", Icon: Phone },
  sms: { label: "SMS", className: "bg-success-soft text-success", Icon: MessageSquare },
  whatsapp: { label: "WhatsApp", className: "bg-success-soft text-success", Icon: MessageSquare },
  messenger: { label: "Messenger", className: "bg-accent text-primary", Icon: MessageSquare },
  facebook: { label: "Facebook", className: "bg-accent text-primary", Icon: MessageSquare },
  instagram: { label: "Instagram", className: "bg-danger-soft text-channel-instagram", Icon: Instagram },
  imessage: { label: "iMessage", className: "bg-muted text-foreground", Icon: MessageSquare },
  email: { label: "Email", className: "bg-muted text-muted-foreground", Icon: Mail },
  widget: { label: "Website", className: "bg-accent text-primary", Icon: Globe },
};

export function ChannelChip({ channel, className }: { channel: Channel; className?: string }) {
  const m = meta[channel];
  const Icon = m.Icon;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium", m.className, className)}>
      <Icon className="size-3" />
      {m.label}
    </span>
  );
}

export function ChannelDot({ channel }: { channel: Channel }) {
  const m = meta[channel];
  const Icon = m.Icon;
  return (
    <span className={cn("inline-flex size-6 items-center justify-center rounded-full", m.className)}>
      <Icon className="size-3.5" />
    </span>
  );
}
