'use client';

// Sign-in modal state — Context instead of a state library per CLAUDE.md §5.6.
// The modal itself ships in Phase 1 with the marketing Nav; Phase 0 only sets up
// the Provider + hook so every layout that needs to open sign-in talks to one source.

import { createContext, useCallback, useContext, useState } from 'react';

interface SignInModalState {
  isOpen: boolean;
  /** Path to redirect to after successful sign-in (e.g. caller of /book mid-flow). */
  nextPath: string | null;
  open: (nextPath?: string) => void;
  close: () => void;
}

const SignInModalContext = createContext<SignInModalState | null>(null);

export function SignInModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [nextPath, setNextPath] = useState<string | null>(null);

  const open = useCallback((next?: string) => {
    setNextPath(next ?? null);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setNextPath(null);
  }, []);

  return (
    <SignInModalContext.Provider value={{ isOpen, nextPath, open, close }}>
      {children}
    </SignInModalContext.Provider>
  );
}

export function useSignInModal(): SignInModalState {
  const ctx = useContext(SignInModalContext);
  if (!ctx) {
    throw new Error('useSignInModal must be used within SignInModalProvider');
  }
  return ctx;
}
