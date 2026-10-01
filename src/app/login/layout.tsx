import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In · Access Terminal',
  description: 'Enter the graveyard to claim, salvage, or list abandoned codebases.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
