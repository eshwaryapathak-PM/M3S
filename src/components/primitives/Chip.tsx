// Chip: pill-shaped tag / filter selector. Active state uses tone foreground.

interface ChipProps {
  children: React.ReactNode;
  active?: boolean;
  tone?: 'sand' | 'sage' | 'terra' | 'ochre';
  onClick?: () => void;
  className?: string;
}

const toneClasses: Record<
  NonNullable<ChipProps['tone']>,
  { active: string; inactive: string }
> = {
  sand: {
    active: 'bg-walnut-700 text-paper',
    inactive: 'bg-sand-100 text-espresso-900 hover:bg-sand-200',
  },
  sage: {
    active: 'bg-sage-500 text-paper',
    inactive: 'bg-sage-200 text-espresso-900 hover:bg-sage-200/80',
  },
  terra: {
    active: 'bg-terracotta-500 text-paper',
    inactive: 'bg-terracotta-200 text-espresso-900 hover:bg-terracotta-200/80',
  },
  ochre: {
    active: 'bg-ochre-500 text-espresso-900',
    inactive: 'bg-sand-100 text-espresso-900 hover:bg-sand-200',
  },
};

export function Chip({
  children,
  active = false,
  tone = 'sand',
  onClick,
  className = '',
}: ChipProps) {
  const classes = toneClasses[tone][active ? 'active' : 'inactive'];
  const base =
    'inline-flex items-center rounded-pill px-3 py-1 text-xs font-medium transition-colors duration-150';
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${base} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ochre-500 focus-visible:ring-offset-2 ${classes} ${className}`}
      >
        {children}
      </button>
    );
  }
  return <span className={`${base} ${classes} ${className}`}>{children}</span>;
}
