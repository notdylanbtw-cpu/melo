import { createFileRoute } from "@tanstack/react-router";
import { MarketingHome } from "@/features/marketing/home";

export const Route = createFileRoute("/")({
  component: MarketingHome,
  head: () => ({
    meta: [
      { title: "Melo — AI receptionist for business" },
      { name: "description", content: "One platform to run the office — phone, inbox, quotes, calendar, AI agents. Cancel the rest." },
    ],
  }),
});
