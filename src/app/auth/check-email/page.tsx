'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Mail, ArrowLeft } from 'lucide-react';
import AuthShell from '@/components/auth/AuthShell';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

function CheckEmailContent() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') || '';
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleResend = async () => {
    if (resendCooldown > 0 || !emailParam) return;
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: emailParam,
      });
      if (error) throw error;
      toast.success('Verification link resent.');
      setResendCooldown(30);
    } catch {
      toast.error('Unable to resend email at this time.');
    }
  };

  return (
    <div className="w-full text-center space-y-6 animate-fade-in" role="region" aria-label="Verification Email Notice">
      <div className="w-16 h-16 rounded-full bg-surface-2 border border-line flex items-center justify-center mx-auto text-emerald-400">
        <Mail className="w-8 h-8" aria-hidden="true" />
      </div>

      <div className="space-y-2">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-white tracking-tight">
          Check your email
        </h1>
        <p className="font-sans text-sm text-muted max-w-sm mx-auto leading-relaxed">
          {emailParam ? (
            <>
              We sent a verification link to <span className="font-medium text-white">{emailParam}</span>. Click the link to complete your registration.
            </>
          ) : (
            'We sent a verification link to your email address. Please open it to verify your account.'
          )}
        </p>
      </div>

      <div className="pt-2 space-y-3">
        {emailParam && (
          <button
            type="button"
            disabled={resendCooldown > 0}
            onClick={handleResend}
            className="w-full h-[52px] rounded-full bg-white text-[#0a0a0b] font-semibold text-sm sm:text-base hover:bg-neutral-200 transition-colors focus-visible:outline-2 focus-visible:outline-white disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {resendCooldown > 0 ? `Resend email (${resendCooldown}s)` : 'Resend email'}
          </button>
        )}

        <div>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm font-sans text-muted hover:text-white transition-colors py-2 focus-visible:outline-2 focus-visible:outline-white rounded"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Back to sign in</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CheckEmailPage() {
  return (
    <>
      <head>
        <title>Check Your Email — The Graveyard</title>
        <meta name="robots" content="noindex, nofollow" />
      </head>
      <Suspense
        fallback={
          <div className="min-h-dvh flex items-center justify-center bg-[#0a0a0b] text-muted font-sans text-sm">
            Loading...
          </div>
        }
      >
        <AuthShell
          mode="verify"
          customHeadline={
            <>
              One final step before entering the{' '}
              <span className="font-accent italic text-[#ff2a2a] font-normal tracking-normal text-[1.12em]">
                graveyard
              </span>
              .
            </>
          }
        >
          <CheckEmailContent />
        </AuthShell>
      </Suspense>
    </>
  );
}
