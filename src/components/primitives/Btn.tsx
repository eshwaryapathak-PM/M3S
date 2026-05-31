// Btn: pill-shaped CTAs per CLAUDE.md §4.3 (non-negotiable).
//   primary — walnut bg, paper text (default brand CTA)
//   ghost   — transparent, hairline border (secondary)
//   terra   — terracotta bg, RESERVED for destructive / owner-only admin actions (§4.3)
//
// When `href` is set, renders as a Next.js <Link> instead of <button> so callers don't
// nest <a>/<button> (invalid HTML). Every interactive state per §9.6.

import Link from 'next/link';

interface BtnProps {
  children: React.ReactNode;
  variant?: 'primary' | 'ghost' | 'terra';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  /** When set, renders as a Next.js <Link>. `disabled`/`type` are ignored in this mode. */
  href?: string;
  className?: string;
}

const variantClasses: Record<NonNullable<BtnProps['variant']>, string> = {
  primary:
    'bg-walnut-700 text-paper hover:bg-espresso-800 active:translate-y-px',
  ghost:
    'bg-transparent border border-hairline-strong text-espresso-900 hover:bg-sand-100 active:translate-y-px',
  terra:
    'bg-terracotta-500 text-paper hover:bg-terracotta-500/90 active:translate-y-px',
};

const sizeClasses: Record<NonNullable<BtnProps['size']>, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
};

export function Btn({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled,
  type = 'button',
  href,
  className = '',
}: BtnProps) {
  const classes = [
    'inline-flex items-center justify-center rounded-pill font-medium',
    // Only transition transform + colors per CLAUDE.md §9.5 (never `transition-all`).
    'transition-[background-color,color,transform] duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ochre-500 focus-visible:ring-offset-2',
    'disabled:opacity-40 disabled:cursor-not-allowed disabled:active:translate-y-0',
    variantClasses[variant],
    sizeClasses[size],
    className,
  ].join(' ');

  if (href) {
    return (
      <Link href={href} className={classes} onClick={onClick}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes}
    >
      {children}
    </button>
  );
}
