"use client";

import Link from "next/link";
import { FOOTER_LINKS } from "./landing-data";

export function LandingFooter() {
  return (
    <footer className="border-t border-[#1E293B]/60 bg-[#05070B]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-14 sm:py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="lg:col-span-2">
            <Link href="/" className="text-xl font-bold text-white">
              Actora
            </Link>
            <p className="mt-3 text-sm text-[#64748B] max-w-sm leading-relaxed">
              Your AI operating system for email. Built for teams who want Linear-grade
              polish without the toolchain sprawl.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#64748B] mb-4">
              Product
            </p>
            <ul className="space-y-2.5">
              {FOOTER_LINKS.product.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-[#94A3B8] hover:text-white transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#64748B] mb-4">
              Company
            </p>
            <ul className="space-y-2.5">
              {FOOTER_LINKS.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[#94A3B8] hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-[#1E293B] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#64748B]">
            © {new Date().getFullYear()} Actora. All rights reserved.
          </p>
          <a
            href="mailto:sales@useactora.com"
            className="text-xs text-[#94A3B8] hover:text-[#2563EB] transition-colors"
          >
            sales@useactora.com
          </a>
        </div>
      </div>
    </footer>
  );
}
