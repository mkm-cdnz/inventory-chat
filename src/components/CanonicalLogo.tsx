import React from 'react';

interface CanonicalLogoProps {
  variant?: 'full-color' | 'white' | 'mono-dark' | 'mono-blue';
  className?: string;
  width?: number | string;
  height?: number | string;
  showWordmark?: boolean;
  wordmarkColor?: string;
}

/**
 * Matt Millar Canonical MM Monogram
 * Strict geometric specification:
 * - viewBox: 0 0 144 96
 * - 6 vertical bars: Tall-Short-Tall / Tall-Short-Tall
 * - bar width: 16, gap: 8, y: 16, tall: 64, short: 40
 * - x: [4, 28, 52, 76, 100, 124]
 * - square corners, no rounding
 */
export const CanonicalLogo: React.FC<CanonicalLogoProps> = ({
  variant = 'full-color',
  className = '',
  width = 72,
  height = 48,
  showWordmark = false,
  wordmarkColor,
}) => {
  const getBarColor = (index: number): string => {
    if (variant === 'white') return '#ffffff';
    if (variant === 'mono-dark') return '#2c3e50';
    if (variant === 'mono-blue') return '#3498db';
    // full-color: bars 1-3 Primary Dark, bars 4-6 Accent Blue
    return index < 3 ? '#2c3e50' : '#3498db';
  };

  const resolvedWordmarkColor =
    wordmarkColor || (variant === 'white' ? '#ffffff' : '#2c3e50');

  const svgMonogram = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 144 96"
      role="img"
      aria-label="Matt Millar MM monogram"
      width={width}
      height={height}
      className={`shrink-0 ${className}`}
      shapeRendering="geometricPrecision"
    >
      <rect x="4" y="16" width="16" height="64" fill={getBarColor(0)} />
      <rect x="28" y="16" width="16" height="40" fill={getBarColor(1)} />
      <rect x="52" y="16" width="16" height="64" fill={getBarColor(2)} />
      <rect x="76" y="16" width="16" height="64" fill={getBarColor(3)} />
      <rect x="100" y="16" width="16" height="40" fill={getBarColor(4)} />
      <rect x="124" y="16" width="16" height="64" fill={getBarColor(5)} />
    </svg>
  );

  if (!showWordmark) {
    return svgMonogram;
  }

  return (
    <div className="flex items-center gap-3">
      {svgMonogram}
      <div className="flex flex-col">
        <span
          className="font-semibold text-lg leading-tight tracking-[0.5px]"
          style={{
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            color: resolvedWordmarkColor,
          }}
        >
          Matt Millar
        </span>
        <span
          className="text-xs uppercase tracking-wider font-medium opacity-80"
          style={{ color: variant === 'white' ? '#ecf0f1' : '#7f8c8d' }}
        >
          Hardware Catalogue
        </span>
      </div>
    </div>
  );
};
