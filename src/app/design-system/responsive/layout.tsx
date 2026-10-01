import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Responsive Preview Tool',
  description: 'Device viewport simulator for testing responsiveness.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ResponsiveLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
