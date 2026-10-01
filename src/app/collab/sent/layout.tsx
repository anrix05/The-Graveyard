import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Collaboration Pitch Sent',
  description: 'Your application has been delivered to the repository creator.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function CollabSentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
