'use client';

// Supabase browser client. Use in Client Components for realtime + client-side
// auth flows. Anon key only — RLS does the gatekeeping.

import { createBrowserClient } from '@supabase/ssr';

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
