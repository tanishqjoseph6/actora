import Link from "next/link";
import {
  LegalProse,
  MarketingPageHero,
} from "@/components/landing/MarketingPrimitives";
import { createPageMetadata } from "@/lib/marketing/seo";

export const metadata = createPageMetadata({
  title: "Cookie Policy",
  description:
    "How Actora uses cookies and similar technologies for authentication, preferences, analytics, and security.",
  path: "/cookies",
});

export default function CookiesPage() {
  return (
    <>
      <MarketingPageHero
        badge="Legal"
        title="Cookie Policy"
        subtitle="Last updated: July 24, 2026. This policy explains how Actora uses cookies and similar technologies on useactora.com and the Actora app."
      />
      <LegalProse>
        <p>
          This Cookie Policy describes how Actora (“we”, “us”, “our”) uses
          cookies and similar technologies when you visit our website or use the
          Actora product at <Link href="/">useactora.com</Link>. It should be
          read alongside our <Link href="/privacy">Privacy Policy</Link>.
        </p>

        <h2>1. What are cookies?</h2>
        <p>
          Cookies are small text files stored on your device when you visit a
          website. Similar technologies include local storage, session storage,
          and pixels. They help sites remember preferences, keep you signed in,
          and understand how services are used.
        </p>

        <h2>2. How we use cookies</h2>
        <p>Actora uses cookies and similar technologies for:</p>
        <ul>
          <li>
            <strong>Authentication</strong> — keeping you signed in securely
            and protecting your session
          </li>
          <li>
            <strong>Preferences</strong> — remembering workspace context and UI
            settings during your visit
          </li>
          <li>
            <strong>Security</strong> — detecting abuse, preventing fraud, and
            enforcing access controls
          </li>
          <li>
            <strong>Analytics</strong> — understanding feature usage so we can
            improve performance and reliability
          </li>
        </ul>

        <h2>3. Types of cookies we use</h2>
        <h3>Strictly necessary</h3>
        <p>
          Required for the Service to function — for example session cookies
          that authenticate you and protect your account. These cannot be
          switched off without breaking core functionality.
        </p>
        <h3>Functional</h3>
        <p>
          Remember choices you make (such as dismissing notices or preserving
          navigation state) to provide a smoother experience.
        </p>
        <h3>Analytics</h3>
        <p>
          Help us measure traffic and product usage in aggregate. We configure
          analytics to minimize collection of personally identifying
          information where possible.
        </p>

        <h2>4. Third-party cookies</h2>
        <p>
          Some cookies are set by service providers that help us operate Actora
          — for example authentication, hosting, payment processing, or
          analytics partners. These providers process data under contractual
          obligations consistent with our Privacy Policy.
        </p>

        <h2>5. Your choices</h2>
        <p>
          Most browsers let you block or delete cookies through settings. If you
          disable strictly necessary cookies, parts of Actora — including sign
          in — may not work correctly.
        </p>
        <p>
          Where required by law, we will request consent before placing
          non-essential cookies.
        </p>

        <h2>6. Retention</h2>
        <p>
          Session cookies expire when you close your browser. Persistent cookies
          remain for a defined period or until you delete them. Authentication
          cookies typically expire according to your session settings or when you
          sign out.
        </p>

        <h2>7. Updates</h2>
        <p>
          We may update this Cookie Policy from time to time. Material changes
          will be posted on this page with an updated date.
        </p>

        <h2>8. Contact</h2>
        <p>
          Questions about cookies or privacy:{" "}
          <a href="mailto:privacy@useactora.com">privacy@useactora.com</a>.
          General contact: <Link href="/contact">Contact page</Link>.
        </p>
      </LegalProse>
    </>
  );
}
