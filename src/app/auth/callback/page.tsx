'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getSafeNext, getSafeIntent, buildPostAuthUrl } from '@/lib/safe-redirect';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      const errorParam = searchParams.get('error');
      const errorDesc = searchParams.get('error_description');
      const nextParam = searchParams.get('next');
      const intentParam = searchParams.get('intent');
      const codeParam = searchParams.get('code');

      const safeNext = getSafeNext(nextParam);
      const safeIntent = getSafeIntent(intentParam);

      // 1. Handle OAuth Provider Error (e.g. cancelled)
      if (errorParam) {
        let friendlyMessage = 'Sign-in was cancelled.';
        if (errorDesc?.toLowerCase().includes('cancelled') || errorParam === 'access_denied') {
          friendlyMessage = 'Sign-in was cancelled.';
        } else if (errorDesc) {
          friendlyMessage = errorDesc;
        } else {
          friendlyMessage = "Couldn't sign you in. Please try again.";
        }

        const loginRedirect = `/login?error=${encodeURIComponent(friendlyMessage)}&next=${encodeURIComponent(
          safeNext
        )}${safeIntent ? `&intent=${safeIntent}` : ''}`;
        router.replace(loginRedirect);
        return;
      }

      // 2. Exchange authorization code if present
      if (codeParam) {
        try {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(codeParam);
          if (exchangeError) {
            console.error('Code exchange error:', exchangeError);
            const msg = exchangeError.message.includes('identity_already_exists')
              ? 'That email is already used with another sign-in method. Try GitHub or Google.'
              : "Couldn't complete sign-in. Try again.";
            router.replace(`/login?error=${encodeURIComponent(msg)}`);
            return;
          }
        } catch (err: unknown) {
          console.error('Exchange exception:', err);
        }
      }

      // 3. Verify established session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        // Wait briefly for onAuthStateChange if session isn't immediately populated
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, newSession) => {
          if (event === 'SIGNED_IN' && newSession?.user) {
            subscription.unsubscribe();
            await processUserPostAuth(newSession.user);
          }
        });

        // 5s fallback timeout
        setTimeout(() => {
          subscription.unsubscribe();
          setErrorStatus('Session timeout. Redirecting to login...');
          router.replace(`/login?next=${encodeURIComponent(safeNext)}`);
        }, 5000);

        return;
      }

      await processUserPostAuth(session.user);

      async function processUserPostAuth(user: { id: string; email?: string; user_metadata?: Record<string, unknown> }) {
        try {
          // Check profile existence
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, username, github_url')
            .eq('id', user.id)
            .maybeSingle();

          const githubUsername =
            typeof user.user_metadata?.user_name === 'string'
              ? user.user_metadata.user_name
              : typeof user.user_metadata?.preferred_username === 'string'
              ? user.user_metadata.preferred_username
              : null;

          // If GitHub sign in, ensure profile has GitHub details stored
          if (githubUsername) {
            const githubUrl = `https://github.com/${githubUsername}`;
            if (profile && !profile.github_url) {
              await supabase.from('profiles').update({ github_url: githubUrl }).eq('id', user.id);
            }
          }

          // If new profile or needs onboarding (missing username or default placeholder)
          const needsOnboarding =
            !profile ||
            !profile.username ||
            profile.username.includes('_') && profile.username.length > 12;

          if (needsOnboarding) {
            const onboardingUrl = `/onboarding?next=${encodeURIComponent(safeNext)}${
              safeIntent ? `&intent=${safeIntent}` : ''
            }`;
            router.replace(onboardingUrl);
            return;
          }

          // Returning user -> safe next
          const destination = buildPostAuthUrl(safeNext, safeIntent);
          router.replace(destination);
        } catch (err: unknown) {
          console.error('Post-auth profile check error:', err);
          const destination = buildPostAuthUrl(safeNext, safeIntent);
          router.replace(destination);
        }
      }
    };

    handleAuthCallback();
  }, [router, searchParams]);

  return (
    <div className="min-h-dvh bg-[#0a0a0b] flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-brand-red" aria-hidden="true" />
        <div className="space-y-1">
          <p className="font-display font-semibold text-lg text-white">Completing sign-in</p>
          <p className="font-sans text-xs text-muted">
            {errorStatus || 'Verifying credentials and preparing your dashboard...'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh bg-[#0a0a0b] flex items-center justify-center text-muted font-sans text-xs">
          Loading...
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
