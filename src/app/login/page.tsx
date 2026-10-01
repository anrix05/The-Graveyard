'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Eye,
  EyeOff,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Mail,
  Loader2,
  X,
  Github,
} from 'lucide-react';
import { motion } from 'framer-motion';
import AuthShell from '@/components/auth/AuthShell';
import PasswordStrengthMeter from '@/components/auth/PasswordStrengthMeter';
import DemoModeGroup from '@/components/auth/DemoModeGroup';
import { supabase } from '@/lib/supabase';
import { getSafeNext, getSafeIntent, buildPostAuthUrl } from '@/lib/safe-redirect';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Form Schemas
const signInSchema = z.object({
  email: z.string().trim().email({ message: 'Enter a valid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

const signUpSchema = z.object({
  email: z.string().trim().email({ message: 'Enter a valid email address.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
});

type SignInValues = z.infer<typeof signInSchema>;
type SignUpValues = z.infer<typeof signUpSchema>;

function mapSupabaseAuthError(error: unknown): string {
  if (!error) return 'An unexpected error occurred. Please try again.';
  const msg =
    error instanceof Error
      ? error.message
      : typeof error === 'object' && error !== null && 'message' in error
      ? String((error as { message: unknown }).message)
      : String(error);
  const lower = msg.toLowerCase();

  if (lower.includes('rate limit') || lower.includes('too many') || lower.includes('over_email_send_rate_limit')) {
    return 'Too many attempts. Try again in a few minutes.';
  }
  if (lower.includes('network') || lower.includes('failed to fetch') || lower.includes('connection')) {
    return "Can't reach the server. Check your connection and try again.";
  }
  if (
    lower.includes('different provider') ||
    lower.includes('already registered') ||
    lower.includes('identity_already_exists')
  ) {
    return 'That email is already used with another sign-in method. Try GitHub or Google.';
  }
  if (
    lower.includes('invalid login credentials') ||
    lower.includes('invalid credentials') ||
    lower.includes('user not found') ||
    lower.includes('wrong password')
  ) {
    return 'Email or password is incorrect.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Please confirm your email address before signing in.';
  }
  return 'Email or password is incorrect.';
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const nextParam = searchParams.get('next');
  const intentParam = searchParams.get('intent');
  const modeParam = searchParams.get('mode');
  const errorParam = searchParams.get('error');

  const safeNext = getSafeNext(nextParam);
  const safeIntent = getSafeIntent(intentParam);
  const postAuthUrl = buildPostAuthUrl(safeNext, safeIntent);

  // Tab State: default to signup if ?mode=signup or ?intent=signup
  const initialMode = modeParam === 'signup' || intentParam === 'signup' ? 'signup' : 'signin';
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>(initialMode);

  // Password visibility & Caps Lock
  const [showPassword, setShowPassword] = useState(false);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);

  // Form loading & feedback states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'github' | 'google' | null>(null);
  const [magicLinkLoading, setMagicLinkLoading] = useState(false);
  const [formAlert, setFormAlert] = useState<string | null>(null);

  // Success states
  const [signUpSuccessEmail, setSignUpSuccessEmail] = useState<string | null>(null);
  const [magicLinkSentEmail, setMagicLinkSentEmail] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Active form setup
  const currentSchema = authMode === 'signup' ? signUpSchema : signInSchema;
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    setFocus,
    formState: { errors },
  } = useForm<SignInValues | SignUpValues>({
    resolver: zodResolver(currentSchema),
    mode: 'onBlur',
    defaultValues: { email: '', password: '' },
  });

  const emailValue = watch('email');
  const passwordValue = watch('password') || '';

  // Initial error from URL query
  useEffect(() => {
    if (errorParam) {
      if (errorParam === 'cancelled' || errorParam.includes('cancel')) {
        setFormAlert('Sign-in was cancelled.');
      } else {
        setFormAlert(decodeURIComponent(errorParam));
      }
    }
  }, [errorParam]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Focus first invalid input on validation failure
  const onInvalidSubmit = () => {
    if (errors.email) {
      setFocus('email');
    } else if (errors.password) {
      setFocus('password');
    }
  };

  // Sync mode changes to URL without scroll jump
  const handleModeChange = (newMode: 'signin' | 'signup') => {
    if (newMode === authMode) return;
    setAuthMode(newMode);
    setFormAlert(null);
    setShowPassword(false);
    // Keep email, reset password and validation errors
    const currentEmail = emailValue;
    reset({ email: currentEmail, password: '' });

    const params = new URLSearchParams(searchParams.toString());
    params.set('mode', newMode);
    router.replace(`/login?${params.toString()}`, { scroll: false });
  };

  // Detect Caps Lock
  const handlePasswordKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (typeof e.getModifierState === 'function') {
      setIsCapsLockOn(e.getModifierState('CapsLock'));
    }
  };

  // OAuth Sign In
  const handleOAuth = async (provider: 'github' | 'google') => {
    setOauthLoading(provider);
    setFormAlert(null);
    try {
      const redirectUrl = `${window.location.origin}/auth/callback?next=${encodeURIComponent(
        safeNext
      )}${safeIntent ? `&intent=${safeIntent}` : ''}`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) {
        throw error;
      }
    } catch (err: unknown) {
      const msg = mapSupabaseAuthError(err);
      setFormAlert(msg);
      toast.error(msg);
      setOauthLoading(null);
    }
  };

  // Magic Link Sign In
  const handleMagicLink = async () => {
    if (!emailValue || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue.trim())) {
      setFormAlert('Enter a valid email address to receive a sign-in link.');
      setFocus('email');
      return;
    }

    setMagicLinkLoading(true);
    setFormAlert(null);
    try {
      const redirectUrl = `${window.location.origin}/auth/callback?next=${encodeURIComponent(
        safeNext
      )}${safeIntent ? `&intent=${safeIntent}` : ''}`;

      const { error } = await supabase.auth.signInWithOtp({
        email: emailValue.trim(),
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) throw error;

      setMagicLinkSentEmail(emailValue.trim());
      setResendCooldown(30);
    } catch (err: unknown) {
      const msg = mapSupabaseAuthError(err);
      setFormAlert(msg);
      toast.error(msg);
    } finally {
      setMagicLinkLoading(false);
    }
  };

  // Resend Verification Email
  const handleResendVerification = async () => {
    if (resendCooldown > 0 || !signUpSuccessEmail) return;
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: signUpSuccessEmail,
      });
      if (error) throw error;
      toast.success('Verification link resent.');
      setResendCooldown(30);
    } catch {
      toast.error('Unable to resend at this moment. Try again shortly.');
    }
  };

  // Main Email Form Submit
  const onSubmit = async (values: SignInValues | SignUpValues) => {
    setIsSubmitting(true);
    setFormAlert(null);

    try {
      if (authMode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({
          email: values.email.trim(),
          password: values.password,
        });

        if (error) {
          throw error;
        }

        toast.success('Welcome back!');
        router.push(postAuthUrl);
      } else {
        // Sign Up Flow
        const { data, error } = await supabase.auth.signUp({
          email: values.email.trim(),
          password: values.password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
              safeNext
            )}${safeIntent ? `&intent=${safeIntent}` : ''}`,
          },
        });

        if (error) {
          throw error;
        }

        // If email confirmation is disabled, user is immediately signed in
        if (data.session) {
          toast.success('Account created successfully!');
          router.push(`/onboarding?next=${encodeURIComponent(safeNext)}${safeIntent ? `&intent=${safeIntent}` : ''}`);
        } else {
          // Confirmation required
          setSignUpSuccessEmail(values.email.trim());
          setResendCooldown(30);
        }
      }
    } catch (err: unknown) {
      const friendlyMsg = mapSupabaseAuthError(err);
      setFormAlert(friendlyMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isBusy = isSubmitting || oauthLoading !== null || magicLinkLoading;

  // =========================================================================
  // STATE 1: CHECK YOUR EMAIL (SIGN-UP CONFIRMATION)
  // =========================================================================
  if (signUpSuccessEmail) {
    return (
      <div className="w-full text-center space-y-6 animate-fade-in" role="region" aria-label="Email Confirmation Required">
        <div className="w-16 h-16 rounded-full bg-surface-2 border border-line flex items-center justify-center mx-auto text-emerald-400">
          <Mail className="w-8 h-8" aria-hidden="true" />
        </div>

        <div className="space-y-2">
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-white tracking-tight">
            Check your email
          </h1>
          <p className="font-sans text-sm text-muted max-w-sm mx-auto leading-relaxed">
            We sent a verification link to{' '}
            <span className="font-medium text-white">{signUpSuccessEmail}</span>. Click the link to complete your registration.
          </p>
        </div>

        <div className="pt-2 space-y-3">
          <button
            type="button"
            disabled={resendCooldown > 0}
            onClick={handleResendVerification}
            className="w-full h-[52px] rounded-full bg-white text-[#0a0a0b] font-semibold text-sm sm:text-base hover:bg-neutral-200 transition-colors focus-visible:outline-2 focus-visible:outline-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resendCooldown > 0 ? `Resend email (${resendCooldown}s)` : 'Resend email'}
          </button>

          <button
            type="button"
            onClick={() => {
              setSignUpSuccessEmail(null);
              reset();
            }}
            className="text-sm font-sans text-muted hover:text-white transition-colors py-2 focus-visible:outline-2 focus-visible:outline-white rounded"
          >
            Use a different email
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // STATE 2: MAGIC LINK SENT
  // =========================================================================
  if (magicLinkSentEmail) {
    return (
      <div className="w-full text-center space-y-6 animate-fade-in" role="region" aria-label="Magic Link Sent">
        <div className="w-16 h-16 rounded-full bg-surface-2 border border-line flex items-center justify-center mx-auto text-sky-400">
          <CheckCircle2 className="w-8 h-8" aria-hidden="true" />
        </div>

        <div className="space-y-2">
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-white tracking-tight">
            Sign-in link sent
          </h1>
          <p className="font-sans text-sm text-muted max-w-sm mx-auto leading-relaxed">
            We emailed a direct sign-in link to{' '}
            <span className="font-medium text-white">{magicLinkSentEmail}</span>.
          </p>
        </div>

        <div className="pt-2 space-y-3">
          <button
            type="button"
            onClick={() => setMagicLinkSentEmail(null)}
            className="w-full h-[52px] rounded-full bg-surface-2 border border-line text-white font-semibold text-sm sm:text-base hover:bg-surface-3 transition-colors focus-visible:outline-2 focus-visible:outline-white"
          >
            Return to password sign-in
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // STATE 3: AUTH FORM (SIGN IN / CREATE ACCOUNT)
  // =========================================================================
  return (
    <div className="w-full space-y-6">
      {/* Title & Subtitle */}
      <div className="space-y-1.5">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-white">
          {authMode === 'signin' ? 'Welcome back' : 'Create your account'}
        </h1>
        <p className="font-sans text-sm text-muted">
          {authMode === 'signin'
            ? 'Sign in to manage your listings, downloads and messages.'
            : 'Join to list dead projects, claim free forks and find partners.'}
        </p>
      </div>

      {/* Accessible Tab List (Sign in | Create account) */}
      <div
        role="tablist"
        aria-label="Authentication Options"
        className="relative grid grid-cols-2 p-1 rounded-full bg-surface-2 border border-line"
      >
        <button
          type="button"
          role="tab"
          id="tab-signin"
          aria-selected={authMode === 'signin'}
          aria-controls="panel-auth"
          tabIndex={authMode === 'signin' ? 0 : -1}
          onClick={() => handleModeChange('signin')}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
              handleModeChange('signup');
              const nextEl = document.getElementById('tab-signup');
              nextEl?.focus();
            }
          }}
          className={cn(
            'relative z-10 h-10 rounded-full text-sm font-sans font-medium transition-colors focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2',
            authMode === 'signin' ? 'text-[#0a0a0b] font-semibold' : 'text-muted hover:text-white'
          )}
        >
          {authMode === 'signin' && (
            <motion.div
              layoutId="auth-tab-pill"
              className="absolute inset-0 bg-white rounded-full -z-10 shadow-sm"
              transition={{ type: 'spring', stiffness: 450, damping: 35 }}
            />
          )}
          Sign in
        </button>

        <button
          type="button"
          role="tab"
          id="tab-signup"
          aria-selected={authMode === 'signup'}
          aria-controls="panel-auth"
          tabIndex={authMode === 'signup' ? 0 : -1}
          onClick={() => handleModeChange('signup')}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
              handleModeChange('signin');
              const prevEl = document.getElementById('tab-signin');
              prevEl?.focus();
            }
          }}
          className={cn(
            'relative z-10 h-10 rounded-full text-sm font-sans font-medium transition-colors focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2',
            authMode === 'signup' ? 'text-[#0a0a0b] font-semibold' : 'text-muted hover:text-white'
          )}
        >
          {authMode === 'signup' && (
            <motion.div
              layoutId="auth-tab-pill"
              className="absolute inset-0 bg-white rounded-full -z-10 shadow-sm"
              transition={{ type: 'spring', stiffness: 450, damping: 35 }}
            />
          )}
          Create account
        </button>
      </div>

      {/* Inline Form Error Alert */}
      {formAlert && (
        <div
          role="alert"
          className="p-3.5 rounded-xl bg-brand-red/10 border border-brand-red/30 flex items-start justify-between gap-3 text-brand-red animate-auth-shake"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
            <p className="text-xs sm:text-sm font-sans leading-relaxed">{formAlert}</p>
          </div>
          <button
            type="button"
            onClick={() => setFormAlert(null)}
            className="text-brand-red/80 hover:text-brand-red p-0.5 rounded focus-visible:outline-2 focus-visible:outline-brand-red"
            aria-label="Dismiss alert"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* OAuth Buttons */}
      <div className="space-y-3">
        {/* GitHub OAuth Button */}
        <button
          type="button"
          disabled={isBusy}
          onClick={() => handleOAuth('github')}
          className="w-full h-[52px] rounded-full bg-surface-2 border border-line hover:border-white/20 hover:bg-surface-3 transition-colors flex items-center justify-center gap-3 text-white font-sans text-sm sm:text-base font-medium focus-visible:outline-2 focus-visible:outline-white disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Continue with GitHub"
        >
          {oauthLoading === 'github' ? (
            <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
          ) : (
            <Github className="w-5 h-5" aria-hidden="true" />
          )}
          <span>Continue with GitHub</span>
        </button>

        {/* Google OAuth Button */}
        <button
          type="button"
          disabled={isBusy}
          onClick={() => handleOAuth('google')}
          className="w-full h-[52px] rounded-full bg-surface-2 border border-line hover:border-white/20 hover:bg-surface-3 transition-colors flex items-center justify-center gap-3 text-white font-sans text-sm sm:text-base font-medium focus-visible:outline-2 focus-visible:outline-white disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Continue with Google"
        >
          {oauthLoading === 'google' ? (
            <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#EA4335"
                d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
              />
              <path
                fill="#FBBC05"
                d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 10.8 0 12s.7 2.3 1.9 4.7l3.7-1.9z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z"
              />
            </svg>
          )}
          <span>Continue with Google</span>
        </button>
      </div>

      {/* Centered Rule Divider */}
      <div className="flex items-center gap-4 my-6">
        <div className="h-[1px] flex-1 bg-line" aria-hidden="true" />
        <span className="font-mono text-xs text-muted/70 uppercase tracking-widest text-center select-none">
          or continue with email
        </span>
        <div className="h-[1px] flex-1 bg-line" aria-hidden="true" />
      </div>

      {/* Main Email Form */}
      <form
        id="panel-auth"
        role="tabpanel"
        aria-labelledby={`tab-${authMode}`}
        onSubmit={handleSubmit(onSubmit, onInvalidSubmit)}
        noValidate
        aria-busy={isBusy}
        className="space-y-4"
      >
        {/* Email Field */}
        <div className="space-y-1.5">
          <label htmlFor="auth-email" className="block text-sm font-sans font-medium text-fg">
            Email
          </label>
          <input
            id="auth-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck="false"
            placeholder="you@example.com"
            disabled={isBusy}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'auth-email-error' : undefined}
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
            <div id="auth-email-error" className="flex items-center gap-1.5 text-xs text-brand-red font-sans pt-0.5" aria-live="polite">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{errors.email.message}</span>
            </div>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="auth-password" className="block text-sm font-sans font-medium text-fg">
              Password
            </label>
            {authMode === 'signin' && (
              <Link
                href="/forgot-password"
                className="text-xs font-sans text-muted hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-white rounded"
              >
                Forgot password?
              </Link>
            )}
          </div>

          <div className="relative">
            <input
              id="auth-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
              autoCapitalize="none"
              spellCheck="false"
              placeholder=""
              disabled={isBusy}
              onKeyDown={handlePasswordKey}
              onKeyUp={handlePasswordKey}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={
                [
                  errors.password ? 'auth-password-error' : null,
                  isCapsLockOn ? 'auth-caps-lock' : null,
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

            {/* Show/Hide Password Toggle (44px hit target) */}
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
              className="absolute right-0 top-0 h-12 w-12 flex items-center justify-center text-muted hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-white rounded-[12px]"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Eye className="w-4 h-4" aria-hidden="true" />
              )}
            </button>
          </div>

          {/* Caps Lock Warning */}
          {isCapsLockOn && (
            <div id="auth-caps-lock" className="flex items-center gap-1.5 text-xs text-amber-400 font-sans pt-0.5" aria-live="polite">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Caps Lock is on</span>
            </div>
          )}

          {/* Password Validation Error */}
          {errors.password && (
            <div id="auth-password-error" className="flex items-center gap-1.5 text-xs text-brand-red font-sans pt-0.5" aria-live="polite">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{errors.password.message}</span>
            </div>
          )}

          {/* Password Strength Meter on Sign Up */}
          {authMode === 'signup' && <PasswordStrengthMeter password={passwordValue} />}
        </div>

        {/* Primary Submit Button (White pill, 52px high) */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isBusy}
            className="w-full h-[52px] rounded-full bg-white text-[#0a0a0b] font-semibold text-sm sm:text-base hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2 focus-visible:outline-2 focus-visible:outline-white disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#0a0a0b]" aria-hidden="true" />
                <span>{authMode === 'signin' ? 'Signing in...' : 'Creating account...'}</span>
              </>
            ) : (
              <span>{authMode === 'signin' ? 'Sign in' : 'Create account'}</span>
            )}
          </button>
        </div>

        {/* Magic Link Option */}
        <div className="pt-1 text-center">
          <button
            type="button"
            disabled={isBusy}
            onClick={handleMagicLink}
            className="text-xs sm:text-sm font-sans text-muted hover:text-white transition-colors py-1.5 px-3 rounded-full hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-white disabled:opacity-50"
          >
            {magicLinkLoading ? 'Sending sign-in link...' : 'Email me a sign-in link instead'}
          </button>
        </div>
      </form>

      {/* Secondary Mode Switch Link */}
      <div className="text-center text-sm font-sans text-muted">
        {authMode === 'signin' ? (
          <>
            Don&apos;t have an account?{' '}
            <button
              type="button"
              onClick={() => handleModeChange('signup')}
              className="text-white font-medium hover:underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-white rounded"
            >
              Sign up
            </button>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => handleModeChange('signin')}
              className="text-white font-medium hover:underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-white rounded"
            >
              Sign in
            </button>
          </>
        )}
      </div>

      {/* Legal Note */}
      <p className="text-xs font-sans text-muted/70 text-center leading-relaxed">
        By continuing you agree to our{' '}
        <Link href="/terms" className="text-muted hover:text-white underline underline-offset-2 transition-colors">
          Terms
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="text-muted hover:text-white underline underline-offset-2 transition-colors">
          Privacy Policy
        </Link>
        .
      </p>

      {/* Demo Mode Group (Workstream E) */}
      <DemoModeGroup nextParam={nextParam} intentParam={intentParam} disabled={isBusy} />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh flex items-center justify-center bg-[#0a0a0b] text-muted font-sans text-sm">
          Loading authentication...
        </div>
      }
    >
      <AuthShell mode="signin">
        <LoginContent />
      </AuthShell>
    </Suspense>
  );
}
