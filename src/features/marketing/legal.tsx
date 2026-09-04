import { MarketingShell } from "./shell";

export function TermsPage() {
  return (
    <MarketingShell>
      <article className="mx-auto max-w-[720px] px-6 py-16">
        <p className="text-sm text-mkt-muted">Legal</p>
        <h1 className="mt-2 text-4xl font-bold tracking-[-0.03em]">Terms of service</h1>
        <p className="mt-3 text-sm text-mkt-muted">Last updated 4 September 2026. Governed by the laws of New South Wales, Australia.</p>
        <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-mkt-muted">
          <section>
            <h2 className="text-lg font-semibold text-mkt-fg">The service</h2>
            <p className="mt-2">
              Melo is software that answers the phone, inbox and related office work as an AI assistant for your business. You stay responsible for the work it does in your name — quotes, bookings, messages and anything it says to a customer. The product lives at officialmelo.com.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-mkt-fg">Accounts and trial</h2>
            <p className="mt-2">
              You need an account and a payment method to start. Pro includes a seven-day trial. After that we charge the plan you chose, unless you cancel in Billing before the trial ends. You must be able to bind the business you name on the account.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-mkt-fg">Acceptable use</h2>
            <p className="mt-2">
              Don’t use Melo to mislead callers about who they are speaking to, to break the law, or to send spam. Voice cloning and scripts must match a business you are authorised to represent. We can suspend an account that puts customers or the network at risk.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-mkt-fg">Fees</h2>
            <p className="mt-2">
              Prices are in Australian dollars, ex GST, as shown on the Plans page. Voice minutes over the plan cap are billed at A$0.55 per minute. The receptionist keeps answering. Seats and automations over the plan cap are billed as add-ons. Cancel anytime; access continues until the end of the paid period.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-mkt-fg">Your data</h2>
            <p className="mt-2">
              Call audio, messages, jobs and training material stay yours. We process them to run the product. Details are in the Privacy policy.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-mkt-fg">Contact</h2>
            <p className="mt-2">Questions: hello@officialmelo.com</p>
          </section>
        </div>
      </article>
    </MarketingShell>
  );
}

export function PrivacyPage() {
  return (
    <MarketingShell>
      <article className="mx-auto max-w-[720px] px-6 py-16">
        <p className="text-sm text-mkt-muted">Legal</p>
        <h1 className="mt-2 text-4xl font-bold tracking-[-0.03em]">Privacy policy</h1>
        <p className="mt-3 text-sm text-mkt-muted">Last updated 4 September 2026. Melo Pty Ltd, Australia.</p>
        <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-mkt-muted">
          <section>
            <h2 className="text-lg font-semibold text-mkt-fg">What we collect</h2>
            <p className="mt-2">
              Account details, billing, the business you train Melo on (website, hours, services), call audio and transcripts, messages from phone, SMS, WhatsApp, Instagram, email and your website, and how you use the office.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-mkt-fg">Why</h2>
            <p className="mt-2">
              To answer as your business, book work, send quotes, run the firm, bill you, and keep the product working. We don’t sell customer lists.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-mkt-fg">Who else sees it</h2>
            <p className="mt-2">
              Processors we need to run voice, messaging and payments (for example telephony, ElevenLabs, Stripe). They only get what that job requires. If you connect an app (Xero, WhatsApp, Google), that provider’s terms also apply.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-mkt-fg">Retention</h2>
            <p className="mt-2">
              We keep records while the account is open and for a reasonable period after, for tax and dispute handling. You can export or ask us to delete workspace data, except where we must keep it.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-mkt-fg">Your rights</h2>
            <p className="mt-2">
              Access, correction and deletion under the Australian Privacy Principles. Email hello@officialmelo.com. If you’re not satisfied, you can contact the OAIC.
            </p>
          </section>
        </div>
      </article>
    </MarketingShell>
  );
}
