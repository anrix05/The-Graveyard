import React from 'react';

export default function ContactLoading() {
  return (
    <div className="min-h-dvh bg-bg text-fg flex flex-col">
      <div className="h-16 border-b border-line animate-pulse" />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-12 sm:py-20 space-y-12 animate-pulse">
        <div className="space-y-4 max-w-xl">
          <div className="h-4 w-28 bg-surface-2 rounded-full" />
          <div className="h-10 w-64 bg-surface-2 rounded-lg" />
          <div className="h-4 w-96 bg-surface-2 rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-48 rounded-card bg-surface border border-line" />
          <div className="h-48 rounded-card bg-surface border border-line" />
          <div className="h-48 rounded-card bg-surface border border-line" />
        </div>
      </main>
    </div>
  );
}
