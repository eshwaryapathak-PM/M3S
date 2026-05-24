// Supabase server client. Reads cookies from the Next.js request, so RLS sees
// the authenticated user. Use in Server Components, Route Handlers, Server Actions.
//
// Never import this from a Client Component — it will pull next/headers into the
// browser bundle and crash the build.

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Called from a Server Component where the cookie store is read-only.
            // That's fine — session refresh happens in middleware (Phase 4).
          }
        },
      },
    },
  );
}
