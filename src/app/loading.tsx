import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 bg-[#0a0a0a]">
      <Loader2 className="w-8 h-8 animate-spin text-[#ff2a2a]" />
      <span className="font-mono text-xs uppercase tracking-widest text-[#9ca3af]">
        Synthesizing telemetry...
      </span>
    </div>
  );
}
