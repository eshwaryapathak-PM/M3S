// Marketing Footer — dark espresso surface shared by /, /book, /cafe.
// 4-column grid (collapses to 1-col below md): logo + blurb, then Visit / Hours / Contact.
// Bottom row: copyright + Coach Universe link + hashtag.

import Link from 'next/link';
import { M3SLogo } from '@/components/primitives/M3SLogo';
import { Mono } from '@/components/primitives/Mono';

interface FooterColumn {
  heading: string;
  items: string[];
}

const COLUMNS: FooterColumn[] = [
  { heading: 'Visit',   items: ['HAL 2nd Stage, Indiranagar', 'Bengaluru 560008', 'Get directions →'] },
  { heading: 'Hours',   items: ['Mon–Fri · 5:30 AM – 9:30 PM', 'Sat · 7 AM – 6 PM', 'Sun · 9 AM – 6 PM'] },
  { heading: 'Contact', items: ['hello@mythirdspace.fit', '+91 81239 01143', '@my.thirdspace'] },
];

export function Footer() {
  return (
    <footer className="bg-espresso-900 text-sand-200 px-6 md:px-8 py-16 md:py-20">
      <div className="max-w-[1240px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr] gap-10">
          {/* Brand + blurb */}
          <div>
            {/* dark surface override — see CLAUDE.md note on consumer-level overrides */}
            <M3SLogo size="lg" className="!text-sand-100" />
            <p className="mt-6 max-w-xs text-sm leading-relaxed text-sand-200/70">
              A holistic studio for the hours between home and work. Built for your future self.
            </p>
          </div>

          {/* Visit / Hours / Contact */}
          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <Mono size="sm" color="inherit" className="block mb-4 text-sand-200/60">
                {col.heading}
              </Mono>
              <ul className="space-y-2">
                {col.items.map((item) => (
                  <li key={item} className="text-sm text-sand-200/85">{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom row */}
        <div className="mt-16 pt-6 border-t border-sand-200/15 flex justify-between flex-wrap gap-6 items-center font-mono text-xs uppercase tracking-[1.5px] text-sand-200/75">
          <span className="opacity-80">© 2026 My Third Space</span>
          <div className="flex items-center gap-6 flex-wrap">
            <Link
              href="/coach"
              className="inline-flex items-center gap-2 pb-1 border-b border-sand-200/35 hover:border-sand-200/60 hover:text-sand-100 transition-colors duration-150 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ochre-500 focus-visible:ring-offset-2"
            >
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-ochre-500" />
              Coach Universe →
            </Link>
            <span className="opacity-70">#ATMYTHIRDSPACE</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
