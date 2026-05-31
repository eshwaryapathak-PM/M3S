// Mono: JetBrains Mono, uppercase, wide-tracked (CLAUDE.md §4.2 / §9.3).
// Used for micro-copy, badges, axis labels — anywhere the eyebrow pattern is overkill.

interface MonoProps {
  children: React.ReactNode;
  size?: 'xs' | 'sm' | 'md';
  /** Token-pure colour, or 'inherit' to delegate to a parent (e.g. <Link> with hover states). */
  color?: 'clay' | 'walnut' | 'sand' | 'inherit';
  className?: string;
}

const sizeClasses: Record<NonNullable<MonoProps['size']>, string> = {
  xs: 'text-[9px]',
  sm: 'text-[10px]',
  md: 'text-[11px]',
};

const colorClasses: Record<NonNullable<MonoProps['color']>, string> = {
  clay: 'text-clay-600',
  walnut: 'text-walnut-700',
  sand: 'text-sand-200',
  inherit: '',
};

export function Mono({
  children,
  size = 'sm',
  color = 'clay',
  className = '',
}: MonoProps) {
  return (
    <span
      className={`font-mono uppercase tracking-[1.5px] font-medium ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
    >
      {children}
    </span>
  );
}
