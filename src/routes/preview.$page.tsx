import { useLayoutEffect } from "react";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { AppShell } from "@/components/shell/app-shell";
import { HomePage } from "@/features/home";
import { InboxPage } from "@/features/inbox";
import { FirmPage } from "@/features/firm";
import { CalendarPage } from "@/features/calendar";
import { ReceptionPage } from "@/features/reception";
import { SettingsPage } from "@/features/settings";
import { bootPreview } from "@/features/marketing/preview-boot";

const PAGES = {
  home: HomePage,
  inbox: InboxPage,
  firm: FirmPage,
  calendar: CalendarPage,
  reception: ReceptionPage,
  billing: SettingsPage,
} as const;

export const Route = createFileRoute("/preview/$page")({
  component: PreviewPage,
  head: () => ({
    meta: [{ title: "Melo" }, { name: "robots", content: "noindex" }],
  }),
});

function PreviewPage() {
  const { page } = Route.useParams();
  const Page = PAGES[page as keyof typeof PAGES];

  useLayoutEffect(() => {
    bootPreview(page);
  }, [page]);

  if (!Page) return <Navigate to="/preview/$page" params={{ page: "home" }} />;

  return (
    <AppShell preview>
      <Page />
    </AppShell>
  );
}
