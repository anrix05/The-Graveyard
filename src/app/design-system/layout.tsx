import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Design System & Component Catalog',
  description: 'Design tokens, primitives, typography, and interactive components for The Graveyard.',
};

export default function DesignSystemLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
