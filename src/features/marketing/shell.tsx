import { Link } from "@tanstack/react-router";
import { MeloWordmark } from "@/components/brand/melo-mark";
import { SupportBot } from "@/components/melo/support-bot";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import type { ReactNode } from "react";

export function MarketingShell({
  children,
  atmosphere,
}: {
  children: ReactNode;
  atmosphere?: boolean;
}) {
  const { user } = useCurrentUserState();
  return (
    <div className="relative min-h-dvh bg-mkt text-mkt-fg">
      {atmosphere ? (
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[920px] overflow-hidden">
          <img src="/mkt-sky.jpg" alt="" className="size-full object-cover object-[center_top]" />
          <div className="absolute inset-0 bg-gradient-to-b from-mkt/40 via-transparent to-mkt" />
        </div>
      ) : null}

      <header className="relative z-20 mx-auto flex max-w-[1120px] items-center justify-between gap-4 px-6 py-6">
        <Link to="/" className="shrink-0">
          <MeloWordmark invert />
        </Link>
        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 text-[15px] text-mkt-muted md:flex">
          <Link to="/" hash="how" className="transition-colors hover:text-mkt-fg">
            How it works
          </Link>
          <Link to="/" hash="pricing" className="transition-colors hover:text-mkt-fg">
            Pricing
          </Link>
          <Link to="/login" className="transition-colors hover:text-mkt-fg">
            Login
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/login" className="inline-flex h-10 items-center px-3 text-sm text-mkt-muted hover:text-mkt-fg md:hidden">
            Login
          </Link>
          {user ? (
            <Link to="/app" className="mkt-pill-cream inline-flex h-10 items-center px-5 text-sm font-semibold">
              Open Melo
            </Link>
          ) : (
            <Link to="/signup" className="mkt-pill-cream inline-flex h-10 items-center px-5 text-sm font-semibold">
              Get Melo
            </Link>
          )}
        </div>
      </header>
      <div className="relative z-10">{children}</div>
      <footer className="relative z-10 border-t border-white/10 px-6 py-16 text-sm text-mkt-muted">
        <div className="mx-auto max-w-[1120px]">
          <MeloWordmark invert />
          <p className="mt-3 max-w-sm text-pretty leading-relaxed">
            One platform for the office — phone, inbox, quotes, calendar, the firm.
          </p>
          <p className="mt-2 text-sm">
            <a href="https://officialmelo.com" className="hover:text-mkt-fg">
              officialmelo.com
            </a>
            <span className="mx-2 text-white/20">·</span>
            <a href="mailto:hello@officialmelo.com" className="hover:text-mkt-fg">
              hello@officialmelo.com
            </a>
          </p>
          <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <FooterCol
              title="Platform"
              links={[
                ["The phone", "/", "how"],
                ["Inbox", "/", "how"],
                ["The firm", "/", "how"],
                ["Quotes & invoices", "/", "pricing"],
                ["Ask Melo", "/", "ask"],
                ["Connect", "/", "how"],
              ]}
            />
            <FooterCol
              title="Industries"
              links={[
                ["Trades", "/", "who"],
                ["Clinics", "/", "who"],
                ["Law", "/", "who"],
                ["Hospitality", "/", "who"],
                ["Real estate", "/", "who"],
                ["Retail", "/", "who"],
              ]}
            />
            <FooterCol
              title="Use case"
              links={[
                ["Answer 24/7", "/", "how"],
                ["Melo Computer", "/", "how"],
                ["Book the job", "/", "how"],
                ["Send a quote", "/", "pricing"],
                ["Follow up", "/", "how"],
                ["Website widget", "/", "how"],
                ["One inbox", "/", "how"],
              ]}
            />
            <FooterCol
              title="Company"
              links={[
                ["How it works", "/how", ""],
                ["Plans", "/pricing", ""],
                ["Terms", "/terms", ""],
                ["Privacy", "/privacy", ""],
                ["Login", "/login", ""],
                ["Get Melo", "/signup", ""],
              ]}
            />
          </div>
          <p className="mt-14 text-xs">© {new Date().getFullYear()} Melo. All rights reserved.</p>
        </div>
      </footer>
      <SupportBot tone="dark" surface="web" />
    </div>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: [string, string, string][];
}) {
  return (
    <div>
      <h3 className="text-[13px] font-medium text-mkt-fg">{title}</h3>
      <ul className="mt-4 space-y-2">
        {links.map(([label, to, hash]) => (
          <li key={label}>
            <Link to={to} hash={hash || undefined} className="hover:text-mkt-fg">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
