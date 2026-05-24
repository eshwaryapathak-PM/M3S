// Icon: SVG registry. Seed with two universal icons; each phase adds what it needs
// (don't preload icons that aren't yet used — keeps the bundle lean).

const ICONS: Record<string, React.ReactNode> = {
  arrow: (
    <path
      d="M5 12h14M13 5l7 7-7 7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  check: (
    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
  ),
};

export type IconName = keyof typeof ICONS;

interface IconProps {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function Icon({
  name,
  size = 22,
  strokeWidth = 1.5,
  className = '',
}: IconProps) {
  const icon = ICONS[name];
  if (!icon) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      className={className}
      aria-hidden="true"
    >
      {icon}
    </svg>
  );
}
