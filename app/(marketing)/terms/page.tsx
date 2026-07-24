import Link from "next/link";
import {
  LegalProse,
  MarketingPageHero,
} from "@/components/landing/MarketingPrimitives";
import { createPageMetadata } from "@/lib/marketing/seo";

export const metadata = createPageMetadata({
  title: "Terms of Service",
  description:
    "Terms governing use of Actora’s website, AI Inbox, workspace features, billing, and acceptable use.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <>
      <MarketingPageHero
        badge="Legal"
        title="Terms of Service"
        subtitle="Last updated: July 24, 2026. By using Actora you agree to these terms."
      />
      <LegalProse>
        <p>
          These Terms of Service (“Terms”) govern access to and use of Actora
          websites, applications, and services (the “Service”) operated by
          Actora. If you use Actora on behalf of an organization, you represent
          that you have authority to bind that organization.
        </p>

        <h2>1. The Service</h2>
        <p>
          Actora provides AI-assisted inbox, CRM, calendar, tasks, automations,
          analytics, and workspace collaboration tools. Features may change as
          we improve the product. Beta features may be unstable and are provided
          as-is.
        </p>

        <h2>2. Accounts & workspaces</h2>
        <ul>
          <li>You must provide accurate account information.</li>
          <li>
            You are responsible for activity under your credentials and for
            members you invite.
          </li>
          <li>
            Workspace owners control billing, membership, and ownership
            transfer.
          </li>
        </ul>

        <h2>3. Acceptable use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Violate law or third-party rights</li>
          <li>Probe, abuse, or disrupt the Service or other users</li>
          <li>Reverse engineer except where permitted by law</li>
          <li>
            Use Actora to send spam or unsolicited bulk messages in violation of
            applicable anti-spam laws
          </li>
          <li>Bypass plan limits, credit metering, or security controls</li>
        </ul>

        <h2>4. Customer content</h2>
        <p>
          You retain ownership of content you submit (emails you authorize us to
          access, CRM notes, tasks, etc.). You grant Actora a limited license to
          host, process, and display that content solely to provide the Service.
        </p>

        <h2>5. AI features & credits</h2>
        <p>
          AI outputs may be inaccurate. You are responsible for reviewing
          outputs before sending or relying on them. AI credit allotments and
          purchases are billed at the workspace level as described on our{" "}
          <Link href="/pricing">Pricing</Link> page and in-product billing
          screens.
        </p>

        <h2>6. Subscriptions & payments</h2>
        <p>
          Paid plans renew until canceled. Fees are charged via our payment
          provider. Taxes may apply. Refunds, if any, are handled according to
          our billing policies and applicable law. Trial conversions and plan
          changes are reflected in your workspace billing settings.
        </p>

        <h2>7. Third-party services</h2>
        <p>
          Integrations (such as Google) are subject to those providers’ terms.
          Actora is not responsible for third-party outages or policy changes
          that affect connected accounts.
        </p>

        <h2>8. Confidentiality & privacy</h2>
        <p>
          Our handling of personal data is described in the{" "}
          <Link href="/privacy">Privacy Policy</Link>.
        </p>

        <h2>9. Disclaimers</h2>
        <p>
          THE SERVICE IS PROVIDED “AS IS” WITHOUT WARRANTIES OF ANY KIND,
          EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A
          PARTICULAR PURPOSE, AND NON-INFRINGEMENT, TO THE MAXIMUM EXTENT
          PERMITTED BY LAW.
        </p>

        <h2>10. Limitation of liability</h2>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, ACTORA WILL NOT BE LIABLE FOR
          INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR
          ANY LOSS OF PROFITS, DATA, OR GOODWILL. OUR AGGREGATE LIABILITY FOR
          CLAIMS RELATING TO THE SERVICE WILL NOT EXCEED THE AMOUNTS YOU PAID TO
          ACTORA IN THE TWELVE MONTHS BEFORE THE CLAIM.
        </p>

        <h2>11. Termination</h2>
        <p>
          You may stop using the Service at any time. We may suspend or
          terminate access for violations of these Terms or risk to the Service
          or other users. Provisions that by nature should survive will survive
          termination.
        </p>

        <h2>12. Changes</h2>
        <p>
          We may update these Terms. Continued use after changes become
          effective constitutes acceptance. Material changes will be indicated
          by updating the date above.
        </p>

        <h2>13. Contact</h2>
        <p>
          Questions about these Terms:{" "}
          <a href="mailto:legal@useactora.com">legal@useactora.com</a> or our{" "}
          <Link href="/contact">Contact</Link> page.
        </p>
      </LegalProse>
    </>
  );
}
