// Card with the M3S elevation tiers (CLAUDE.md §9.9):
//   base      — sand-50, no shadow
//   elevated  — paper + hairline + sh-2 (default)
//   floating  — paper + sh-3 + larger radius (modals, drawers)

interface CardProps {
  children: React.ReactNode;
  elevation?: 'base' | 'elevated' | 'floating';
  className?: string;
}

const elevationClasses: Record<NonNullable<CardProps['elevation']>, string> = {
  base: 'bg-sand-50',
  elevated: 'bg-paper border border-hairline shadow-sh-2',
  floating: 'bg-paper shadow-sh-3 rounded-m3s-xl',
};

export function Card({ children, elevation = 'elevated', className = '' }: CardProps) {
  return (
    <div className={`rounded-m3s-lg p-6 ${elevationClasses[elevation]} ${className}`}>
      {children}
    </div>
  );
}
