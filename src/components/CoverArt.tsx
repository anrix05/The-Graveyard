import React from 'react';
import { InteractionType } from '@/types/project';

interface CoverArtProps {
  id?: string;
  title: string;
  mode?: InteractionType;
  className?: string;
  aspectRatio?: string;
}

// Deterministic 32-bit integer hash from string
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export default function CoverArt({
  id = 'preview',
  title,
  mode = 'buy',
  className = '',
}: CoverArtProps) {
  const hash = hashString((id || 'preview') + title);

  // Palette by mode with vibrant accent accents (25-35% alpha)
  const modeColors: Record<InteractionType, { primary: string; secondary: string; glow: string }> = {
    buy: {
      primary: 'rgba(57, 255, 20, 0.28)',
      secondary: 'rgba(34, 197, 94, 0.18)',
      glow: '#39ff14',
    },
    adopt: {
      primary: 'rgba(251, 191, 36, 0.30)',
      secondary: 'rgba(245, 158, 11, 0.18)',
      glow: '#fbbf24',
    },
    collab: {
      primary: 'rgba(59, 130, 246, 0.30)',
      secondary: 'rgba(37, 99, 235, 0.18)',
      glow: '#3b82f6',
    },
  };

  const { primary, secondary } = modeColors[mode] || modeColors.buy;

  // Derive varying blob coordinates and rotation deterministically
  const angle = (hash % 360);
  const cx1 = 15 + (hash % 50);
  const cy1 = 20 + ((hash >> 2) % 45);
  const cx2 = 55 + ((hash >> 4) % 35);
  const cy2 = 50 + ((hash >> 6) % 40);
  const cx3 = 35 + ((hash >> 8) % 40);
  const cy3 = 70 + ((hash >> 10) % 25);

  const glyphs = ['{}', '</>', '0x', 'λ', '::', '&&', ';;', title.charAt(0).toUpperCase() || '⚰'];
  const glyph = glyphs[hash % glyphs.length];

  return (
    <div
      className={`absolute inset-0 w-full h-full select-none overflow-hidden bg-[#0d0d10] ${className}`}
      aria-hidden="true"
    >
      {/* 2-3 Rich Gradient Blobs at 25-35% Alpha */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(circle at ${cx1}% ${cy1}%, ${primary} 0%, transparent 58%),
            radial-gradient(circle at ${cx2}% ${cy2}%, ${secondary} 0%, transparent 62%),
            radial-gradient(circle at ${cx3}% ${cy3}%, rgba(255, 255, 255, 0.05) 0%, transparent 50%),
            linear-gradient(${angle}deg, #131317 0%, #09090b 100%)
          `,
        }}
      />

      {/* Faint Dotted / Grid Matrix */}
      <svg
        className="absolute inset-0 w-full h-full opacity-15"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id={`dot-grid-${hash}`} width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="0.75" fill="#ffffff" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#dot-grid-${hash})`} />
      </svg>

      {/* Large Code Glyph at 12-16% opacity */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="font-mono text-7xl sm:text-8xl md:text-9xl font-bold tracking-tighter opacity-[0.14] text-white">
          {glyph}
        </span>
      </div>

      {/* Soft Vignette Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b]/80 via-transparent to-[#0a0a0b]/30 pointer-events-none" />
    </div>
  );
}
