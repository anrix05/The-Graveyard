import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Operative Induction · Onboarding',
  description: 'Setup your handle and credentials on The Graveyard.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
