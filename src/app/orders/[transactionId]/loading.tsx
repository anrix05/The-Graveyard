import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function OrderLoading() {
  return (
    <div className="min-h-dvh bg-bg flex flex-col font-sans">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-12 animate-pulse space-y-6">
        <div className="h-8 w-48 bg-surface-2 rounded-full mx-auto" />
        <div className="h-4 w-72 bg-surface-2 rounded-lg mx-auto" />
        <div className="h-64 bg-surface rounded-card border border-line" />
      </main>
      <Footer />
    </div>
  );
}
