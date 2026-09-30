'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Skull,
  Github,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Terminal,
  User,
  AlertTriangle,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, login, loginWithEmail } = useAuth();

  const nextUrl = searchParams.get('next') || '/';
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'signin';

  const [authMode, setAuthMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Onboarding State
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [customUsername, setCustomUsername] = useState('');
  const [bio, setBio] = useState('');
  const [isOnboardingSaving, setIsOnboardingSaving] = useState(false);

  // Demo mode check
  const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  // Rotating value propositions on left panel
  const [valuePropIndex, setValuePropIndex] = useState(0);
  const valueProps = [
    { title: 'Liquid Code Assets', text: 'Resurrect abandoned MVPs, open-source boilerplates, and neglected prototypes.' },
    { title: 'Automated Delivery', text: 'Instant GitHub collaborator invites & cryptographically signed archive downloads.' },
    { title: 'Talent Alignment', text: 'Partner with ambitious builders and co-founders through structured pitches.' },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setValuePropIndex((prev) => (prev + 1) % valueProps.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [valueProps.length]);

  // Check if existing user needs onboarding (auto-generated username)
  useEffect(() => {
    if (user && user.username && user.username.includes('_') && user.username.length > 12) {
      setCustomUsername(user.username.split('_')[0]);
      setShowOnboarding(true);
    } else if (user) {
      router.push(nextUrl);
    }
  }, [user, nextUrl, router]);

  const handleOAuthLogin = async (provider: 'github' | 'google') => {
    setIsLoading(provider);
    setErrorMessage(null);
    try {
      await login(provider);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'OAuth sign-in failed.';
      setErrorMessage(msg);
      toast.error(msg);
      setIsLoading(null);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please provide both email and password.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setIsLoading('email');
    setErrorMessage(null);

    try {
      if (authMode === 'signin') {
        const { error } = await loginWithEmail(email, password);
        if (error) throw error;
        toast.success('Welcome back, Operative.');
        router.push(nextUrl);
      } else {
        // Sign up
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        if (data?.user && !data.session) {
          toast.info('Account created. Please check your email to verify your address.');
        } else {
          toast.success('Account created! Welcome to The Graveyard.');
          setShowOnboarding(true);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsLoading(null);
    }
  };

  const handleDemoLogin = async (role: 'buyer' | 'seller') => {
    setIsLoading(`demo_${role}`);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/demo-login?role=${role}`);
      if (!res.ok) throw new Error('Demo login service unavailable.');

      const creds = await res.json();
      setEmail(creds.email);
      setPassword(creds.password);

      const { error } = await loginWithEmail(creds.email, creds.password);
      if (error) throw error;

      toast.success(`Signed in as demo ${role}.`);
      router.push(nextUrl);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Demo sign-in failed.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsLoading(null);
    }
  };

  const handleSaveOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !customUsername.trim()) return;

    setIsOnboardingSaving(true);
    try {
      const cleanUsername = customUsername.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');

      const { error } = await supabase
        .from('profiles')
        .update({
          username: cleanUsername,
          bio: bio.trim() || null,
        })
        .eq('id', user.id);

      if (error) {
        if (error.code === '23505') {
          toast.error('That operative handle is already taken. Please choose another.');
          setIsOnboardingSaving(false);
          return;
        }
        throw error;
      }

      toast.success(`Operative identity established: @${cleanUsername}`);
      setShowOnboarding(false);
      router.push(nextUrl);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not save profile.';
      toast.error(msg);
    } finally {
      setIsOnboardingSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background Matrix Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />

      {/* Back to Surface Link */}
      <div className="absolute top-6 left-6 z-20">
        <Link href="/" className="font-mono text-xs text-[#9ca3af] hover:text-white flex items-center gap-1.5 transition-colors">
          <span>←</span>
          <span>Surface Feed</span>
        </Link>
      </div>

      {/* Main Two-Panel Layout on Desktop */}
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center relative z-10">
        {/* LEFT PANEL: Brand Visuals & Rotating Value Props (Desktop Only) */}
        <div className="hidden md:flex flex-col justify-between p-8 bg-[#121212]/80 border border-[#2d2d2d] chamfer-12 h-[560px] relative overflow-hidden">
          <div className="space-y-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-[#ff2a2a]/10 border border-[#ff2a2a]/40 flex items-center justify-center text-[#ff2a2a]">
                <Skull className="w-6 h-6" />
              </div>
              <div>
                <span className="font-display font-bold text-xl tracking-wider text-white block">THE GRAVEYARD</span>
                <span className="font-mono text-[10px] text-[#ff2a2a] uppercase tracking-widest">[TERMINAL AUTH]</span>
              </div>
            </div>

            <div className="space-y-2 mt-8">
              <span className="font-mono text-xs uppercase tracking-wider text-[#39ff14]">[MISSION BRIEF]</span>
              <h2 className="font-display text-2xl font-bold text-white leading-snug">
                Where Dormant Codebases Rise Into Working Software.
              </h2>
            </div>
          </div>

          {/* Rotating Value Proposition */}
          <div className="relative z-10 p-4 bg-[#181818] border border-[#2d2d2d] chamfer-6 min-h-[110px] flex flex-col justify-center">
            <span className="font-mono text-[10px] uppercase text-[#9ca3af] tracking-wider block mb-1">
              PROTOCOL // 0{valuePropIndex + 1}
            </span>
            <h4 className="font-display font-semibold text-sm text-white">{valueProps[valuePropIndex].title}</h4>
            <p className="font-sans text-xs text-[#9ca3af] mt-1 leading-relaxed">
              {valueProps[valuePropIndex].text}
            </p>
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-[#9ca3af] pt-4 border-t border-[#2d2d2d]">
            <span>ENCRYPT: AES-256</span>
            <span>AUTH_STATUS: READY</span>
          </div>

          {/* Background Ambient Glow */}
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-[#ff2a2a]/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* RIGHT PANEL: Auth Form Card */}
        <div className="w-full">
          <div className="rounded-[24px] bg-surface border border-line p-6 sm:p-8 flex flex-col shadow-2xl">
            {/* Header inside form */}
            <div className="text-center mb-6">
              <div className="md:hidden flex justify-center mb-3">
                <Skull className="w-8 h-8 text-brand-red" />
              </div>
              <h1 className="font-display text-2xl font-semibold text-white tracking-tight">
                {authMode === 'signin' ? 'Sign in' : 'Create account'}
              </h1>
              <p className="font-sans text-xs text-muted mt-1.5 leading-relaxed">
                {authMode === 'signin'
                  ? 'Access your portfolio, claimed repositories, and operative vault.'
                  : 'Join the developer exchange to buy, claim, and resurrect projects.'}
              </p>
            </div>

            {/* Mode Tabs with Sliding Indicator */}
            <div className="grid grid-cols-2 p-1 bg-surface-2 border border-line rounded-full mb-6 relative">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signin');
                  setErrorMessage(null);
                }}
                className={`relative py-2 text-xs font-sans font-medium rounded-full transition-colors z-10 ${
                  authMode === 'signin' ? 'text-black' : 'text-muted hover:text-white'
                }`}
              >
                {authMode === 'signin' && (
                  <motion.div
                    layoutId="loginTab"
                    className="absolute inset-0 bg-white rounded-full"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
                <span className="relative z-10">Sign in</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signup');
                  setErrorMessage(null);
                }}
                className={`relative py-2 text-xs font-sans font-medium rounded-full transition-colors z-10 ${
                  authMode === 'signup' ? 'text-black' : 'text-muted hover:text-white'
                }`}
              >
                {authMode === 'signup' && (
                  <motion.div
                    layoutId="loginTab"
                    className="absolute inset-0 bg-white rounded-full"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
                <span className="relative z-10">Create account</span>
              </button>
            </div>

              {/* Error Banner */}
              {errorMessage && (
                <div className="mb-4 p-3 bg-[#ff2a2a]/10 border border-[#ff2a2a]/30 rounded text-xs font-sans text-[#ff2a2a] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* OAuth Buttons */}
              <div className="flex flex-col gap-2.5 mb-5">
                <Button
                  variant="secondary"
                  size="md"
                  fullWidth
                  onClick={() => handleOAuthLogin('github')}
                  isLoading={isLoading === 'github'}
                  leftIcon={<Github className="w-4 h-4" />}
                >
                  Continue with GitHub
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  fullWidth
                  onClick={() => handleOAuthLogin('google')}
                  isLoading={isLoading === 'google'}
                  leftIcon={
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .533 5.333.533 12S5.867 24 12.48 24c3.44 0 6.013-1.133 8.053-3.24 2.107-2.187 2.76-5.453 2.76-7.84 0-.787-.067-1.453-.187-1.92h-12.24z" />
                    </svg>
                  }
                >
                  Continue with Google
                </Button>
              </div>

              {/* Divider */}
              <div className="relative flex items-center justify-center my-4">
                <div className="border-t border-[#2d2d2d] w-full" />
                <span className="bg-[#121212] px-3 font-mono text-[11px] text-[#9ca3af] uppercase shrink-0">
                  Or with email
                </span>
              </div>

              {/* Email Form */}
              <form onSubmit={handleEmailAuth} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="font-mono text-xs text-[#ededed] block">Email Address</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="operative@domain.com"
                    autoComplete="email"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-mono text-xs text-[#ededed]">Password</label>
                    {authMode === 'signin' && (
                      <button
                        type="button"
                        onClick={() => toast.info('For this portfolio showcase, password reset sends an email if configured in Supabase.')}
                        className="text-[11px] font-mono text-[#9ca3af] hover:text-white underline"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete={authMode === 'signin' ? 'current-password' : 'new-password'}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-white"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  variant="primary"
                  mode="brand"
                  size="md"
                  fullWidth
                  type="submit"
                  isLoading={isLoading === 'email'}
                >
                  {authMode === 'signin' ? 'Sign In' : 'Create Account'}
                </Button>
              </form>

              {/* DEMO MODE BUTTONS (When NEXT_PUBLIC_DEMO_MODE=true) */}
              {isDemo && (
                <div className="mt-6 pt-5 border-t border-[#2d2d2d] space-y-2.5">
                  <span className="font-mono text-[10px] text-[#fbbf24] uppercase tracking-wider block text-center">
                    [DEMO SECTOR] 1-Click Fast Access
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDemoLogin('buyer')}
                      isLoading={isLoading === 'demo_buyer'}
                    >
                      Try as Demo Buyer
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDemoLogin('seller')}
                      isLoading={isLoading === 'demo_seller'}
                    >
                      Try as Demo Seller
                    </Button>
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>

      {/* FIRST-TIME USER ONBOARDING MODAL */}
      {showOnboarding && (
        <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-[24px] bg-surface border border-line p-6 sm:p-7 space-y-4 shadow-2xl" data-lenis-prevent>
            <div className="flex items-center gap-3 pb-3 border-b border-line">
              <div className="w-9 h-9 rounded-full bg-neon-green/10 border border-neon-green/30 flex items-center justify-center text-neon-green">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-lg text-white">Choose your handle</h3>
                <p className="font-sans text-xs text-muted">Select your unique public developer username</p>
              </div>
            </div>

            <form onSubmit={handleSaveOnboarding} className="space-y-4">
              <div className="space-y-1.5">
                <label className="font-sans text-xs text-fg block font-medium">
                  Username <span className="text-brand-red">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-sm text-muted">@</span>
                  <Input
                    value={customUsername}
                    onChange={(e) => setCustomUsername(e.target.value)}
                    placeholder="cyphernaut"
                    className="pl-8"
                    required
                  />
                </div>
                <p className="font-mono text-[10px] text-muted">Letters, numbers, hyphens and underscores only.</p>
              </div>

              <div className="space-y-1.5">
                <label className="font-sans text-xs text-fg block font-medium">Bio (Optional)</label>
                <Input
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Full-stack engineer, Rust explorer, building SaaS MVPs"
                />
              </div>

              <div className="pt-2">
                <Button variant="primary" mode="buy" size="md" fullWidth type="submit" isLoading={isOnboardingSaving}>
                  Save & continue
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a]" />}>
      <LoginContent />
    </Suspense>
  );
}
