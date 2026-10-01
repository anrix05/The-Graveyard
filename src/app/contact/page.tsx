'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Mail,
  Github,
  Flag,
  Copy,
  Check,
  ExternalLink,
  MessageSquare,
  Clock,
  MapPin,
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Button from '@/components/ui/Button';
import { CONTACT_EMAIL, GITHUB_URL, SITE_URL } from '@/lib/env';
import { toast } from 'sonner';

function ContactContent() {
  const searchParams = useSearchParams();
  const listingId = searchParams.get('listing');
  const [copiedEmail, setCopiedEmail] = useState(false);

  const hasEmail = Boolean(CONTACT_EMAIL);
  const issuesUrl = GITHUB_URL.includes('github.com')
    ? `${GITHUB_URL.replace(/\/$/, '')}/issues`
    : GITHUB_URL;

  const copyEmail = () => {
    if (!CONTACT_EMAIL) return;
    navigator.clipboard.writeText(CONTACT_EMAIL);
    setCopiedEmail(true);
    toast.success('Contact email copied!');
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const reportSubject = encodeURIComponent(
    listingId ? `[Takedown / Report] Listing ${listingId}` : '[Takedown / Report] Codebase Issue'
  );
  const reportBody = encodeURIComponent(
    listingId
      ? `Hello The Graveyard Support,\n\nI wish to report an issue regarding the listing below:\nURL: ${SITE_URL}/project/${listingId}\n\nReason for report:\n[Please specify: e.g. Copyright infringement, Malicious code, Inaccurate ownership, etc.]\n\nSupporting details / Original link:\n\nThank you.`
      : `Hello The Graveyard Support,\n\nI wish to report an issue:\nListing URL:\n\nReason:\n`
  );

  const reportMailto = `mailto:${CONTACT_EMAIL || 'support@graveyard.dev'}?subject=${reportSubject}&body=${reportBody}`;

  return (
    <div className="min-h-dvh bg-bg text-fg flex flex-col font-sans pt-[var(--header-h)]">
      <Header />

      <main id="main" tabIndex={-1} className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-12 sm:py-20 space-y-12 outline-none">
        {/* Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="font-mono text-xs uppercase tracking-widest text-brand-red font-semibold">
            Communication Channel
          </span>
          <h1 className="text-3xl sm:text-5xl font-display font-semibold text-white tracking-tight">
            Contact &amp; Support
          </h1>
          <p className="font-sans text-sm sm:text-base text-muted leading-relaxed">
            Have questions about a codebase, want to report an issue, or need help with a transaction? Reach out to the maintainers directly.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2 font-mono text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#39ff14]" />
              Response: Usually within 2 business days
            </span>
            <span className="text-line">•</span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-brand-red" />
              Based in India
            </span>
          </div>
        </div>

        {/* 3 Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Direct Email (shown if email env var present) */}
          {hasEmail ? (
            <div className="p-6 rounded-card bg-surface border border-line flex flex-col justify-between space-y-5 shadow-lg">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-surface-2 border border-line flex items-center justify-center text-white">
                  <Mail className="w-5 h-5 text-brand-red" />
                </div>
                <h2 className="font-display font-semibold text-lg text-white">
                  Direct Email
                </h2>
                <p className="font-sans text-xs text-muted leading-relaxed">
                  General inquiries, partnerships, and technical questions about the marketplace.
                </p>
                <div className="p-2.5 bg-surface-2 rounded-xl border border-line/60 font-mono text-xs text-white truncate">
                  {CONTACT_EMAIL}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-line">
                <a href={`mailto:${CONTACT_EMAIL}`} className="flex-1">
                  <Button variant="primary" mode="brand" size="sm" fullWidth>
                    Send Email
                  </Button>
                </a>
                <button
                  type="button"
                  onClick={copyEmail}
                  className="p-2 rounded-xl border border-line bg-surface-2 text-muted hover:text-white transition-colors"
                  title="Copy email address"
                  aria-label="Copy email address"
                >
                  {copiedEmail ? <Check className="w-4 h-4 text-[#39ff14]" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-card bg-surface border border-line flex flex-col justify-between space-y-5 shadow-lg">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-surface-2 border border-line flex items-center justify-center text-white">
                  <Github className="w-5 h-5" />
                </div>
                <h2 className="font-display font-semibold text-lg text-white">
                  Developer Inquiries
                </h2>
                <p className="font-sans text-xs text-muted leading-relaxed">
                  Direct inquiries are managed via our open GitHub repository issues.
                </p>
              </div>
              <a href={issuesUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="primary" mode="brand" size="sm" fullWidth rightIcon={<ExternalLink className="w-3.5 h-3.5" />}>
                  Open an Issue
                </Button>
              </a>
            </div>
          )}

          {/* Card 2: GitHub Repository */}
          <div className="p-6 rounded-card bg-surface border border-line flex flex-col justify-between space-y-5 shadow-lg">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-surface-2 border border-line flex items-center justify-center text-white">
                <Github className="w-5 h-5 text-white" />
              </div>
              <h2 className="font-display font-semibold text-lg text-white">
                GitHub Repository
              </h2>
              <p className="font-sans text-xs text-muted leading-relaxed">
                Source code, public roadmap, documentation improvements, and bug reporting.
              </p>
              <div className="p-2.5 bg-surface-2 rounded-xl border border-line/60 font-mono text-xs text-white truncate">
                {GITHUB_URL.replace('https://', '')}
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-line">
              <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
                <Button variant="secondary" size="sm" fullWidth rightIcon={<ExternalLink className="w-3.5 h-3.5" />}>
                  View Repository
                </Button>
              </a>
              <a href={issuesUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="sm" fullWidth className="text-xs text-muted hover:text-white">
                  Report a bug
                </Button>
              </a>
            </div>
          </div>

          {/* Card 3: Report a Listing */}
          <div className="p-6 rounded-card bg-surface border border-line flex flex-col justify-between space-y-5 shadow-lg">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-surface-2 border border-line flex items-center justify-center text-white">
                <Flag className="w-5 h-5 text-amber" />
              </div>
              <h2 className="font-display font-semibold text-lg text-white">
                Report a Listing
              </h2>
              <p className="font-sans text-xs text-muted leading-relaxed">
                Found copyrighted code uploaded without authorization, malware, or fraudulent metrics? Let us know for immediate takedown review.
              </p>
              {listingId && (
                <div className="p-2 bg-amber/10 border border-amber/30 rounded-lg text-amber font-mono text-[11px] truncate">
                  Reporting: {listingId}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-line">
              <a href={reportMailto}>
                <Button variant="secondary" size="sm" fullWidth leftIcon={<Flag className="w-3.5 h-3.5 text-amber" />}>
                  Dispatch Report
                </Button>
              </a>
            </div>
          </div>
        </div>

        {/* Footer Guidance Note */}
        <div className="p-5 rounded-2xl bg-surface-2/50 border border-line/60 text-center max-w-xl mx-auto space-y-1.5">
          <span className="font-mono text-xs text-white font-medium block">
            Looking to negotiate on a specific project?
          </span>
          <p className="font-sans text-xs text-muted leading-relaxed">
            Please use the encrypted transmission console on the project detail page to chat directly with the seller.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function ContactPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-bg" />}>
      <ContactContent />
    </Suspense>
  );
}
