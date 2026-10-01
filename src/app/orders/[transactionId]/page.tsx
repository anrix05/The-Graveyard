'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2,
  Download,
  Copy,
  Check,
  Github,
  Printer,
  ShieldCheck,
  MessageSquare,
  ArrowRight,
  ExternalLink,
  RotateCw,
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Button from '@/components/ui/Button';
import CoverArt from '@/components/CoverArt';
import Img from '@/components/ui/Img';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { formatINR } from '@/lib/format';
import { track } from '@/lib/analytics';
import { toast } from 'sonner';

export default function OrderConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const transactionId = params?.transactionId as string;

  const [transaction, setTransaction] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isRetryingInvite, setIsRetryingInvite] = useState(false);
  const [inviteStatus, setInviteStatus] = useState<string>('pending');
  const [inviteError, setInviteError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) {
      router.push(`/login?next=/orders/${transactionId}`);
      return;
    }

    const fetchOrder = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('transactions')
          .select(`
            *,
            project:projects(*),
            seller:profiles!seller_id(id, username),
            buyer:profiles!buyer_id(id, username)
          `)
          .eq('id', transactionId)
          .maybeSingle();

        if (error || !data) {
          notFound();
          return;
        }

        // Verify only buyer or seller may view
        if (data.buyer_id !== user.id && data.seller_id !== user.id) {
          notFound();
          return;
        }

        setTransaction(data);
        setInviteStatus(data.invite_status || 'not_applicable');
        setInviteError(data.invite_error || null);

        // Track analytics once per order (de-duplicated via sessionStorage)
        const sessionKey = `graveyard:tracked:order:${data.id}`;
        if (!sessionStorage.getItem(sessionKey)) {
          sessionStorage.setItem(sessionKey, 'true');
          if (data.amount_paise > 0) {
            track('payment_succeeded', {
              project_id: data.project_id,
              price_band: data.amount_paise >= 100000 ? 'high' : 'standard',
            });
          } else {
            track('claim_completed', {
              project_id: data.project_id,
            });
          }
        }
      } catch {
        notFound();
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [transactionId, user, isAuthLoading, router]);

  const copyOrderId = () => {
    navigator.clipboard.writeText(transactionId);
    setIsCopied(true);
    toast.success('Transaction ID copied');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownload = async () => {
    if (!transaction?.project_id) return;
    setIsDownloading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`/api/secure-download?projectId=${transaction.project_id}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Download failed');

      window.location.href = data.downloadUrl;
      toast.success('Download initiated');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Download failed';
      toast.error(msg);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleRetryInvite = async () => {
    setIsRetryingInvite(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch('/api/retry-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ transactionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Invite failed');

      setInviteStatus(data.inviteStatus || 'sent');
      setInviteError(null);
      toast.success('GitHub invite dispatched successfully!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Retry failed';
      setInviteError(msg);
      toast.error(msg);
    } finally {
      setIsRetryingInvite(false);
    }
  };

  if (isLoading || isAuthLoading) {
    return (
      <div className="min-h-dvh bg-bg flex flex-col font-sans">
        <Header />
        <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-16 animate-pulse space-y-6">
          <div className="h-8 w-48 bg-surface-2 rounded-full mx-auto" />
          <div className="h-4 w-72 bg-surface-2 rounded-lg mx-auto" />
          <div className="h-64 bg-surface rounded-card border border-line" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!transaction) {
    notFound();
    return null;
  }

  const isPaid = (transaction.amount_paise || 0) > 0;
  const project = transaction.project;

  return (
    <div className="min-h-dvh bg-bg text-fg flex flex-col font-sans">
      <div className="print:hidden">
        <Header />
      </div>

      <main id="main" tabIndex={-1} className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-10 sm:py-16 space-y-8 outline-none">
        {/* Success Header */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-[#39ff14]/10 border border-[#39ff14]/30 flex items-center justify-center mx-auto text-[#39ff14]">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="flex items-center justify-center gap-2">
            {isPaid && (
              <span className="font-mono text-[11px] px-2.5 py-0.5 rounded-full bg-amber/15 text-amber border border-amber/30 uppercase tracking-widest font-semibold">
                TEST MODE
              </span>
            )}
            <span className="font-mono text-xs text-muted">
              {new Date(transaction.created_at).toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-display font-semibold text-white">
            {isPaid ? 'Thank you, your order is confirmed' : 'Project claimed successfully'}
          </h1>
          <p className="font-sans text-sm text-muted max-w-md mx-auto leading-relaxed">
            {isPaid
              ? 'Your payment was processed in test mode. You now hold exclusive rights to this codebase.'
              : 'You have forked this project into your Operative Vault for direct build and development.'}
          </p>
        </div>

        {/* Order Details Receipt Card */}
        <div className="bg-surface rounded-card border border-line p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-line gap-4">
            {/* Project info preview */}
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-16 h-12 rounded-lg bg-surface-2 border border-line overflow-hidden shrink-0 relative">
                {project?.cover_url ? (
                  <Img
                    src={project.cover_url}
                    alt={`${project.title} cover image`}
                    fill
                    sizes="64px"
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <CoverArt title={project?.title || 'Project'} id={project?.id} />
                )}
              </div>
              <div className="min-w-0">
                <Link
                  href={`/project/${project?.id}`}
                  className="font-display font-semibold text-base text-white hover:text-brand-red transition-colors block truncate"
                >
                  {project?.title || 'Codebase'}
                </Link>
                <span className="font-mono text-xs text-muted">
                  Sold by @{transaction.seller?.username || 'operative'}
                </span>
              </div>
            </div>

            {/* Price badge */}
            <div className="text-right sm:shrink-0">
              <span className="font-mono text-[11px] uppercase tracking-wider text-muted block">
                Total Paid
              </span>
              <span className="font-display font-semibold text-2xl text-white">
                {isPaid ? formatINR(transaction.amount_paise) : 'Free ($0)'}
              </span>
            </div>
          </div>

          {/* Transaction Metadata Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-3 bg-surface-2 rounded-xl border border-line/60 flex items-center justify-between">
              <span className="text-muted">Order ID:</span>
              <button
                type="button"
                onClick={copyOrderId}
                className="inline-flex items-center gap-1.5 text-white hover:text-brand-red transition-colors"
                title="Copy order ID"
              >
                <span className="truncate max-w-[160px]">{transactionId}</span>
                {isCopied ? <Check className="w-3.5 h-3.5 text-[#39ff14]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="p-3 bg-surface-2 rounded-xl border border-line/60 flex items-center justify-between">
              <span className="text-muted">Payment Processor:</span>
              <span className="text-white">Razorpay Standard (Test)</span>
            </div>
          </div>

          {/* Delivery Card */}
          <div className="p-5 bg-black/40 rounded-xl border border-line space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#39ff14]" />
                <h2 className="font-display font-semibold text-sm text-white">
                  Asset Delivery &amp; Repository Access
                </h2>
              </div>
              <span className="font-mono text-[11px] text-[#39ff14] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#39ff14]" />
                Ready
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
              <div className="space-y-0.5">
                <span className="font-sans text-xs font-medium text-white block">
                  Complete Source Archive (.zip)
                </span>
                <span className="font-mono text-[11px] text-muted block">
                  Full codebase, commit tree history, and static assets.
                </span>
              </div>
              <Button
                variant="primary"
                mode="brand"
                size="sm"
                onClick={handleDownload}
                isLoading={isDownloading}
                leftIcon={<Download className="w-3.5 h-3.5" />}
              >
                Download ZIP
              </Button>
            </div>

            {/* GitHub Collaborator Section */}
            {inviteStatus !== 'not_applicable' && (
              <div className="pt-3 border-t border-line/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Github className="w-3.5 h-3.5 text-white" />
                    <span className="font-sans text-xs font-medium text-white">
                      GitHub Repository Access
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-muted block">
                    {inviteStatus === 'sent' && 'Collaborator invitation dispatched to your GitHub account.'}
                    {inviteStatus === 'pending' && 'Preparing repository collaborator invitation...'}
                    {inviteStatus === 'failed' && `Invite failed (${inviteError || 'PAT permissions'}). Direct download still works.`}
                  </span>
                </div>

                {inviteStatus === 'failed' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleRetryInvite}
                    isLoading={isRetryingInvite}
                    leftIcon={<RotateCw className="w-3.5 h-3.5" />}
                  >
                    Retry Invite
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* What Happens Next - 3 Steps */}
          <div className="space-y-3 pt-2">
            <h3 className="font-mono text-xs uppercase tracking-wider text-muted font-semibold">
              What happens next
            </h3>
            <ol className="space-y-2.5 font-sans text-xs text-muted leading-relaxed">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-surface-2 border border-line flex items-center justify-center font-mono text-[10px] text-white shrink-0 mt-0.5">
                  1
                </span>
                <span>
                  <strong>Download and inspect:</strong> Extract the source archive and run dependencies locally as outlined in the setup documentation.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-surface-2 border border-line flex items-center justify-center font-mono text-[10px] text-white shrink-0 mt-0.5">
                  2
                </span>
                <span>
                  <strong>Accept GitHub invite:</strong> Check your GitHub notifications or email for repository collaborator rights.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-surface-2 border border-line flex items-center justify-center font-mono text-[10px] text-white shrink-0 mt-0.5">
                  3
                </span>
                <span>
                  <strong>Message the seller:</strong> If you need clarification regarding deployment keys or architecture, contact the seller directly.
                </span>
              </li>
            </ol>
          </div>

          {/* Actions & Print Button */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-line print:hidden">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 text-xs font-mono text-muted hover:text-white transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save as PDF</span>
            </button>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/dashboard?tab=messages&to=${transaction.seller_id}`)}
                leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
              >
                Message Seller
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => router.push('/dashboard?tab=vault')}
              >
                Go to Vault
              </Button>
              <Link href="/">
                <Button variant="primary" mode="brand" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                  Browse More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
}
