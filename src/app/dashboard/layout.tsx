import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Operative Console · Dashboard',
  description: 'Manage your listed codebases, acquired projects, vault keys, and transmissions.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
