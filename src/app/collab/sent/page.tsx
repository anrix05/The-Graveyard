'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, ArrowRight, Layers, MessageSquare } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Button from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { track } from '@/lib/analytics';

function CollabSentContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project');
  const [projectTitle, setProjectTitle] = useState<string>('the project');

  useEffect(() => {
    if (!projectId) return;

    // Track analytics once
    const sessionKey = `graveyard:tracked:collab:${projectId}`;
    if (!sessionStorage.getItem(sessionKey)) {
      sessionStorage.setItem(sessionKey, 'true');
      track('collab_applied', { project_id: projectId });
    }

    const fetchTitle = async () => {
      try {
        const { data } = await supabase
          .from('projects')
          .select('title')
          .eq('id', projectId)
          .maybeSingle();

        if (data?.title) {
          setProjectTitle(data.title);
        }
      } catch {
        // Fallback
      }
    };

    fetchTitle();
  }, [projectId]);

  return (
    <div className="min-h-dvh bg-bg text-fg flex flex-col font-sans">
      <Header />

      <main id="main" tabIndex={-1} className="flex-1 max-w-xl mx-auto w-full px-4 sm:px-6 py-12 sm:py-20 space-y-8 outline-none">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-[#60a5fa]/10 border border-[#60a5fa]/30 flex items-center justify-center mx-auto text-[#60a5fa]">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <span className="font-mono text-xs text-[#60a5fa] uppercase tracking-widest font-semibold block">
            Application Transmitted
          </span>

          <h1 className="text-3xl sm:text-4xl font-display font-semibold text-white">
            Pitch sent successfully!
          </h1>
          <p className="font-sans text-sm text-muted max-w-md mx-auto leading-relaxed">
            Your collaboration proposal for "{projectTitle}" has been delivered to the repository creator.
          </p>
        </div>

        <div className="bg-surface rounded-card border border-line p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="space-y-3">
            <h2 className="font-mono text-xs uppercase tracking-wider text-muted font-semibold">
              What happens next
            </h2>
            <ol className="space-y-3 font-sans text-xs text-muted leading-relaxed">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-surface-2 border border-line flex items-center justify-center font-mono text-[10px] text-white shrink-0 mt-0.5">
                  1
                </span>
                <span>
                  <strong>Seller review:</strong> The creator receives an immediate notification in their console with your pitch and role interest.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-surface-2 border border-line flex items-center justify-center font-mono text-[10px] text-white shrink-0 mt-0.5">
                  2
                </span>
                <span>
                  <strong>Direct communication:</strong> If your skills match their roadmap, the creator will accept your proposal or message you back.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-surface-2 border border-line flex items-center justify-center font-mono text-[10px] text-white shrink-0 mt-0.5">
                  3
                </span>
                <span>
                  <strong>Check status:</strong> Track pending and accepted applications at any time from your Collabs console.
                </span>
              </li>
            </ol>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-line">
            <Link href="/dashboard?tab=collabs">
              <Button variant="secondary" size="sm" leftIcon={<Layers className="w-3.5 h-3.5" />}>
                View Collabs Console
              </Button>
            </Link>

            <Link href="/">
              <Button variant="primary" mode="brand" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Browse more projects
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function CollabSentPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-bg" />}>
      <CollabSentContent />
    </Suspense>
  );
}
