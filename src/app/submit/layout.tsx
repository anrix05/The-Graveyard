import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'List a Dead Project',
  description: 'Salvage, monetize, or open-source your abandoned code.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function SubmitLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
