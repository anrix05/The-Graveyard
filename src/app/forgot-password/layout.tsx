import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Recover Access Key · Forgot Password',
  description: 'Reset your operative credentials for The Graveyard.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
