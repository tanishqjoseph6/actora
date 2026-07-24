"use client";

import Link from "next/link";
import { ActoraLogo } from "@/components/branding/ActoraLogo";
import { FOOTER_LINKS } from "./landing-data";
import { SocialLinks } from "./SocialLinks";

export function LandingFooter() {
  return (
    <footer className="border-t border-white/[0.06] pb-10 pt-16">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <ActoraLogo
              href="/"
              size={28}
              wordmarkClassName="text-[15px] font-semibold tracking-tight text-white"
            />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#71717A]">
              Where conversations become execution. AI Inbox for operators who
              turn email into outcomes.
            </p>
          </div>

          <div>
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.14em] text-[#52525B]">
              Product
            </p>
            <ul className="space-y-3">
              {FOOTER_LINKS.product.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-[#A1A1AA] transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.14em] text-[#52525B]">
              Company
            </p>
            <ul className="space-y-3">
              {FOOTER_LINKS.company.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-[#A1A1AA] transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href="mailto:sales@useactora.com"
                  className="text-sm text-[#A1A1AA] transition-colors hover:text-white"
                >
                  sales@useactora.com
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.14em] text-[#52525B]">
              Legal
            </p>
            <ul className="space-y-3">
              {FOOTER_LINKS.legal.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-[#A1A1AA] transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mb-3 mt-8 text-xs font-medium uppercase tracking-[0.14em] text-[#52525B]">
              Social
            </p>
            <SocialLinks orientation="vertical" />
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/[0.06] pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[#52525B]">
            © {new Date().getFullYear()} Actora. All rights reserved.
          </p>
          <p className="text-xs text-[#52525B]">
            Built for modern operators · {SITE_LINE}
          </p>
        </div>
      </div>
    </footer>
  );
}

const SITE_LINE = "useactora.com";
