import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Project Live',
  description: 'Your codebase has been successfully listed on The Graveyard.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function SubmitSuccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
