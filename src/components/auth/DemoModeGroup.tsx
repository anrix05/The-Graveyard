'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Tag, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { getSafeNext, getSafeIntent, buildPostAuthUrl } from '@/lib/safe-redirect';

export interface DemoModeGroupProps {
  nextParam?: string | null;
  intentParam?: string | null;
  disabled?: boolean;
}

export default function DemoModeGroup({ nextParam, intentParam, disabled = false }: DemoModeGroupProps) {
  const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
  const router = useRouter();
  const [loadingRole, setLoadingRole] = useState<'buyer' | 'seller' | null>(null);

  if (!isDemo) {
    return null;
  }

  const handleDemoLogin = async (role: 'buyer' | 'seller') => {
    setLoadingRole(role);
    try {
      const res = await fetch(`/api/demo-login?role=${role}`);
      if (!res.ok) {
        throw new Error('Failed to retrieve demo credentials.');
      }
      const data = await res.json();
      if (!data.email || !data.password) {
        throw new Error('Invalid demo credentials returned.');
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        throw error;
      }

      toast.success(`Logged in as demo ${role}.`);
      const targetUrl = buildPostAuthUrl(getSafeNext(nextParam), getSafeIntent(intentParam));
      router.push(targetUrl);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Demo sign-in failed.';
      toast.error(msg);
      setLoadingRole(null);
    }
  };

  const isBusy = disabled || loadingRole !== null;

  return (
    <div className="w-full pt-6 mt-6 border-t border-line/60 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-sans font-medium text-muted uppercase tracking-wider">
          Just exploring?
        </span>
        <span className="text-[11px] font-mono text-muted/60">Sandbox Mode</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* Demo Buyer Button */}
        <button
          type="button"
          disabled={isBusy}
          onClick={() => handleDemoLogin('buyer')}
          className="group flex flex-col items-start p-3 rounded-2xl bg-surface-2 border border-line hover:border-white/20 hover:bg-surface-3 transition-colors text-left focus-visible:outline-2 focus-visible:outline-white disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Try as demo buyer - Pre-filled with sample purchases"
        >
          <div className="flex items-center gap-2 text-white font-sans text-xs font-semibold">
            {loadingRole === 'buyer' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
            ) : (
              <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span>Try as demo buyer</span>
          </div>
          <span className="text-[11px] font-sans text-muted mt-0.5 line-clamp-1">
            Pre-filled with sample purchases
          </span>
        </button>

        {/* Demo Seller Button */}
        <button
          type="button"
          disabled={isBusy}
          onClick={() => handleDemoLogin('seller')}
          className="group flex flex-col items-start p-3 rounded-2xl bg-surface-2 border border-line hover:border-white/20 hover:bg-surface-3 transition-colors text-left focus-visible:outline-2 focus-visible:outline-white disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Try as demo seller - Owns sample listings and sales"
        >
          <div className="flex items-center gap-2 text-white font-sans text-xs font-semibold">
            {loadingRole === 'seller' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#fbbf24]" />
            ) : (
              <Tag className="w-3.5 h-3.5 text-[#fbbf24]" />
            )}
            <span>Try as demo seller</span>
          </div>
          <span className="text-[11px] font-sans text-muted mt-0.5 line-clamp-1">
            Owns sample listings and sales
          </span>
        </button>
      </div>
    </div>
  );
}
