import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import HomeContent from '@/components/home/HomeContent';
import JsonLd from '@/components/seo/JsonLd';
import { SITE_URL, GITHUB_URL, LINKEDIN_URL } from '@/lib/env';

export const metadata: Metadata = {
  title: 'The Graveyard: where dead code gets resurrected',
  description:
    'Buy, adopt or collaborate on abandoned software projects. A marketplace for unfinished code, ready for a second life.',
  alternates: {
    canonical: '/',
  },
};

export default function HomePage() {
  const sameAs = [GITHUB_URL, LINKEDIN_URL].filter(Boolean);

  const websiteLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'The Graveyard',
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/?search={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  const organizationLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'The Graveyard',
    url: SITE_URL,
    logo: `${SITE_URL}/icon-512.png`,
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };

  return (
    <>
      <JsonLd data={[websiteLd, organizationLd]} />
      <Suspense fallback={<div className="min-h-dvh bg-bg" />}>
        <HomeContent />
      </Suspense>
    </>
  );
}
