'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Check, X, Loader2, User, Sparkles, AlertCircle } from 'lucide-react';
import AuthShell from '@/components/auth/AuthShell';
import { supabase } from '@/lib/supabase';
import { getSafeNext, getSafeIntent, buildPostAuthUrl } from '@/lib/safe-redirect';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const onboardingSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, { message: 'Username must be at least 3 characters.' })
    .max(24, { message: 'Username cannot exceed 24 characters.' })
    .regex(/^[a-z0-9_.]+$/, {
      message: 'Only lowercase letters, numbers, underscores, and dots are allowed.',
    }),
  bio: z.string().max(160, { message: 'Bio cannot exceed 160 characters.' }).optional(),
});

type OnboardingValues = z.infer<typeof onboardingSchema>;

type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

const AVATAR_SEEDS = ['phantom', 'cipher', 'valkyrie', 'nexus', 'oracle', 'specter'];

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const nextParam = searchParams.get('next');
  const intentParam = searchParams.get('intent');
  const safeNext = getSafeNext(nextParam);
  const safeIntent = getSafeIntent(intentParam);

  const [userId, setUserId] = useState<string | null>(null);
  const [selectedAvatarSeed, setSelectedAvatarSeed] = useState(AVATAR_SEEDS[0]);
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formAlert, setFormAlert] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setFocus,
    formState: { errors },
  } = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    mode: 'onChange',
    defaultValues: {
      username: '',
      bio: '',
    },
  });

  const usernameValue = watch('username');

  // Verify auth session on mount & prefill initial username guess if available
  useEffect(() => {
    let isMounted = true;
    const verifyUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (!session?.user) {
        // Not logged in -> send to login
        router.replace(`/login?next=/onboarding`);
        return;
      }

      setUserId(session.user.id);

      // Check existing profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, bio, avatar_url')
        .eq('id', session.user.id)
        .maybeSingle();

      if (!isMounted) return;

      if (profile?.username && (!profile.username.includes('_') || profile.username.length <= 12)) {
        // Already onboarded, continue to destination
        router.replace(buildPostAuthUrl(safeNext, safeIntent));
        return;
      }

      // Prefill suggestion
      const suggestedName =
        typeof session.user.user_metadata?.user_name === 'string'
          ? session.user.user_metadata.user_name.toLowerCase()
          : session.user.email
          ? session.user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_.]/g, '')
          : '';

      if (suggestedName && suggestedName.length >= 3) {
        setValue('username', suggestedName, { shouldValidate: true });
      }
    };

    verifyUser();
    return () => {
      isMounted = false;
    };
  }, [router, safeNext, safeIntent, setValue]);

  // Desktop auto-focus
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      setFocus('username');
    }
  }, [setFocus]);

  // Debounced 400ms uniqueness check
  useEffect(() => {
    if (!usernameValue || usernameValue.length < 3 || !/^[a-z0-9_.]+$/.test(usernameValue)) {
      setUsernameStatus(usernameValue && usernameValue.length > 0 ? 'invalid' : 'idle');
      return;
    }

    setUsernameStatus('checking');
    const timer = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .ilike('username', usernameValue.trim())
          .maybeSingle();

        if (error) {
          setUsernameStatus('available');
          return;
        }

        // If found profile is current user's profile, it's available for them
        if (data && data.id !== userId) {
          setUsernameStatus('taken');
        } else {
          setUsernameStatus('available');
        }
      } catch {
        setUsernameStatus('available');
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [usernameValue, userId]);

  const onSubmit = async (values: OnboardingValues) => {
    if (usernameStatus === 'taken' || usernameStatus === 'checking') {
      return;
    }

    if (!userId) {
      toast.error('Authentication session missing. Please sign in again.');
      router.replace('/login');
      return;
    }

    setIsSubmitting(true);
    setFormAlert(null);

    const avatarUrl = `https://api.dicebear.com/7.x/shapes/svg?seed=${selectedAvatarSeed}`;

    try {
      const { error } = await supabase.from('profiles').upsert({
        id: userId,
        username: values.username.trim().toLowerCase(),
        bio: values.bio?.trim() || null,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        if (error.code === '23505' || error.message.includes('unique')) {
          setUsernameStatus('taken');
          setFormAlert('That username was just taken. Please pick another.');
          return;
        }
        throw error;
      }

      toast.success('Profile created! Welcome to The Graveyard.');
      const destination = buildPostAuthUrl(safeNext, safeIntent);
      router.replace(destination);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not complete onboarding. Please try again.';
      setFormAlert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="space-y-1.5">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-white">
          Claim your username
        </h1>
        <p className="font-sans text-sm text-muted">
          Your public handle on the graveyard for listings, purchases, and collaborator requests.
        </p>
      </div>

      {formAlert && (
        <div
          role="alert"
          className="p-3.5 rounded-xl bg-brand-red/10 border border-brand-red/30 flex items-start gap-2.5 text-brand-red animate-auth-shake"
        >
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
          <p className="text-xs sm:text-sm font-sans leading-relaxed">{formAlert}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {/* Avatar Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-sans font-medium text-fg">
            Choose an avatar
          </label>
          <div className="flex items-center gap-3 overflow-x-auto py-1">
            {AVATAR_SEEDS.map((seed) => {
              const url = `https://api.dicebear.com/7.x/shapes/svg?seed=${seed}`;
              const isSelected = selectedAvatarSeed === seed;
              return (
                <button
                  key={seed}
                  type="button"
                  onClick={() => setSelectedAvatarSeed(seed)}
                  className={cn(
                    'relative w-12 h-12 rounded-full border-2 transition-all p-0.5 shrink-0 focus-visible:outline-2 focus-visible:outline-white',
                    isSelected
                      ? 'border-brand-red ring-2 ring-brand-red/40 scale-105'
                      : 'border-line hover:border-white/40'
                  )}
                  aria-label={`Select avatar ${seed}`}
                >
                  <img src={url} alt={`Avatar style ${seed}`} className="w-full h-full rounded-full bg-surface-2 object-cover" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Username Input with live uniqueness */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="onboarding-username" className="block text-sm font-sans font-medium text-fg">
              Username
            </label>
            <span className="text-xs font-mono text-muted/70">3–24 chars · lowercase</span>
          </div>

          <div className="relative">
            <input
              id="onboarding-username"
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck="false"
              placeholder="e.g. necromancer"
              disabled={isSubmitting}
              aria-invalid={Boolean(errors.username) || usernameStatus === 'taken'}
              aria-describedby="username-status-msg"
              {...register('username')}
              className={cn(
                'h-12 w-full rounded-[12px] border bg-surface-2 pl-4 pr-11 py-2 text-base font-sans text-fg placeholder:text-muted/60 transition-colors',
                errors.username || usernameStatus === 'taken'
                  ? 'border-brand-red focus:border-brand-red'
                  : usernameStatus === 'available'
                  ? 'border-emerald-500 focus:border-emerald-500'
                  : 'border-line hover:border-white/20 focus:border-white',
                'focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2',
                'disabled:cursor-not-allowed disabled:opacity-50'
              )}
            />

            {/* Live Status Icon */}
            <div className="absolute right-3.5 top-3.5 flex items-center pointer-events-none">
              {usernameStatus === 'checking' && (
                <Loader2 className="w-4 h-4 animate-spin text-muted" aria-hidden="true" />
              )}
              {usernameStatus === 'available' && (
                <Check className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              )}
              {usernameStatus === 'taken' && (
                <X className="w-4 h-4 text-brand-red" aria-hidden="true" />
              )}
            </div>
          </div>

          {/* Status Message */}
          <div id="username-status-msg" aria-live="polite" className="pt-0.5">
            {errors.username ? (
              <p className="text-xs text-brand-red font-sans flex items-center gap-1">
                <span>•</span> {errors.username.message}
              </p>
            ) : usernameStatus === 'taken' ? (
              <p className="text-xs text-brand-red font-sans flex items-center gap-1">
                <span>•</span> That username is already taken.
              </p>
            ) : usernameStatus === 'available' ? (
              <p className="text-xs text-emerald-400 font-sans flex items-center gap-1">
                <span>✓</span> Username is available!
              </p>
            ) : null}
          </div>
        </div>

        {/* Bio (Optional) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="onboarding-bio" className="block text-sm font-sans font-medium text-fg">
              Bio <span className="text-muted/60 font-normal">(optional)</span>
            </label>
            <span className="text-xs font-mono text-muted/70">Max 160 chars</span>
          </div>

          <textarea
            id="onboarding-bio"
            rows={3}
            maxLength={160}
            placeholder="Full-stack hacker resurrecting dead side-projects..."
            disabled={isSubmitting}
            {...register('bio')}
            className={cn(
              'w-full rounded-[12px] border border-line bg-surface-2 p-3 text-sm font-sans text-fg placeholder:text-muted/60 transition-colors',
              'hover:border-white/20 focus:border-white focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50 resize-none'
            )}
          />
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting || usernameStatus === 'taken' || usernameStatus === 'checking'}
            className="w-full h-[52px] rounded-full bg-white text-[#0a0a0b] font-semibold text-sm sm:text-base hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2 focus-visible:outline-2 focus-visible:outline-white disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#0a0a0b]" aria-hidden="true" />
                <span>Saving profile...</span>
              </>
            ) : (
              <span>Continue to dashboard</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <>
      <head>
        <title>Setup Profile — The Graveyard</title>
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
          mode="onboarding"
          customHeadline={
            <>
              Enter the graveyard under your{' '}
              <span className="font-accent italic text-[#ff2a2a] font-normal tracking-normal text-[1.12em]">
                own name
              </span>
              .
            </>
          }
        >
          <OnboardingContent />
        </AuthShell>
      </Suspense>
    </>
  );
}
