'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Users,
  ExternalLink,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  Archive,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import { StatusBadge } from '@/components/ui/badge';
import { CollabRequest } from '@/types/collab';
import { getDisplayHandle } from '@/lib/user';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface CollabsTabProps {
  receivedPitches: CollabRequest[];
  myPitches: CollabRequest[];
  isLoading: boolean;
  onRefresh: () => void;
  onOpenMessage: (recipientId: string) => void;
}

export default function CollabsTab({
  receivedPitches,
  myPitches,
  isLoading,
  onRefresh,
  onOpenMessage,
}: CollabsTabProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSubtab = (searchParams.get('subtab') as 'received' | 'sent') || 'received';
  const [activeSubtab, setActiveSubtab] = useState<'received' | 'sent'>(initialSubtab);
  const [expandedPitchId, setExpandedPitchId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    const sub = searchParams.get('subtab') as 'received' | 'sent';
    if (sub && (sub === 'received' || sub === 'sent')) {
      setActiveSubtab(sub);
    }
  }, [searchParams]);

  const handleSubtabChange = (sub: 'received' | 'sent') => {
    setActiveSubtab(sub);
    const params = new URLSearchParams(searchParams.toString());
    params.set('subtab', sub);
    router.replace(`/dashboard?tab=collabs&subtab=${sub}`, { scroll: false });
  };

  // Collab action (accept/reject)
  const handleCollabAction = async (requestId: string, action: 'accept' | 'reject') => {
    setProcessingId(requestId);
    try {
      const res = await fetch('/api/collab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed');
      toast.success(action === 'accept' ? 'Proposal accepted! Conversation opened.' : 'Proposal declined.');
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Action failed';
      toast.error(msg);
    } finally {
      setProcessingId(null);
    }
  };

  // Withdraw pitch
  const handleWithdrawPitch = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      const { error } = await supabase
        .from('collab_requests')
        .update({ status: 'withdrawn' })
        .eq('id', requestId);

      if (error) throw error;
      toast.success('Application withdrawn.');
      onRefresh();
    } catch {
      toast.error('Failed to withdraw application.');
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-48 bg-surface-2 rounded-lg" />
        <div className="h-64 bg-surface rounded-card border border-line" />
      </div>
    );
  }

  const pendingReceivedCount = receivedPitches.filter((p) => p.status === 'pending').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Row */}
      <div>
        <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-semibold text-white tracking-tight">
          Collabs
        </h1>
        <p className="font-sans text-sm text-muted mt-1.5">
          Pitches you've received and applications you've sent.
        </p>
      </div>

      {/* Sliding Subtabs */}
      <div className="flex items-center gap-1 p-1 bg-surface rounded-xl border border-line w-fit">
        <button
          type="button"
          onClick={() => handleSubtabChange('received')}
          className={`relative px-4 py-2 rounded-lg text-xs sm:text-sm font-sans transition-colors flex items-center gap-2 ${
            activeSubtab === 'received'
              ? 'text-black font-semibold'
              : 'text-muted hover:text-white'
          }`}
        >
          {activeSubtab === 'received' && (
            <motion.span
              layoutId="collabs-subtab-pill"
              className="absolute inset-0 bg-white rounded-lg shadow-sm"
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          )}
          <span className="relative z-10">Received</span>
          <span
            className={`relative z-10 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-medium ${
              activeSubtab === 'received'
                ? 'bg-black/10 text-black'
                : 'bg-white/10 text-muted'
            }`}
          >
            {receivedPitches.length}
          </span>
          {pendingReceivedCount > 0 && (
            <span className="relative z-10 w-1.5 h-1.5 rounded-full bg-[#ff2a2a]" />
          )}
        </button>

        <button
          type="button"
          onClick={() => handleSubtabChange('sent')}
          className={`relative px-4 py-2 rounded-lg text-xs sm:text-sm font-sans transition-colors flex items-center gap-2 ${
            activeSubtab === 'sent'
              ? 'text-black font-semibold'
              : 'text-muted hover:text-white'
          }`}
        >
          {activeSubtab === 'sent' && (
            <motion.span
              layoutId="collabs-subtab-pill"
              className="absolute inset-0 bg-white rounded-lg shadow-sm"
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          )}
          <span className="relative z-10">Sent</span>
          <span
            className={`relative z-10 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-medium ${
              activeSubtab === 'sent'
                ? 'bg-black/10 text-black'
                : 'bg-white/10 text-muted'
            }`}
          >
            {myPitches.length}
          </span>
        </button>
      </div>

      {/* SUBTAB 1: RECEIVED */}
      {activeSubtab === 'received' && (
        <div className="space-y-4">
          {receivedPitches.length === 0 ? (
            <div className="p-8 sm:p-12 bg-surface rounded-card border border-line text-center space-y-4 max-w-xl mx-auto my-6">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto text-muted">
                <Users className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h2 className="font-display text-lg font-semibold text-white">No pitches yet</h2>
                <p className="font-sans text-xs sm:text-sm text-muted">
                  Applicants to your Seeking partner listings appear here.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/submit?mode=collab"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black hover:bg-neutral-200 font-sans font-semibold text-sm transition-colors shadow-sm"
                >
                  Create a collab listing
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {receivedPitches.map((pitch) => {
                const isExpanded = expandedPitchId === pitch.id;

                return (
                  <div
                    key={pitch.id}
                    className="p-5 bg-surface rounded-card border border-line space-y-3 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar username={pitch.applicant?.username} size={36} />
                        <div>
                          <span className="font-sans font-semibold text-sm text-white block">
                            {getDisplayHandle(pitch.applicant)}
                          </span>
                          <span className="font-sans text-xs text-muted">
                            Applied for:{' '}
                            <Link
                              href={`/project/${pitch.project_id}`}
                              className="text-white hover:underline font-medium"
                            >
                              {pitch.project?.title || 'Project'}
                            </Link>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {pitch.status === 'pending' && (
                          <StatusBadge status="pending" label="Pending" />
                        )}
                        {pitch.status === 'accepted' && (
                          <StatusBadge status="live" label="Accepted" />
                        )}
                        {pitch.status === 'rejected' && (
                          <StatusBadge status="failed" label="Rejected" />
                        )}
                        {pitch.status === 'withdrawn' && (
                          <StatusBadge status="archived" label="Withdrawn" />
                        )}
                        <span className="text-xs text-muted font-sans">
                          {new Date(pitch.created_at).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Pitch preview / full */}
                    <div className="p-3.5 bg-surface-2 rounded-xl font-sans text-xs sm:text-sm text-fg/90 leading-relaxed">
                      <p className={isExpanded ? 'whitespace-pre-wrap' : 'line-clamp-2'}>
                        {pitch.pitch}
                      </p>
                      <button
                        type="button"
                        onClick={() => setExpandedPitchId(isExpanded ? null : pitch.id)}
                        className="mt-2 text-xs font-sans text-muted hover:text-white flex items-center gap-1 transition-colors"
                      >
                        {isExpanded ? (
                          <>
                            Show less <ChevronUp className="w-3.5 h-3.5" />
                          </>
                        ) : (
                          <>
                            View full pitch <ChevronDown className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>

                    {/* Contact & Actions Row */}
                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-sans pt-1">
                      <div className="flex items-center gap-4 text-muted">
                        <span>
                          Contact:{' '}
                          <strong className="text-white font-normal">{pitch.contact}</strong>
                        </span>
                        {pitch.portfolio_url && (
                          <a
                            href={pitch.portfolio_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#60a5fa] hover:underline inline-flex items-center gap-1"
                          >
                            <span>Portfolio</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {pitch.status === 'pending' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleCollabAction(pitch.id, 'reject')}
                              disabled={processingId === pitch.id}
                              className="px-3 py-1.5 rounded-lg border border-line text-muted hover:text-white hover:bg-white/5 transition-colors font-medium"
                            >
                              Reject
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCollabAction(pitch.id, 'accept')}
                              disabled={processingId === pitch.id}
                              className="px-3.5 py-1.5 rounded-lg bg-white text-black font-semibold hover:bg-neutral-200 transition-colors shadow-sm"
                            >
                              Accept & message
                            </button>
                          </>
                        )}
                        {pitch.status === 'accepted' && (
                          <button
                            type="button"
                            onClick={() => onOpenMessage(pitch.applicant_id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Message</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: SENT */}
      {activeSubtab === 'sent' && (
        <div className="space-y-4">
          {myPitches.length === 0 ? (
            <div className="p-8 sm:p-12 bg-surface rounded-card border border-line text-center space-y-4 max-w-xl mx-auto my-6">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto text-muted">
                <Users className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h2 className="font-display text-lg font-semibold text-white">You haven't applied yet</h2>
                <p className="font-sans text-xs sm:text-sm text-muted">
                  Find a project that needs a partner.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/?mode=collab"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black hover:bg-neutral-200 font-sans font-semibold text-sm transition-colors shadow-sm"
                >
                  Browse seeking-partner projects
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {myPitches.map((pitch) => (
                <div
                  key={pitch.id}
                  className="p-5 bg-surface rounded-card border border-line space-y-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <Link
                        href={`/project/${pitch.project_id}`}
                        className="font-sans font-semibold text-sm text-white hover:underline"
                      >
                        {pitch.project?.title || 'Project'}
                      </Link>
                      <span className="text-xs text-muted block mt-0.5">
                        Submitted on{' '}
                        {new Date(pitch.created_at).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {pitch.status === 'pending' && (
                        <StatusBadge status="pending" label="Pending" />
                      )}
                      {pitch.status === 'accepted' && (
                        <StatusBadge status="live" label="Accepted" />
                      )}
                      {pitch.status === 'rejected' && (
                        <StatusBadge status="failed" label="Rejected" />
                      )}
                      {pitch.status === 'withdrawn' && (
                        <StatusBadge status="archived" label="Withdrawn" />
                      )}
                    </div>
                  </div>

                  <p className="font-sans text-xs text-muted line-clamp-2">{pitch.pitch}</p>

                  <div className="flex items-center justify-between pt-2 border-t border-line text-xs font-sans">
                    <span className="text-muted">
                      Your contact:{' '}
                      <strong className="text-white font-normal">{pitch.contact}</strong>
                    </span>
                    <div className="flex items-center gap-2">
                      {pitch.status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => handleWithdrawPitch(pitch.id)}
                          disabled={processingId === pitch.id}
                          className="text-xs font-sans text-[#ff5555] hover:underline"
                        >
                          Withdraw application
                        </button>
                      )}
                      {pitch.status === 'accepted' && pitch.project?.seller_id && (
                        <button
                          type="button"
                          onClick={() => onOpenMessage(pitch.project!.seller_id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Message owner</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
