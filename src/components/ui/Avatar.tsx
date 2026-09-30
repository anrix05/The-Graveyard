import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface AvatarProps {
  src?: string | null;
  username?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  className?: string;
  showFullUsername?: boolean;
}

// Generate deterministic gradient from username
function getAvatarGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  const gradients = [
    'from-rose-500/80 to-amber-500/80',
    'from-purple-600/80 to-blue-500/80',
    'from-emerald-500/80 to-teal-700/80',
    'from-blue-600/80 to-cyan-400/80',
    'from-orange-500/80 to-red-600/80',
    'from-fuchsia-600/80 to-pink-500/80',
    'from-indigo-500/80 to-cyan-500/80',
    'from-amber-600/80 to-yellow-400/80',
  ];
  return gradients[Math.abs(hash) % gradients.length];
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  username,
  size = 'md',
  className,
}) => {
  const [error, setError] = React.useState(false);

  const sizeClasses = {
    sm: 'w-6 h-6 text-[11px]',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm',
    xl: 'w-14 h-14 text-base font-bold',
  };

  const isNumeric = typeof size === 'number';
  const customStyle = isNumeric ? { width: `${size}px`, height: `${size}px` } : undefined;

  const name = username || 'operative';
  const initial = name.charAt(0).toUpperCase();
  const gradientClass = getAvatarGradient(name);

  return (
    <div
      title={`@${name}`}
      style={customStyle}
      className={cn(
        'relative inline-flex items-center justify-center font-display font-semibold shrink-0 rounded-full overflow-hidden select-none',
        'border border-line shadow-sm',
        !isNumeric && sizeClasses[size as keyof typeof sizeClasses],
        className
      )}
    >
      {src && !error ? (
        <Image
          src={src}
          alt={name}
          fill
          sizes="56px"
          className="object-cover"
          onError={() => setError(true)}
          unoptimized={src.startsWith('data:') || src.includes('dicebear')}
        />
      ) : (
        <div
          className={cn(
            'w-full h-full flex items-center justify-center bg-gradient-to-br text-white font-mono',
            gradientClass
          )}
        >
          {initial}
        </div>
      )}
    </div>
  );
};

export default Avatar;
