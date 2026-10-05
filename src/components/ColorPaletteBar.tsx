import React from 'react';

interface ColorPaletteBarProps {
  colors: string[];
  className?: string;
  isLightBg?: boolean;
}

export const ColorPaletteBar: React.FC<ColorPaletteBarProps> = ({
  colors,
  className = '',
  isLightBg = false,
}) => {
  if (!colors || colors.length === 0) return null;

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {colors.map((hex, idx) => (
        <span
          key={`${hex}-${idx}`}
          className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shrink-0 shadow-xs border transition-transform hover:scale-125"
          style={{
            backgroundColor: hex,
            borderColor: isLightBg ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.2)',
          }}
          title={`画面提取原色: ${hex}`}
        />
      ))}
    </div>
  );
};
