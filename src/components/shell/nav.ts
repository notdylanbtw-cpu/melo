import {
  BookOpen,
  Building2,
  CalendarDays,
  ClipboardCheck,
  Home,
  Inbox,
  Kanban,
  Cpu,
  Headphones,
  Puzzle,
  Radio,
  Settings,
  Phone,
  List,
  Receipt,
  type LucideIcon,
} from "lucide-react";

export type NavBadge = "inbox" | "reception" | "review";

export type NavLeaf = {
  to: string;
  label: string;
  icon: LucideIcon;
  badgeKey?: NavBadge;
};

export type NavBranch = {
  id: string;
  label: string;
  icon: LucideIcon;
  badgeKey?: NavBadge;
  defaultTo: string;
  children: NavLeaf[];
};

export type NavEntry = NavLeaf | NavBranch;

export type NavSection = {
  id: string;
  label: string;
  items: NavEntry[];
};

export function isBranch(item: NavEntry): item is NavBranch {
  return "children" in item;
}

export const NAV: NavSection[] = [
  {
    id: "office",
    label: "Your office",
    items: [
      { to: "/app", label: "Home", icon: Home },
      { to: "/app/inbox", label: "Inbox", icon: Inbox, badgeKey: "inbox" },
      {
        id: "reception",
        label: "Reception",
        icon: Headphones,
        badgeKey: "reception",
        defaultTo: "/app/reception",
        children: [
          { to: "/app/reception", label: "Live", icon: Phone, badgeKey: "reception" },
          { to: "/app/reception/calls", label: "Calls", icon: List },
        ],
      },
      { to: "/app/review", label: "Review", icon: ClipboardCheck, badgeKey: "review" },
    ],
  },
  {
    id: "work",
    label: "The work",
    items: [
      {
        id: "pipeline",
        label: "Pipeline",
        icon: Kanban,
        defaultTo: "/app/pipeline",
        children: [
          { to: "/app/pipeline", label: "Jobs", icon: Kanban },
          { to: "/app/pipeline/invoices", label: "Invoices", icon: Receipt },
        ],
      },
      { to: "/app/calendar", label: "Calendar", icon: CalendarDays },
      { to: "/app/firm", label: "Firm", icon: Building2 },
      { to: "/app/computer", label: "Computer", icon: Cpu },
    ],
  },
  {
    id: "grow",
    label: "Grow",
    items: [
      { to: "/app/reach", label: "Reach", icon: Radio },
      { to: "/app/knowledge", label: "Knowledge", icon: BookOpen },
      { to: "/app/connect", label: "Connect", icon: Puzzle },
      { to: "/app/settings", label: "Settings", icon: Settings },
    ],
  },
];

export const FLAT_NAV: NavLeaf[] = NAV.flatMap((s) => s.items.flatMap((item) => (isBranch(item) ? item.children : [item])));
