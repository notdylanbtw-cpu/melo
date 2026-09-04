import { createFileRoute } from "@tanstack/react-router";
import { SignQuotePage } from "@/features/sign-quote";

export const Route = createFileRoute("/sign/$quoteId")({
  component: Page,
});

function Page() {
  const { quoteId } = Route.useParams();
  return <SignQuotePage quoteId={quoteId} />;
}
