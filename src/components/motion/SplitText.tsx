'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useMotionAllowed } from '@/lib/motion';
import { useIntroDone } from '@/hooks/useIntroDone';

interface SplitTextProps {
  children?: string;
  text?: string;
  className?: string;
  delay?: number;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
}

export default function SplitText({
  children,
  text,
  className = '',
  delay = 0,
  as: Component = 'span',
}: SplitTextProps) {
  const motionAllowed = useMotionAllowed();
  const introDone = useIntroDone();
  const content = text || children || '';
  const words = content.split(' ');

  if (!motionAllowed) {
    return <Component className={className}>{content}</Component>;
  }

  return (
    <Component className={`inline-block ${className}`}>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden align-top mr-[0.25em] last:mr-0">
          <motion.span
            className="inline-block"
            initial={{ y: '110%', opacity: 0 }}
            animate={introDone ? { y: 0, opacity: 1 } : { y: '110%', opacity: 0 }}
            transition={{
              duration: 0.75,
              delay: delay + i * 0.04,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </Component>
  );
}
