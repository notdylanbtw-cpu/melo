import { createFileRoute } from "@tanstack/react-router";
import { CalendarPage } from "@/features/calendar";

export const Route = createFileRoute("/app/calendar")({
  component: CalendarPage,
});
