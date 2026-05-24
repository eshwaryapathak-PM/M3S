// Eyebrow: 6px walnut dot + JetBrains Mono uppercase label (CLAUDE.md §4.3).
// Always paired with an Instrument Serif italic headline below it.

interface EyebrowProps {
  children: React.ReactNode;
  dotClassName?: string;
  textClassName?: string;
}

export function Eyebrow({
  children,
  dotClassName = 'bg-walnut-700',
  textClassName = 'text-clay-600',
}: EyebrowProps) {
  return (
    <div
      className={`flex items-center gap-2 font-mono text-[11px] uppercase tracking-[1.5px] font-medium ${textClassName}`}
    >
      <span className={`block w-1.5 h-1.5 rounded-full shrink-0 ${dotClassName}`} />
      <span>{children}</span>
    </div>
  );
}
