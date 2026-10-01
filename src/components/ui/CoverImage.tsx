'use client';

import React from 'react';
import Img from '@/components/ui/Img';
import { Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CoverImageProps {
  title: string;
  coverUrl?: string | null;
  className?: string;
  aspectRatio?: '16/9' | '4/3' | '1/1';
  alt?: string;
}

// Generate deterministic cyberpunk gradient and grid lines based on string hash
function generatePatternStyle(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const hue1 = Math.abs(hash % 360);

  return {
    background: `radial-gradient(circle at 75% 25%, hsl(${hue1} 80% 25% / 0.4) 0%, transparent 60%), linear-gradient(135deg, #0f0f0f 0%, #171717 100%)`,
    gridColor: `hsl(${hue1} 60% 40% / 0.15)`,
  };
}

export const CoverImage: React.FC<CoverImageProps> = ({
  title,
  coverUrl,
  className,
  aspectRatio = '16/9',
  alt,
}) => {
  const [imageError, setImageError] = React.useState(false);
  const pattern = generatePatternStyle(title || 'project');

  const aspectClass = {
    '16/9': 'aspect-video',
    '4/3': 'aspect-[4/3]',
    '1/1': 'aspect-square',
  }[aspectRatio];

  if (coverUrl && !imageError) {
    return (
      <div className={cn('relative w-full overflow-hidden bg-[#121212]', aspectClass, className)}>
        <Img
          src={coverUrl}
          alt={alt || `${title} cover image`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          onError={() => setImageError(true)}
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/80 via-transparent to-transparent pointer-events-none" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden flex flex-col items-center justify-center p-4 border-b border-[#2d2d2d]',
        aspectClass,
        className
      )}
      style={{ background: pattern.background }}
    >
      {/* Background SVG Grid Pattern */}
      <svg
        className="absolute inset-0 w-full h-full opacity-30 pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id={`grid-${title.replace(/\W/g, '')}`} width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke={pattern.gridColor} strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#grid-${title.replace(/\W/g, '')})`} />
      </svg>

      <div className="relative z-10 flex flex-col items-center text-center gap-2">
        <div className="w-10 h-10 rounded-full border border-white/10 bg-black/40 flex items-center justify-center text-[#9ca3af]">
          <Terminal className="w-5 h-5 text-neutral-300" />
        </div>
        <span className="font-display font-semibold text-sm tracking-wide text-white/90 line-clamp-1 max-w-[220px]">
          {title}
        </span>
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent pointer-events-none" />
    </div>
  );
};

export default CoverImage;
