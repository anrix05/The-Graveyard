'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Shield,
  Download,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { Transaction } from '@/types/transaction';
import { formatINR } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface VaultTabProps {
  transactions: Transaction[];
  isLoading: boolean;
  onRefresh: () => void;
}

export default function VaultTab({ transactions, isLoading, onRefresh }: VaultTabProps) {
  const [downloadingProjectId, setDownloadingProjectId] = useState<string | null>(null);
  const [retryingTxId, setRetryingTxId] = useState<string | null>(null);

  // Vault download handler
  const handleVaultDownload = async (projectId: string) => {
    setDownloadingProjectId(projectId);
    try {
      const response = await fetch(`/api/secure-download?project_id=${projectId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate download');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `project-${projectId}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Download started.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Download failed';
      toast.error(msg);
    } finally {
      setDownloadingProjectId(null);
    }
  };

  // Retry GitHub Invite
  const handleRetryInvite = async (txId: string) => {
    setRetryingTxId(txId);
    try {
      const res = await fetch('/api/retry-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId: txId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Retry failed');
      toast.success('Invitation resent successfully.');
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Retry failed';
      toast.error(msg);
    } finally {
      setRetryingTxId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-48 bg-surface-2 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-56 bg-surface rounded-card border border-line" />
          <div className="h-56 bg-surface rounded-card border border-line" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Row */}
      <div>
        <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-semibold text-white tracking-tight">
          Vault
        </h1>
        <p className="font-sans text-sm text-muted mt-1.5">
          Projects you've bought or claimed.
        </p>
      </div>

      {transactions.length === 0 ? (
        <div className="p-8 sm:p-12 bg-surface rounded-card border border-line text-center space-y-4 max-w-xl mx-auto my-6">
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto text-muted">
            <Shield className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h2 className="font-display text-lg font-semibold text-white">Your vault is empty</h2>
            <p className="font-sans text-xs sm:text-sm text-muted">
              You haven't bought or claimed any codebases yet.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black hover:bg-neutral-200 font-sans font-semibold text-sm transition-colors shadow-sm"
            >
              Browse projects
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {transactions.map((tx) => (
            <div key={tx.id} className="p-6 bg-surface rounded-card border border-line space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className={`font-mono text-[10px] px-2 py-0.5 rounded-full uppercase font-medium ${
                        tx.kind === 'buy'
                          ? 'text-[#39ff14] bg-[#39ff14]/10'
                          : 'text-[#fbbf24] bg-[#fbbf24]/10'
                      }`}
                    >
                      {tx.kind === 'buy' ? 'Purchased' : 'Claimed'}
                    </span>
                    <span className="font-sans text-xs text-muted">
                      {new Date(tx.created_at).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <Link
                    href={`/project/${tx.project_id}`}
                    className="font-display font-semibold text-lg text-white hover:underline block truncate max-w-[260px]"
                  >
                    {tx.project?.title || 'Acquired codebase'}
                  </Link>
                </div>
                <span className="font-mono text-sm font-semibold text-white">
                  {tx.kind === 'buy' ? formatINR(tx.amount, { showFreeForZero: false }) : 'Free fork'}
                </span>
              </div>

              {/* Delivery status */}
              <div className="p-3.5 bg-surface-2 rounded-xl space-y-2 text-xs font-sans">
                <div className="flex items-center justify-between">
                  <span className="text-muted">GitHub repository access:</span>
                  <span className="flex items-center gap-1 font-medium">
                    {tx.invite_status === 'sent' && (
                      <span className="text-[#39ff14] flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Invite sent
                      </span>
                    )}
                    {tx.invite_status === 'failed' && (
                      <span className="text-[#ff5555] flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Failed
                      </span>
                    )}
                    {tx.invite_status === 'pending' && (
                      <span className="text-amber">Pending</span>
                    )}
                    {tx.invite_status === 'not_applicable' && (
                      <span className="text-muted">Not applicable</span>
                    )}
                  </span>
                </div>

                {tx.invite_status === 'failed' && (
                  <div className="pt-2 border-t border-line flex items-center justify-between">
                    <span className="text-[11px] text-[#ff5555] truncate max-w-[200px]">
                      {tx.invite_error || 'Permission error'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRetryInvite(tx.id)}
                      disabled={retryingTxId === tx.id}
                      className="text-[11px] font-sans font-medium text-[#39ff14] hover:underline flex items-center gap-1"
                    >
                      <RefreshCw
                        className={`w-3 h-3 ${retryingTxId === tx.id ? 'animate-spin' : ''}`}
                      />{' '}
                      Retry invite
                    </button>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => handleVaultDownload(tx.project_id)}
                  disabled={downloadingProjectId === tx.project_id}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-white text-black font-sans font-semibold text-xs hover:bg-neutral-200 transition-colors shadow-sm disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>
                    {downloadingProjectId === tx.project_id ? 'Downloading...' : 'Download ZIP'}
                  </span>
                </button>
                <Link
                  href={`/project/${tx.project_id}`}
                  className="px-4 py-2 rounded-full border border-line bg-surface-2 hover:bg-white/5 font-sans font-medium text-xs text-white transition-colors"
                >
                  Inspect
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
