'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

interface TransitionLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: React.ReactNode;
  className?: string;
  projectId?: string;
}

export default function TransitionLink({
  href,
  children,
  className = '',
  onClick,
  ...props
}: TransitionLinkProps) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // If standard browser modifier keys are pressed, let default handle
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
      return;
    }

    e.preventDefault();
    onClick?.(e);

    const tier = typeof document !== 'undefined' ? document.documentElement.dataset.perf : 'high';
    const hasViewTransitions =
      tier === 'high' && typeof document !== 'undefined' && 'startViewTransition' in document;

    if (hasViewTransitions) {
      let transitioned = false;
      const timeoutId = setTimeout(() => {
        if (!transitioned) {
          transitioned = true;
          router.push(href);
        }
      }, 350);

      try {
        const doc = document as unknown as {
          startViewTransition: (cb: () => void) => { finished?: Promise<void> };
        };
        doc.startViewTransition(() => {
          if (!transitioned) {
            transitioned = true;
            clearTimeout(timeoutId);
            router.push(href);
          }
        });
      } catch {
        clearTimeout(timeoutId);
        if (!transitioned) {
          transitioned = true;
          router.push(href);
        }
      }
    } else {
      router.push(href);
    }
  };

  return (
    <a href={href} onClick={handleClick} className={className} {...props}>
      {children}
    </a>
  );
}
