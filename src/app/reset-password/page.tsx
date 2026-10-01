'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Eye, EyeOff, AlertCircle, AlertTriangle, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';
import AuthShell from '@/components/auth/AuthShell';
import PasswordStrengthMeter from '@/components/auth/PasswordStrengthMeter';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
    confirmPassword: z.string().min(1, { message: 'Please confirm your password.' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ['confirmPassword'],
  });

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

function ResetPasswordContent() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formAlert, setFormAlert] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSessionValid, setIsSessionValid] = useState<boolean | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setFocus,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const passwordValue = watch('password') || '';

  // Check for active recovery session on mount
  useEffect(() => {
    let isMounted = true;
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (session) {
        setIsSessionValid(true);
      } else {
        // Wait briefly for onAuthStateChange in case hash tokens are processing
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((event, newSession) => {
          if (newSession) {
            setIsSessionValid(true);
            subscription.unsubscribe();
          }
        });

        // 3-second grace period for token exchange
        setTimeout(() => {
          if (isMounted) {
            setIsSessionValid((prev) => (prev !== null ? prev : false));
            subscription.unsubscribe();
          }
        }, 3000);
      }
    };

    checkSession();
    return () => {
      isMounted = false;
    };
  }, []);

  // Desktop auto-focus
  useEffect(() => {
    if (isSessionValid && typeof window !== 'undefined' && window.innerWidth >= 1024) {
      setFocus('password');
    }
  }, [isSessionValid, setFocus]);

  const handlePasswordKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (typeof e.getModifierState === 'function') {
      setIsCapsLockOn(e.getModifierState('CapsLock'));
    }
  };

  const onSubmit = async (values: ResetPasswordValues) => {
    setIsSubmitting(true);
    setFormAlert(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: values.password,
      });

      if (error) {
        throw error;
      }

      setIsSuccess(true);
      toast.success('Password updated successfully.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not reset password. Please try again.';
      setFormAlert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Checking session state
  if (isSessionValid === null) {
    return (
      <div className="w-full text-center py-12 space-y-3">
        <Loader2 className="w-6 h-6 animate-spin text-brand-red mx-auto" />
        <p className="font-sans text-xs text-muted">Verifying reset authorization...</p>
      </div>
    );
  }

  // Expired / Invalid recovery link state
  if (!isSessionValid) {
    return (
      <div className="w-full text-center space-y-6 animate-fade-in" role="region" aria-label="Expired Reset Link">
        <div className="w-16 h-16 rounded-full bg-surface-2 border border-brand-red/30 flex items-center justify-center mx-auto text-brand-red">
          <AlertCircle className="w-8 h-8" aria-hidden="true" />
        </div>

        <div className="space-y-2">
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-white tracking-tight">
            Reset link expired
          </h1>
          <p className="font-sans text-sm text-muted max-w-sm mx-auto leading-relaxed">
            This password recovery link is either invalid or has expired. Please request a new link to continue.
          </p>
        </div>

        <div className="pt-2 space-y-3">
          <Link
            href="/forgot-password"
            className="w-full h-[52px] rounded-full bg-white text-[#0a0a0b] font-semibold text-sm sm:text-base hover:bg-neutral-200 transition-colors flex items-center justify-center focus-visible:outline-2 focus-visible:outline-white"
          >
            Request new reset link
          </Link>

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

  // Password reset success state
  if (isSuccess) {
    return (
      <div className="w-full text-center space-y-6 animate-fade-in" role="region" aria-label="Password Reset Complete">
        <div className="w-16 h-16 rounded-full bg-surface-2 border border-line flex items-center justify-center mx-auto text-emerald-400">
          <CheckCircle2 className="w-8 h-8" aria-hidden="true" />
        </div>

        <div className="space-y-2">
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-white tracking-tight">
            Password updated
          </h1>
          <p className="font-sans text-sm text-muted max-w-sm mx-auto leading-relaxed">
            Your password has been reset. You can now sign in with your new credentials.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/login"
            className="w-full h-[52px] rounded-full bg-white text-[#0a0a0b] font-semibold text-sm sm:text-base hover:bg-neutral-200 transition-colors flex items-center justify-center focus-visible:outline-2 focus-visible:outline-white"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  // Main Reset Form
  return (
    <div className="w-full space-y-6">
      <div className="space-y-1.5">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-white">
          Create new password
        </h1>
        <p className="font-sans text-sm text-muted">
          Choose a strong password to protect your account and projects.
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
        {/* New Password */}
        <div className="space-y-1.5">
          <label htmlFor="new-password" className="block text-sm font-sans font-medium text-fg">
            New password
          </label>
          <div className="relative">
            <input
              id="new-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              autoCapitalize="none"
              spellCheck="false"
              placeholder=""
              disabled={isSubmitting}
              onKeyDown={handlePasswordKey}
              onKeyUp={handlePasswordKey}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={
                [
                  errors.password ? 'new-password-error' : null,
                  isCapsLockOn ? 'reset-caps-lock' : null,
                ]
                  .filter(Boolean)
                  .join(' ') || undefined
              }
              {...register('password')}
              className={cn(
                'h-12 w-full rounded-[12px] border bg-surface-2 pl-4 pr-12 py-2 text-base font-sans text-fg transition-colors',
                errors.password
                  ? 'border-brand-red focus:border-brand-red'
                  : 'border-line hover:border-white/20 focus:border-white',
                'focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2',
                'disabled:cursor-not-allowed disabled:opacity-50'
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
              className="absolute right-0 top-0 h-12 w-12 flex items-center justify-center text-muted hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-white rounded-[12px]"
            >
              {showPassword ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
            </button>
          </div>

          {isCapsLockOn && (
            <div id="reset-caps-lock" className="flex items-center gap-1.5 text-xs text-amber-400 font-sans pt-0.5" aria-live="polite">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Caps Lock is on</span>
            </div>
          )}

          {errors.password && (
            <div id="new-password-error" className="flex items-center gap-1.5 text-xs text-brand-red font-sans pt-0.5" aria-live="polite">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{errors.password.message}</span>
            </div>
          )}

          <PasswordStrengthMeter password={passwordValue} />
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <label htmlFor="confirm-password" className="block text-sm font-sans font-medium text-fg">
            Confirm password
          </label>
          <div className="relative">
            <input
              id="confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              autoCapitalize="none"
              spellCheck="false"
              placeholder=""
              disabled={isSubmitting}
              aria-invalid={Boolean(errors.confirmPassword)}
              aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
              {...register('confirmPassword')}
              className={cn(
                'h-12 w-full rounded-[12px] border bg-surface-2 pl-4 pr-12 py-2 text-base font-sans text-fg transition-colors',
                errors.confirmPassword
                  ? 'border-brand-red focus:border-brand-red'
                  : 'border-line hover:border-white/20 focus:border-white',
                'focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2',
                'disabled:cursor-not-allowed disabled:opacity-50'
              )}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              aria-pressed={showConfirmPassword}
              className="absolute right-0 top-0 h-12 w-12 flex items-center justify-center text-muted hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-white rounded-[12px]"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
            </button>
          </div>

          {errors.confirmPassword && (
            <div id="confirm-password-error" className="flex items-center gap-1.5 text-xs text-brand-red font-sans pt-0.5" aria-live="polite">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{errors.confirmPassword.message}</span>
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
                <span>Updating password...</span>
              </>
            ) : (
              <span>Update password</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <>
      <head>
        <title>New Password — The Graveyard</title>
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
          mode="reset"
          customHeadline={
            <>
              Secure your place in the{' '}
              <span className="font-accent italic text-[#ff2a2a] font-normal tracking-normal text-[1.12em]">
                graveyard
              </span>
              .
            </>
          }
        >
          <ResetPasswordContent />
        </AuthShell>
      </Suspense>
    </>
  );
}
