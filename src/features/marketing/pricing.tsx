import { Link } from "@tanstack/react-router";
import { MarketingShell } from "./shell";
import { CompareTable, PricingGrid } from "./sections";

export function PricingPage() {
  return (
    <MarketingShell atmosphere>
      <div className="mx-auto max-w-[1120px] px-6 py-16">
        <p className="text-sm font-medium text-mkt-muted">Pricing</p>
        <h1 className="mt-2 max-w-xl text-4xl font-bold tracking-[-0.03em] sm:text-5xl">Plans</h1>
        <p className="mt-3 max-w-lg text-mkt-muted">
          Basic is the front desk. Pro is the office — seven days free. Agency is everything. GST on the invoice.
        </p>
        <div className="mt-12">
          <PricingGrid />
        </div>
        <div className="mt-16">
          <CompareTable />
        </div>
        <p className="mt-10 max-w-lg text-sm text-mkt-muted">
          Extra voice minutes are A$0.55 each. Cancel in Billing. The firm stays on until the period ends. Keep your existing number.
        </p>
        <Link to="/signup" className="mkt-pill-cream mt-8 inline-flex h-12 items-center px-7 text-sm font-semibold">
          Start 7-day trial
        </Link>
      </div>
    </MarketingShell>
  );
}
