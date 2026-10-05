import React from 'react';

interface BrandLogoProps {
  brandId: string;
  className?: string;
  color?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ brandId, className = 'h-4 w-auto', color = 'currentColor' }) => {
  const norm = (brandId || '').toLowerCase();

  if (norm.includes('hasselblad') || norm === 'hasselblad') {
    return (
      <svg viewBox="0 0 120 22" fill={color} className={className} aria-label="Hasselblad">
        <text x="0" y="16" fontFamily="'Cinzel', 'Times New Roman', serif" fontWeight="700" fontSize="15" letterSpacing="3.5">
          HASSELBLAD
        </text>
      </svg>
    );
  }

  if (norm.includes('leica') || norm === 'leica') {
    return (
      <div className={`inline-flex items-center gap-1.5 ${className}`}>
        <span className="inline-block w-3 h-3 rounded-full bg-[#E11D48] shrink-0" />
        <span className="font-serif italic font-bold tracking-wider text-xs" style={{ color }}>
          Leica
        </span>
      </div>
    );
  }

  if (norm.includes('fujifilm') || norm === 'fujifilm') {
    return (
      <svg viewBox="0 0 95 18" fill={color} className={className} aria-label="Fujifilm">
        <text x="0" y="14" fontFamily="'Plus Jakarta Sans', sans-serif" fontWeight="800" fontSize="13" letterSpacing="2">
          FUJIFILM
        </text>
      </svg>
    );
  }

  if (norm.includes('sony') || norm === 'sony') {
    return (
      <svg viewBox="0 0 65 18" fill={color} className={className} aria-label="Sony">
        <text x="0" y="14" fontFamily="'Plus Jakarta Sans', sans-serif" fontWeight="800" fontSize="14" letterSpacing="3">
          SONY
        </text>
      </svg>
    );
  }

  if (norm.includes('canon') || norm === 'canon') {
    return (
      <svg viewBox="0 0 70 18" fill={color} className={className} aria-label="Canon">
        <text x="0" y="14" fontFamily="serif" fontWeight="700" fontSize="14" letterSpacing="1.5">
          Canon
        </text>
      </svg>
    );
  }

  if (norm.includes('nikon') || norm === 'nikon') {
    return (
      <svg viewBox="0 0 68 18" fill={color} className={className} aria-label="Nikon">
        <text x="0" y="14" fontFamily="'Plus Jakarta Sans', sans-serif" fontStyle="italic" fontWeight="900" fontSize="14" letterSpacing="2">
          Nikon
        </text>
      </svg>
    );
  }

  if (norm.includes('apple') || norm === 'apple') {
    return (
      <svg viewBox="0 0 170 170" fill={color} className={className} aria-label="Apple">
        <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.68-7.85-11.96-14.42-7.59-11.75-13.3-25.13-17.13-40.15-3.83-15.02-3.83-28.79 0-41.31 4.58-15.02 12.39-26.65 23.44-34.9 11.05-8.25 23.36-12.45 36.93-12.61 4.8 0 10.3 1.25 16.5 3.75 6.2 2.5 10.15 3.75 11.85 3.75 1.7 0 5.8-1.3 12.3-3.9 6.5-2.6 11.8-3.8 15.9-3.6 12.6.7 23.2 5.3 31.8 13.8-10.9 6.6-16.3 15.7-16.2 27.3.1 9.3 3.6 17.2 10.5 23.7 6.9 6.5 15.2 10.3 24.9 11.4-2.1 6.5-4.9 13.3-8.4 20.4zM119.22 33.15c0-6.7 2.4-13.1 7.2-19.2 4.8-6.1 10.8-10.4 18-12.9.2 1.6.3 3.1.3 4.5 0 6.6-2.5 13.2-7.5 19.8-5 6.6-11 10.7-18 12.3v-4.5z" />
      </svg>
    );
  }

  if (norm.includes('ricoh') || norm === 'ricoh') {
    return (
      <div className={`inline-flex items-center gap-1 font-bold text-xs tracking-widest ${className}`} style={{ color }}>
        <span>RICOH</span>
        <span className="text-amber-500 font-black">GR</span>
      </div>
    );
  }

  if (norm.includes('zeiss') || norm === 'zeiss') {
    return (
      <svg viewBox="0 0 60 18" fill={color} className={className} aria-label="Zeiss">
        <text x="0" y="14" fontFamily="'Plus Jakarta Sans', sans-serif" fontWeight="800" fontSize="13" letterSpacing="2">
          ZEISS
        </text>
      </svg>
    );
  }

  // Fallback Camera Shutter Icon
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="m14.31 8 5.74 9.94" />
      <path d="M9.69 8h11.48" />
      <path d="m7.38 12 5.74-9.94" />
      <path d="M9.69 16 3.95 6.06" />
      <path d="M14.31 16H2.83" />
      <path d="m16.62 12-5.74 9.94" />
    </svg>
  );
};
