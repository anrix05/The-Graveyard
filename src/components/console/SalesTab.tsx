'use client';

import React from 'react';
import Link from 'next/link';
import {
  IndianRupee,
  CheckCircle,
  AlertTriangle,
  Plus,
} from 'lucide-react';
import { Transaction } from '@/types/transaction';
import { formatINR } from '@/lib/format';
import { getDisplayHandle } from '@/lib/user';
import { StatusBadge } from '@/components/ui/badge';

interface SalesTabProps {
  transactions: Transaction[];
  isLoading: boolean;
}

export default function SalesTab({ transactions, isLoading }: SalesTabProps) {
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-48 bg-surface-2 rounded-lg" />
        <div className="h-64 bg-surface rounded-card border border-line" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-semibold text-white tracking-tight">
              Sales
            </h1>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-muted font-medium">
              Test mode
            </span>
          </div>
          <p className="font-sans text-sm text-muted mt-1.5">
            Everything you've sold or given away.
          </p>
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="p-8 sm:p-12 bg-surface rounded-card border border-line text-center space-y-4 max-w-xl mx-auto my-6">
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto text-muted">
            <IndianRupee className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h2 className="font-display text-lg font-semibold text-white">No sales yet</h2>
            <p className="font-sans text-xs sm:text-sm text-muted">
              When someone buys or claims one of your projects, the order and access status appear here.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black hover:bg-neutral-200 font-sans font-semibold text-sm transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Create a listing</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Desktop Table (>= md) */}
          <div className="hidden md:block bg-surface rounded-card border border-line overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-sans">
                <thead>
                  <tr className="border-b border-line text-muted font-medium bg-white/[0.02]">
                    <th className="py-3.5 px-4 font-normal">Project</th>
                    <th className="py-3.5 px-4 font-normal">Buyer</th>
                    <th className="py-3.5 px-4 font-normal">Type</th>
                    <th className="py-3.5 px-4 font-normal">Amount</th>
                    <th className="py-3.5 px-4 font-normal">Status</th>
                    <th className="py-3.5 px-4 font-normal">Repo access</th>
                    <th className="py-3.5 px-4 font-normal text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-white/[0.015] transition-colors">
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/project/${tx.project_id}`}
                          className="font-medium text-white hover:underline block truncate max-w-[220px]"
                        >
                          {tx.project?.title || 'Codebase'}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 text-white">
                        {getDisplayHandle(tx.buyer)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-[11px] text-muted">
                          {tx.kind === 'buy' ? 'Sale' : 'Free claim'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium text-white">
                        {tx.kind === 'adopt' ? 'Free' : formatINR(tx.amount || 0)}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status="live" label="Completed" />
                      </td>
                      <td className="py-3.5 px-4">
                        {tx.invite_status === 'sent' && (
                          <span className="text-[#39ff14] flex items-center gap-1 text-[11px]">
                            <CheckCircle className="w-3.5 h-3.5" /> Sent
                          </span>
                        )}
                        {tx.invite_status === 'failed' && (
                          <span className="text-[#ff5555] flex items-center gap-1 text-[11px]">
                            <AlertTriangle className="w-3.5 h-3.5" /> Failed
                          </span>
                        )}
                        {tx.invite_status === 'not_applicable' && (
                          <span className="text-muted text-[11px]">N/A</span>
                        )}
                        {tx.invite_status === 'pending' && (
                          <span className="text-amber text-[11px]">Pending</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right text-muted">
                        {new Date(tx.created_at).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Stacked Cards (< md) */}
          <div className="md:hidden space-y-3">
            {transactions.map((tx) => (
              <div key={tx.id} className="p-4 rounded-card bg-surface border border-line space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/project/${tx.project_id}`}
                    className="font-sans font-medium text-sm text-white hover:underline truncate"
                  >
                    {tx.project?.title}
                  </Link>
                  <span className="font-mono font-medium text-sm text-[#39ff14] shrink-0">
                    {tx.kind === 'adopt' ? 'Free' : formatINR(tx.amount || 0)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-sans text-muted pt-2 border-t border-line">
                  <div>
                    <span className="text-[10px] block text-muted/80">Buyer</span>
                    <span className="text-white truncate block">{getDisplayHandle(tx.buyer)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] block text-muted/80">Date</span>
                    <span>
                      {new Date(tx.created_at).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] block text-muted/80">Status</span>
                    <span className="text-[#39ff14]">Completed</span>
                  </div>
                  <div>
                    <span className="text-[10px] block text-muted/80">Repo invite</span>
                    {tx.invite_status === 'sent' && (
                      <span className="text-[#39ff14] flex items-center gap-1 text-[11px]">
                        <CheckCircle className="w-3 h-3" /> Sent
                      </span>
                    )}
                    {tx.invite_status === 'failed' && (
                      <span className="text-[#ff5555] flex items-center gap-1 text-[11px]">
                        <AlertTriangle className="w-3 h-3" /> Failed
                      </span>
                    )}
                    {tx.invite_status === 'not_applicable' && (
                      <span className="text-muted text-[11px]">N/A</span>
                    )}
                    {tx.invite_status === 'pending' && (
                      <span className="text-amber text-[11px]">Pending</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
