// Mono: JetBrains Mono, uppercase, wide-tracked (CLAUDE.md §4.2 / §9.3).
// Used for micro-copy, badges, axis labels — anywhere the eyebrow pattern is overkill.

interface MonoProps {
  children: React.ReactNode;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

const sizeClasses: Record<NonNullable<MonoProps['size']>, string> = {
  xs: 'text-[9px]',
  sm: 'text-[10px]',
  md: 'text-[11px]',
};

export function Mono({ children, size = 'sm', className = '' }: MonoProps) {
  return (
    <span
      className={`font-mono uppercase tracking-[1.5px] font-medium text-clay-600 ${sizeClasses[size]} ${className}`}
    >
      {children}
    </span>
  );
}
