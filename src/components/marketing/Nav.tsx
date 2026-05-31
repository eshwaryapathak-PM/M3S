'use client';

// Marketing Nav — sticky top bar shared by /, /book, /cafe.
// Desktop (md+): logo · 4 mono links · Sign-in pill
// Mobile (< md): logo · hamburger → drawer with links + Sign-in
// Active route via usePathname (About is a hash anchor, never marked active).
// Every clickable element has hover / focus-visible / active states per CLAUDE.md §9.6.

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { M3SLogo } from '@/components/primitives/M3SLogo';
import { Mono } from '@/components/primitives/Mono';
import { Btn } from '@/components/primitives/Btn';
import { Icon } from '@/components/primitives/Icon';
import { useSignInModal } from '@/lib/context/SignInModalContext';

interface NavItem {
  label: string;
  href: string;
  /** When set, the link is highlighted while pathname equals this value. About omits it. */
  matchPath?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/', matchPath: '/' },
  { label: 'Book', href: '/book', matchPath: '/book' },
  { label: 'Café', href: '/cafe', matchPath: '/cafe' },
  { label: 'About', href: '/#about' },
];

const linkBase =
  'inline-flex items-center transition-colors duration-150 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ochre-500 focus-visible:ring-offset-2 rounded-pill';

export function Nav() {
  const pathname = usePathname();
  const signIn = useSignInModal();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (matchPath?: string) =>
    Boolean(matchPath && pathname === matchPath);

  const linkColor = (matchPath?: string) =>
    isActive(matchPath)
      ? 'text-walnut-700'
      : 'text-clay-600 hover:text-walnut-700';

  // Active underline — bottom border in both states (transparent when inactive)
  // keeps layout height stable when the active link changes.
  const linkUnderline = (matchPath?: string) =>
    `border-b-2 ${isActive(matchPath) ? 'border-walnut-700' : 'border-transparent'}`;

  return (
    <nav className="sticky top-0 z-50 bg-sand-50/85 backdrop-blur-md border-b border-hairline">
      <div className="max-w-[1240px] mx-auto px-6 md:px-8 py-4 flex items-center justify-between gap-4">
        {/* Left — logo */}
        <Link
          href="/"
          aria-label="My Third Space — home"
          onClick={() => setMobileOpen(false)}
          className={linkBase}
        >
          <M3SLogo size="md" />
        </Link>

        {/* Center (md+) — primary nav */}
        <ul className="hidden md:flex items-center gap-6">
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`${linkBase} px-1 pt-1 pb-[2px] ${linkColor(item.matchPath)} ${linkUnderline(item.matchPath)}`}
              >
                <Mono size="sm" color="inherit">{item.label}</Mono>
              </Link>
            </li>
          ))}
        </ul>

        {/* Right (md+) — Sign-in CTA */}
        <div className="hidden md:block">
          <Btn variant="ghost" size="sm" onClick={() => signIn.open()}>
            Sign in
          </Btn>
        </div>

        {/* Right (mobile) — hamburger */}
        <button
          type="button"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
          className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-pill text-walnut-700 hover:bg-sand-100 active:translate-y-px transition-[background-color,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ochre-500 focus-visible:ring-offset-2"
        >
          <Icon name={mobileOpen ? 'close' : 'menu'} size={22} strokeWidth={1.6} />
        </button>
      </div>

      {/* Mobile drawer — fully opaque (translucency hurt legibility, see Phase 1a iter notes) */}
      {mobileOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-sand-50 border-b border-hairline">
          <ul className="px-6 py-2 flex flex-col">
            {NAV_ITEMS.map((item) => (
              <li
                key={item.href}
                className="border-b border-hairline last:border-0"
              >
                <Link
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block py-4 ${linkColor(item.matchPath)} transition-colors duration-150 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ochre-500 focus-visible:ring-offset-2`}
                >
                  <Mono size="md" color="inherit">{item.label}</Mono>
                </Link>
              </li>
            ))}
          </ul>

          {/* Auth zone — separated by heavier hairline + larger gap to read as a distinct section */}
          <div className="px-6 pt-10 pb-6 border-t border-hairline-strong">
            <div className="mb-5">
              <Mono size="md" color="walnut">Account</Mono>
            </div>
            <Btn
              variant="primary"
              size="sm"
              onClick={() => {
                setMobileOpen(false);
                signIn.open();
              }}
              className="w-full"
            >
              Sign in
            </Btn>
          </div>
        </div>
      )}
    </nav>
  );
}
