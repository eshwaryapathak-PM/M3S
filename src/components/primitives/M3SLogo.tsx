// M3SLogo: type-based wordmark in Instrument Serif italic. The brand mark IS the type.
// Swap to an SVG mark only if/when the wordmark stops carrying enough weight at small sizes.

interface M3SLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses: Record<NonNullable<M3SLogoProps['size']>, string> = {
  sm: 'text-xl',
  md: 'text-2xl',
  lg: 'text-3xl',
};

export function M3SLogo({ size = 'md', className = '' }: M3SLogoProps) {
  return (
    <span
      className={`font-display italic text-espresso-900 leading-none ${sizeClasses[size]} ${className}`}
    >
      My Third Space
    </span>
  );
}
