'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, Compass } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Button from '@/components/ui/Button';
import { TombstoneIllustration } from '@/components/ui/EmptyState';

export default function NotFound() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/?q=${encodeURIComponent(query.trim())}`);
    } else {
      router.push('/#marketplace-feed');
    }
  };

  return (
    <div className="min-h-dvh bg-bg text-white flex flex-col">
      <head>
        <title>404 · Sector Empty | The Graveyard</title>
        <meta name="robots" content="noindex, nofollow" />
      </head>
      <Header />
      <main id="main" tabIndex={-1} className="flex-1 flex items-center justify-center p-4 outline-none">
        <div className="max-w-md w-full bg-surface rounded-card border border-line p-8 sm:p-10 text-center flex flex-col items-center shadow-2xl space-y-6">
          <TombstoneIllustration className="w-20 h-20" />

          <div className="space-y-2">
            <span className="font-mono text-xs uppercase tracking-widest text-brand-red block">
              404 · Sector empty
            </span>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold">
              This page is dead.
            </h1>
            <p className="font-serif italic text-base text-muted leading-relaxed max-w-xs mx-auto">
              Nobody resurrected it, or it was purged to the nether.
            </p>
          </div>

          {/* Search Box */}
          <form onSubmit={handleSearch} className="w-full relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search abandoned codebases..."
              aria-label="Search codebases"
              className="w-full h-11 pl-10 pr-4 rounded-full bg-surface-2 border border-line text-sm text-white placeholder:text-muted focus:outline-none focus:border-brand-red transition-colors"
            />
            <Search className="w-4 h-4 text-muted absolute left-3.5 top-3.5 pointer-events-none" />
          </form>

          {/* Two Actions: Back to Home + Browse Projects */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
            <Link href="/" className="w-full sm:flex-1">
              <Button
                variant="primary"
                mode="brand"
                size="md"
                className="w-full"
                leftIcon={<ArrowLeft className="w-4 h-4" />}
              >
                Back to home
              </Button>
            </Link>
            <Link href="/#marketplace-feed" className="w-full sm:flex-1">
              <Button
                variant="secondary"
                size="md"
                className="w-full"
                leftIcon={<Compass className="w-4 h-4" />}
              >
                Browse projects
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
