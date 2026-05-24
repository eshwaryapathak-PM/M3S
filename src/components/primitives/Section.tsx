// Section: eyebrow + headline + body wrapper. Mobile-first padding (CLAUDE.md §9.8).

import { Eyebrow } from './Eyebrow';

interface SectionProps {
  eyebrow?: string;
  title?: string;
  children: React.ReactNode;
  id?: string;
  className?: string;
}

export function Section({ eyebrow, title, children, id, className = '' }: SectionProps) {
  return (
    <section id={id} className={`px-6 py-12 md:px-16 md:py-24 ${className}`}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      {title && (
        <h2 className="font-display italic text-4xl md:text-5xl text-espresso-900 mt-3 mb-8 leading-tight">
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}
