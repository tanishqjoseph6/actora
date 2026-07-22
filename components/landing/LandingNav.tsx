"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { ActoraLogo } from "@/components/branding/ActoraLogo";
import {
  MENU_FLAT_LINKS,
  MENU_GROUPS,
  NAV_LINKS,
  type MenuGroup,
  type MenuLink,
} from "./landing-data";
import { cn } from "@/lib/utils";

function NavAnchor({
  href,
  children,
  className,
  onNavigate,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  onNavigate?: () => void;
}) {
  if (href.startsWith("mailto:") || href.startsWith("http")) {
    return (
      <a
        href={href}
        onClick={onNavigate}
        className={className}
        {...(href.startsWith("http")
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {})}
      >
        {children}
      </a>
    );
  }

  if (href.startsWith("/")) {
    return (
      <Link href={href} onClick={onNavigate} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <a href={href} onClick={onNavigate} className={className}>
      {children}
    </a>
  );
}

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    closeButtonRef.current?.focus();
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const closeMenu = () => setOpen(false);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-white/[0.06] bg-[#0A0A0A]/80 backdrop-blur-xl"
          : "bg-transparent"
      )}
    >
      <nav
        className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-5 sm:px-8 lg:h-[72px]"
        aria-label="Primary"
      >
        <ActoraLogo
          href="/"
          size={28}
          priority
          wordmarkClassName="text-[15px] font-semibold tracking-tight text-white"
        />

        <ul className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="rounded-xl px-3 py-2 text-sm text-[#A1A1AA] transition-colors hover:text-white"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className="hidden rounded-xl px-3 py-2 text-sm text-[#A1A1AA] transition-colors hover:text-white sm:inline-flex"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="rounded-xl bg-[#3B82F6] px-3.5 py-2 text-sm font-medium text-white transition-all hover:bg-[#2563EB] active:scale-[0.98] sm:px-4"
          >
            Get Started
          </Link>
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls={menuId}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.02] text-white transition-colors hover:border-[#3B82F6]/35 hover:bg-white/[0.04] md:hidden"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <>
            <motion.button
              type="button"
              aria-label="Close menu backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm md:hidden"
              onClick={closeMenu}
            />

            <motion.aside
              id={menuId}
              role="dialog"
              aria-modal="true"
              aria-label="Site menu"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 36 }}
              className="fixed inset-y-0 right-0 z-[70] flex w-[min(100vw-1.25rem,380px)] flex-col p-3 sm:p-4 md:hidden"
            >
              <div className="flex h-full flex-col overflow-hidden rounded-[20px] border border-white/[0.08] bg-[#0A0A0A]/85 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
                <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
                  <p className="text-sm font-medium text-white">Menu</p>
                  <button
                    ref={closeButtonRef}
                    type="button"
                    aria-label="Close menu"
                    onClick={closeMenu}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] text-[#A1A1AA] transition-colors hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="premium-scrollbar flex-1 overflow-y-auto px-3 py-4">
                  <div className="space-y-1">
                    {MENU_GROUPS.map((group) => (
                      <MenuAccordion
                        key={group.id}
                        group={group}
                        onNavigate={closeMenu}
                      />
                    ))}
                    {MENU_FLAT_LINKS.map((link) => (
                      <FlatMenuLink
                        key={link.label}
                        link={link}
                        onNavigate={closeMenu}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2 border-t border-white/[0.06] p-4">
                  <Link
                    href="/login"
                    onClick={closeMenu}
                    className="flex h-11 items-center justify-center rounded-xl border border-white/[0.1] bg-white/[0.02] text-sm font-medium text-white transition-colors hover:bg-white/[0.04]"
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    onClick={closeMenu}
                    className="flex h-11 items-center justify-center rounded-xl bg-[#3B82F6] text-sm font-medium text-white transition-colors hover:bg-[#2563EB]"
                  >
                    Get Started
                  </Link>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}

function FlatMenuLink({
  link,
  onNavigate,
}: {
  link: MenuLink;
  onNavigate: () => void;
}) {
  return (
    <NavAnchor
      href={link.href}
      onNavigate={onNavigate}
      className="flex w-full items-center rounded-xl px-3 py-3 text-sm font-medium text-[#D4D4D8] transition-colors hover:bg-white/[0.04] hover:text-white"
    >
      {link.label}
    </NavAnchor>
  );
}

function MenuAccordion({
  group,
  onNavigate,
}: {
  group: MenuGroup;
  onNavigate: () => void;
}) {
  const [expanded, setExpanded] = useState(group.id === "product");
  const panelId = useId();
  const buttonId = useId();

  return (
    <div className="rounded-xl">
      <button
        id={buttonId}
        type="button"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm font-medium text-white transition-colors hover:bg-white/[0.04]"
      >
        <span>{group.label}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-[#71717A] transition-transform duration-300",
            expanded && "rotate-180 text-[#3B82F6]"
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            id={panelId}
            role="region"
            aria-labelledby={buttonId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <ul className="space-y-0.5 pb-2 pl-2">
              {group.links.map((link) => (
                <li key={link.label}>
                  <NavAnchor
                    href={link.href}
                    onNavigate={onNavigate}
                    className="flex rounded-xl px-3 py-2.5 text-sm text-[#A1A1AA] transition-colors hover:bg-white/[0.04] hover:text-white"
                  >
                    {link.label}
                  </NavAnchor>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
