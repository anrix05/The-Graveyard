'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  Share2,
  ArrowRight,
  PlusCircle,
  Eye,
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Button from '@/components/ui/Button';
import CoverArt from '@/components/CoverArt';
import Img from '@/components/ui/Img';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { SITE_URL } from '@/lib/env';
import { track } from '@/lib/analytics';
import { toast } from 'sonner';
import SubmitSuccessLoading from './loading';

function SubmitSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const projectId = searchParams.get('id');

  const [project, setProject] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) {
      router.push('/login?next=/submit');
      return;
    }
    if (!projectId) {
      router.push('/dashboard');
      return;
    }

    const fetchProject = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .maybeSingle();

        if (error || !data) {
          router.push('/dashboard');
          return;
        }

        // Owner check
        if (data.seller_id !== user.id) {
          router.push('/dashboard');
          return;
        }

        setProject(data);

        // De-duplicate analytics tracking
        const sessionKey = `graveyard:tracked:publish:${data.id}`;
        if (!sessionStorage.getItem(sessionKey)) {
          sessionStorage.setItem(sessionKey, 'true');
          track('publish_completed', {
            mode: data.interaction_type || 'buy',
            has_repo: Boolean(data.has_repo),
            has_archive: Boolean(data.has_archive),
          });
        }
      } catch {
        router.push('/dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProject();
  }, [projectId, user, isAuthLoading, router]);

  const projectUrl = `${SITE_URL}/project/${projectId}`;

  const copyLink = () => {
    navigator.clipboard.writeText(projectUrl);
    setIsCopied(true);
    toast.success('Project link copied to clipboard!');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const shareText = encodeURIComponent(
    `I just listed my dormant codebase "${project?.title || 'project'}" on @TheGraveyard to give it a second life. Check it out:`
  );
  const encodedUrl = encodeURIComponent(projectUrl);

  const xShareUrl = `https://twitter.com/intent/tweet?text=${shareText}&url=${encodedUrl}`;
  const linkedInShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
  const whatsAppShareUrl = `https://api.whatsapp.com/send?text=${shareText}%20${encodedUrl}`;

  if (isLoading || isAuthLoading) {
    return (
      <div className="min-h-dvh bg-bg flex flex-col font-sans">
        <Header />
        <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-16 animate-pulse space-y-6">
          <div className="h-8 w-48 bg-surface-2 rounded-full mx-auto" />
          <div className="h-4 w-64 bg-surface-2 rounded-lg mx-auto" />
          <div className="h-64 bg-surface rounded-card border border-line" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="min-h-dvh bg-bg text-fg flex flex-col font-sans">
      <Header />

      <main id="main" tabIndex={-1} className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-12 sm:py-16 space-y-8 outline-none">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-[#39ff14]/10 border border-[#39ff14]/30 flex items-center justify-center mx-auto text-[#39ff14]">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <span className="font-mono text-xs text-[#39ff14] uppercase tracking-widest font-semibold block">
            Transmission Broadcasted
          </span>

          <h1 className="text-3xl sm:text-4xl font-display font-semibold text-white">
            Your project is live!
          </h1>
          <p className="font-sans text-sm text-muted max-w-md mx-auto leading-relaxed">
            "{project.title}" has been listed on the marketplace feed and indexed for resurrectors.
          </p>
        </div>

        {/* Card Preview */}
        <div className="bg-surface rounded-card border border-line p-6 space-y-5 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-20 h-14 rounded-lg bg-surface-2 border border-line overflow-hidden shrink-0 relative">
              {project.cover_url ? (
                <Img
                  src={project.cover_url}
                  alt={`${project.title} cover image`}
                  fill
                  sizes="80px"
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <CoverArt title={project.title} id={project.id} />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="font-display font-semibold text-base text-white truncate">
                {project.title}
              </h2>
              <p className="font-sans text-xs text-muted truncate mt-0.5">
                {project.tagline || 'Ready for second life.'}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-surface-2 border border-line text-white">
                  {project.interaction_type === 'buy' ? 'For Sale' : project.interaction_type === 'adopt' ? 'Free Fork' : 'Seeking Partner'}
                </span>
              </div>
            </div>
          </div>

          {/* Share links */}
          <div className="pt-4 border-t border-line space-y-3">
            <span className="font-mono text-xs uppercase tracking-wider text-muted font-semibold block">
              Share your listing
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={copyLink}
                leftIcon={isCopied ? <Check className="w-3.5 h-3.5 text-[#39ff14]" /> : <Copy className="w-3.5 h-3.5" />}
              >
                {isCopied ? 'Link Copied' : 'Copy Link'}
              </Button>

              <a href={xShareUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="sm" className="text-xs">
                  Share on X
                </Button>
              </a>

              <a href={linkedInShareUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="sm" className="text-xs">
                  LinkedIn
                </Button>
              </a>

              <a href={whatsAppShareUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="sm" className="text-xs">
                  WhatsApp
                </Button>
              </a>
            </div>
          </div>

          {/* Next Steps List */}
          <div className="pt-4 border-t border-line space-y-3">
            <h3 className="font-mono text-xs uppercase tracking-wider text-muted font-semibold">
              Next steps
            </h3>
            <ul className="space-y-2 text-xs font-sans text-muted leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-[#39ff14]">✓</span>
                <span>Share your listing URL on X, Reddit, or Discord to find interested buyers faster.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#39ff14]">✓</span>
                <span>Upload screenshots or demo GIFs from your dashboard to boost listing conversions.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#39ff14]">✓</span>
                <span>Monitor notifications in your Console for purchase alerts and pitch messages.</span>
              </li>
            </ul>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-line">
            <Link href="/submit">
              <Button variant="ghost" size="sm" leftIcon={<PlusCircle className="w-3.5 h-3.5" />}>
                Submit another
              </Button>
            </Link>

            <Link href={`/project/${project.id}`}>
              <Button variant="primary" mode="brand" size="sm" rightIcon={<Eye className="w-3.5 h-3.5" />}>
                View listing
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function SubmitSuccessPage() {
  return (
    <Suspense fallback={<SubmitSuccessLoading />}>
      <SubmitSuccessContent />
    </Suspense>
  );
}
