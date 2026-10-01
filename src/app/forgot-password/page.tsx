'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AlertCircle, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';
import AuthShell from '@/components/auth/AuthShell';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const forgotPasswordSchema = z.object({
  email: z.string().trim().email({ message: 'Enter a valid email address.' }),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

function ForgotPasswordContent() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') || '';

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formAlert, setFormAlert] = useState<string | null>(null);
  const [isSent, setIsSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: emailParam },
  });

  // Desktop auto-focus
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      setFocus('email');
    }
  }, [setFocus]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const onSubmit = async (values: ForgotPasswordValues) => {
    setIsSubmitting(true);
    setFormAlert(null);

    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(values.email.trim(), {
        redirectTo: redirectUrl,
      });

      if (error) {
        // Never reveal whether email exists, but handle rate limits
        if (error.message.toLowerCase().includes('rate limit')) {
          setFormAlert('Too many requests. Please wait a few minutes before trying again.');
          return;
        }
      }

      setSentEmail(values.email.trim());
      setIsSent(true);
      setResendCooldown(30);
    } catch {
      // Show generic message regardless to prevent email enumeration
      setSentEmail(values.email.trim());
      setIsSent(true);
      setResendCooldown(30);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || !sentEmail) return;
    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      await supabase.auth.resetPasswordForEmail(sentEmail, {
        redirectTo: redirectUrl,
      });
      toast.success('Reset link resent.');
      setResendCooldown(30);
    } catch {
      toast.error('Unable to resend at this moment.');
    }
  };

  if (isSent) {
    return (
      <div className="w-full text-center space-y-6 animate-fade-in" role="region" aria-label="Reset Link Sent">
        <div className="w-16 h-16 rounded-full bg-surface-2 border border-line flex items-center justify-center mx-auto text-emerald-400">
          <CheckCircle2 className="w-8 h-8" aria-hidden="true" />
        </div>

        <div className="space-y-2">
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-white tracking-tight">
            Check your email
          </h1>
          <p className="font-sans text-sm text-muted max-w-sm mx-auto leading-relaxed">
            If an account exists for <span className="font-medium text-white">{sentEmail}</span>, we&apos;ve sent a password reset link.
          </p>
        </div>

        <div className="pt-2 space-y-3">
          <button
            type="button"
            disabled={resendCooldown > 0}
            onClick={handleResend}
            className="w-full h-[52px] rounded-full bg-white text-[#0a0a0b] font-semibold text-sm sm:text-base hover:bg-neutral-200 transition-colors focus-visible:outline-2 focus-visible:outline-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resendCooldown > 0 ? `Resend link (${resendCooldown}s)` : 'Resend link'}
          </button>

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

  return (
    <div className="w-full space-y-6">
      <div className="space-y-1.5">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-white">
          Reset password
        </h1>
        <p className="font-sans text-sm text-muted">
          Enter the email associated with your account and we&apos;ll send instructions to reset your password.
        </p>
      </div>

      {formAlert && (
        <div
          role="alert"
          className="p-3.5 rounded-xl bg-brand-red/10 border border-brand-red/30 flex items-start gap-2.5 text-brand-red"
        >
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
          <p className="text-xs sm:text-sm font-sans leading-relaxed">{formAlert}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="reset-email" className="block text-sm font-sans font-medium text-fg">
            Email
          </label>
          <input
            id="reset-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck="false"
            placeholder="you@example.com"
            disabled={isSubmitting}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'reset-email-error' : undefined}
            {...register('email')}
            className={cn(
              'h-12 w-full rounded-[12px] border bg-surface-2 px-4 py-2 text-base font-sans text-fg placeholder:text-muted/60 transition-colors',
              errors.email
                ? 'border-brand-red focus:border-brand-red'
                : 'border-line hover:border-white/20 focus:border-white',
              'focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50'
            )}
          />
          {errors.email && (
            <div id="reset-email-error" className="flex items-center gap-1.5 text-xs text-brand-red font-sans pt-0.5" aria-live="polite">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{errors.email.message}</span>
            </div>
          )}
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-[52px] rounded-full bg-white text-[#0a0a0b] font-semibold text-sm sm:text-base hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2 focus-visible:outline-2 focus-visible:outline-white disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#0a0a0b]" aria-hidden="true" />
                <span>Sending link...</span>
              </>
            ) : (
              <span>Send reset link</span>
            )}
          </button>
        </div>
      </form>

      <div className="text-center pt-2">
        <Link
          href="/login"
          className="text-sm font-sans text-muted hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-white rounded"
        >
          Remember your password? <span className="text-white font-medium underline underline-offset-4">Sign in</span>
        </Link>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <>
      <head>
        <title>Reset Password — The Graveyard</title>
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
          mode="forgot"
          customHeadline={
            <>
              Recover your access to the{' '}
              <span className="font-accent italic text-[#ff2a2a] font-normal tracking-normal text-[1.12em]">
                graveyard
              </span>
              .
            </>
          }
        >
          <ForgotPasswordContent />
        </AuthShell>
      </Suspense>
    </>
  );
}
