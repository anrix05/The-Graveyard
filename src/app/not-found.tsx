'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Button from '@/components/ui/Button';
import { TombstoneIllustration } from '@/components/ui/EmptyState';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg text-white flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-surface rounded-card border border-line p-8 sm:p-10 text-center flex flex-col items-center shadow-2xl">
          <div className="mb-6">
            <TombstoneIllustration className="w-20 h-20" />
          </div>
          <span className="font-mono text-xs uppercase tracking-widest text-[#ff2a2a] mb-2">
            404 · Sector empty
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold mb-3">
            This page is dead.
          </h1>
          <p className="font-serif italic text-base text-muted mb-6 max-w-xs leading-relaxed">
            Nobody resurrected it.
          </p>
          <Link href="/">
            <Button variant="primary" mode="brand" size="md" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Return to surface
            </Button>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
