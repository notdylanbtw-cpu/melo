import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { HomePage } from "@/features/home";
import { InboxPage } from "@/features/inbox";
import { FirmPage } from "@/features/firm";
import { CalendarPage } from "@/features/calendar";
import { ReceptionPage } from "@/features/reception";
import { SettingsPage } from "@/features/settings";
import { bootPreview } from "./preview-boot";

const PAGES = {
  home: HomePage,
  inbox: InboxPage,
  firm: FirmPage,
  calendar: CalendarPage,
  reception: ReceptionPage,
  billing: SettingsPage,
} as const;

const PATH: Record<keyof typeof PAGES, string> = {
  home: "/app",
  inbox: "/app/inbox",
  firm: "/app/firm",
  calendar: "/app/calendar",
  reception: "/app/reception",
  billing: "/app/settings",
};

const DESKTOP_W = 1180;

export function OfficeShot({
  page,
  height = 520,
}: {
  page: keyof typeof PAGES;
  height?: number;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  const Page = PAGES[page];

  useLayoutEffect(() => {
    bootPreview(page);
  }, [page]);

  useLayoutEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const sync = () => setScale(el.clientWidth / DESKTOP_W);
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={wrap}
      className="relative overflow-hidden rounded-[20px] border border-border bg-background text-foreground shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
      style={{ height }}
    >
      <div
        className="pointer-events-none origin-top-left select-none"
        style={{
          width: DESKTOP_W,
          height: scale ? height / scale : height,
          transform: scale ? `scale(${scale})` : "scale(0.5)",
          opacity: scale ? 1 : 0,
        }}
      >
        <AppShell preview previewPath={PATH[page]}>
          <Page />
        </AppShell>
      </div>
    </div>
  );
}

export function OfficeFrame({ children, height }: { children: ReactNode; height?: number }) {
  return (
    <div
      className="overflow-hidden rounded-[20px] border border-border bg-background shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
      style={height ? { height } : undefined}
    >
      {children}
    </div>
  );
}
