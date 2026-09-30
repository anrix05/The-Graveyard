'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled app error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-bg text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-surface rounded-card border border-line p-8 sm:p-10 text-center flex flex-col items-center shadow-2xl">
        <div className="w-14 h-14 rounded-full bg-[#ff2a2a]/10 border border-[#ff2a2a]/30 flex items-center justify-center text-[#ff2a2a] mb-4">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <span className="font-mono text-xs uppercase tracking-widest text-[#ff2a2a] mb-2">
          System anomaly
        </span>
        <h2 className="font-display text-2xl font-semibold mb-3">Transmission interrupted</h2>
        <p className="font-sans text-sm text-muted mb-6 leading-relaxed">
          {error.message || 'An unexpected failure occurred while loading this sector.'}
        </p>
        <Button
          variant="primary"
          mode="brand"
          size="md"
          onClick={() => reset()}
          leftIcon={<RefreshCw className="w-4 h-4" />}
        >
          Try again
        </Button>
      </div>
    </div>
  );
}
