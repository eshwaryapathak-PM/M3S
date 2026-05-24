// Hairline: 1px M3S divider. `strong` for higher-contrast separators.

interface HairlineProps {
  strong?: boolean;
  className?: string;
}

export function Hairline({ strong = false, className = '' }: HairlineProps) {
  const color = strong ? 'border-hairline-strong' : 'border-hairline';
  return <hr className={`border-0 border-t ${color} ${className}`} />;
}
