// M3S-branded 404. Lives at root so Next.js resolves it for any unmatched URL
// (route-group not-found.tsx only catches 404s within that group's children,
// which never happens here since (marketing) sits at /). Manually composes the
// marketing Nav + Footer chrome so /book and /cafe 404s feel on-brand.
// When /coach routes ship in Phase 6, add a coach-scoped not-found.tsx alongside.

import { Nav } from '@/components/marketing/Nav';
import { Footer } from '@/components/marketing/Footer';
import { Eyebrow } from '@/components/primitives/Eyebrow';
import { Btn } from '@/components/primitives/Btn';

export default function NotFound() {
  return (
    <>
      <Nav />
      <main className="flex-1 flex items-center justify-center px-6 py-24 bg-sand-50">
        <div className="text-center max-w-md">
          <div className="flex justify-center mb-4">
            <Eyebrow>Page not found</Eyebrow>
          </div>
          <h1 className="font-display italic text-5xl md:text-6xl text-espresso-900 leading-tight">
            We&rsquo;re still building this.
          </h1>
          <p className="text-clay-600 mt-4 leading-relaxed">
            That page isn&rsquo;t live yet. Head back home — there&rsquo;s plenty
            to read while we finish up.
          </p>
          <div className="mt-8 flex justify-center">
            <Btn href="/" variant="primary">
              ← Return home
            </Btn>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
