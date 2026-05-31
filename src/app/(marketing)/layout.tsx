// Marketing route group — wraps /, /book, /cafe with the shared Nav + Footer.
// SignInModalProvider lives in root layout, NOT here (avoid nested-Provider bug).

import { Nav } from '@/components/marketing/Nav';
import { Footer } from '@/components/marketing/Footer';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Nav />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
