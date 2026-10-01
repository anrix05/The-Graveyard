'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Eye,
  Edit,
  Trash2,
  Users,
  Search,
  Plus,
} from 'lucide-react';
import CoverArt from '@/components/CoverArt';
import { ModeBadge, StatusBadge } from '@/components/ui/badge';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Project, InteractionType } from '@/types/project';
import { formatINR } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface ListingsTabProps {
  projects: Project[];
  isLoading: boolean;
  onRefresh: () => void;
}

type FilterOption = 'all' | 'buy' | 'adopt' | 'collab';

export default function ListingsTab({ projects, isLoading, onRefresh }: ListingsTabProps) {
  const [filter, setFilter] = useState<FilterOption>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter & Search Logic
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesFilter = filter === 'all' || p.interaction_type === filter;
      const matchesSearch =
        !searchQuery ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tagline?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [projects, filter, searchQuery]);

  // Collab filled toggle
  const handleToggleCollabFilled = async (project: Project) => {
    try {
      const nextState = !project.is_collab_filled;
      const { error } = await supabase
        .from('projects')
        .update({ is_collab_filled: nextState })
        .eq('id', project.id);

      if (error) throw error;
      toast.success(nextState ? 'Position marked as filled.' : 'Position reopened.');
      onRefresh();
    } catch {
      toast.error('Failed to update status.');
    }
  };

  // Delete project
  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectToDelete.id);

      if (error) throw error;
      toast.success('Listing deleted.');
      setProjectToDelete(null);
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Delete failed';
      toast.error(msg);
    } finally {
      setIsDeleting(false);
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

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-semibold text-white tracking-tight">
            My listings
          </h1>
          <p className="font-sans text-sm text-muted mt-1.5">
            Manage and monitor your listed codebases.
          </p>
        </div>
      </div>

      {projects.length === 0 ? (
        /* Empty State with Tombstone Illustration */
        <div className="p-8 sm:p-12 bg-surface rounded-card border border-line text-center space-y-4 max-w-xl mx-auto my-6">
          <div className="w-16 h-20 mx-auto rounded-t-2xl rounded-b-md border-2 border-line bg-surface-2 flex items-center justify-center text-muted">
            <span className="font-serif italic text-2xl text-muted/60">†</span>
          </div>
          <div className="space-y-1.5">
            <h2 className="font-display text-lg font-semibold text-white">No listings yet</h2>
            <p className="font-sans text-xs sm:text-sm text-muted">
              List a project to sell it, give it away, or find a partner.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black hover:bg-neutral-200 font-sans font-semibold text-sm transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Create your first listing</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Controls Bar: Filter tabs + Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 p-1 bg-surface rounded-xl border border-line overflow-x-auto">
              {(
                [
                  { id: 'all', label: 'All' },
                  { id: 'buy', label: 'For sale' },
                  { id: 'adopt', label: 'Free fork' },
                  { id: 'collab', label: 'Seeking partner' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-sans transition-colors whitespace-nowrap ${
                    filter === tab.id
                      ? 'bg-white text-black font-semibold shadow-sm'
                      : 'text-muted hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Small search (visible when projects > 5) */}
            {projects.length > 5 && (
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search listings..."
                  className="w-full pl-8 pr-3 py-1.5 bg-surface border border-line rounded-xl text-xs font-sans text-white placeholder:text-muted focus:outline-none focus:border-white/30"
                />
              </div>
            )}
          </div>

          {/* Desktop Table (>= md) */}
          <div className="hidden md:block bg-surface rounded-card border border-line overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-sans">
                <thead>
                  <tr className="border-b border-line text-muted font-medium bg-white/[0.02]">
                    <th className="py-3.5 px-4 font-normal">Project</th>
                    <th className="py-3.5 px-4 font-normal">Type</th>
                    <th className="py-3.5 px-4 font-normal">Price / Terms</th>
                    <th className="py-3.5 px-4 font-normal">Status</th>
                    <th className="py-3.5 px-4 font-normal">Views</th>
                    <th className="py-3.5 px-4 font-normal">Created</th>
                    <th className="py-3.5 px-4 font-normal text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filteredProjects.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-muted">
                        No listings match your search or filter.
                      </td>
                    </tr>
                  ) : (
                    filteredProjects.map((p) => {
                      let statusPill: React.ReactNode = <StatusBadge status="live" label="Live" />;
                      if (p.interaction_type === 'buy') {
                        statusPill = p.is_sold ? (
                          <StatusBadge status="sold" label="Sold" />
                        ) : (
                          <StatusBadge status="live" label="For sale" />
                        );
                      } else if (p.interaction_type === 'adopt') {
                        statusPill = <StatusBadge status="claimed" label="Live" />;
                      } else if (p.interaction_type === 'collab') {
                        statusPill = p.is_collab_filled ? (
                          <StatusBadge status="filled" label="Filled" />
                        ) : (
                          <StatusBadge status="live" label="Open" />
                        );
                      }

                      return (
                        <tr key={p.id} className="hover:bg-white/[0.015] transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-7 rounded-md overflow-hidden bg-surface-2 shrink-0 border border-line">
                                {p.cover_url ? (
                                  <img
                                    src={p.cover_url}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <CoverArt
                                    title={p.title}
                                    mode={p.interaction_type}
                                    className="w-full h-full"
                                  />
                                )}
                              </div>
                              <div className="min-w-0 max-w-[200px]">
                                <Link
                                  href={`/project/${p.id}`}
                                  className="font-medium text-white hover:underline truncate block"
                                >
                                  {p.title}
                                </Link>
                                <span className="text-[11px] text-muted truncate block">
                                  {p.tagline || 'No tagline'}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <ModeBadge mode={p.interaction_type} size="sm" />
                          </td>
                          <td className="py-3.5 px-4 font-mono">
                            {p.interaction_type === 'buy'
                              ? formatINR(p.price_paise, { showFreeForZero: false })
                              : p.interaction_type === 'adopt'
                                ? 'Free'
                                : p.collab_terms || 'Collab'}
                          </td>
                          <td className="py-3.5 px-4">{statusPill}</td>
                          <td className="py-3.5 px-4 font-mono text-muted">{p.views || 0}</td>
                          <td className="py-3.5 px-4 text-muted">
                            {new Date(p.created_at).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Link
                                href={`/project/${p.id}`}
                                className="p-1.5 rounded-lg text-muted hover:text-white hover:bg-white/5 transition-colors"
                                title="View details"
                              >
                                <Eye className="w-4 h-4" />
                              </Link>
                              <Link
                                href={`/edit/${p.id}`}
                                className="p-1.5 rounded-lg text-muted hover:text-white hover:bg-white/5 transition-colors"
                                title="Edit listing"
                              >
                                <Edit className="w-4 h-4" />
                              </Link>
                              {p.interaction_type === 'collab' && (
                                <button
                                  type="button"
                                  onClick={() => handleToggleCollabFilled(p)}
                                  className="p-1.5 rounded-lg text-muted hover:text-blue hover:bg-white/5 transition-colors"
                                  title={p.is_collab_filled ? 'Reopen position' : 'Mark filled'}
                                >
                                  <Users className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setProjectToDelete(p)}
                                className="p-1.5 rounded-lg text-muted hover:text-[#ff5555] hover:bg-[#ff2a2a]/10 transition-colors"
                                title="Delete listing"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Stacked Cards (< md) */}
          <div className="md:hidden space-y-3">
            {filteredProjects.length === 0 ? (
              <div className="p-6 bg-surface rounded-card border border-line text-center text-muted text-xs">
                No listings match your search or filter.
              </div>
            ) : (
              filteredProjects.map((p) => {
                let statusPill: React.ReactNode = <StatusBadge status="live" label="Live" />;
                if (p.interaction_type === 'buy') {
                  statusPill = p.is_sold ? (
                    <StatusBadge status="sold" label="Sold" />
                  ) : (
                    <StatusBadge status="live" label="For sale" />
                  );
                } else if (p.interaction_type === 'adopt') {
                  statusPill = <StatusBadge status="claimed" label="Live" />;
                } else if (p.interaction_type === 'collab') {
                  statusPill = p.is_collab_filled ? (
                    <StatusBadge status="filled" label="Filled" />
                  ) : (
                    <StatusBadge status="live" label="Open" />
                  );
                }

                return (
                  <div key={p.id} className="p-4 rounded-card bg-surface border border-line space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-10 h-7 rounded-md overflow-hidden bg-surface-2 shrink-0 border border-line">
                          {p.cover_url ? (
                            <img src={p.cover_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <CoverArt
                              title={p.title}
                              mode={p.interaction_type}
                              className="w-full h-full"
                            />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/project/${p.id}`}
                            className="font-medium text-sm text-white hover:underline block truncate"
                          >
                            {p.title}
                          </Link>
                          <span className="font-mono text-xs text-muted block truncate">
                            {p.interaction_type === 'buy'
                              ? formatINR(p.price_paise, { showFreeForZero: false })
                              : p.interaction_type === 'adopt'
                                ? 'Free'
                                : p.collab_terms || 'Collab'}
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center gap-1.5 flex-wrap justify-end">
                        <ModeBadge mode={p.interaction_type} size="sm" />
                        {statusPill}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-line text-xs font-sans text-muted">
                      <span>
                        {p.views || 0} views ·{' '}
                        {new Date(p.created_at).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/project/${p.id}`}
                          className="p-1 hover:text-white"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/edit/${p.id}`}
                          className="p-1 hover:text-white"
                          title="Edit listing"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        {p.interaction_type === 'collab' && (
                          <button
                            type="button"
                            onClick={() => handleToggleCollabFilled(p)}
                            className="p-1 hover:text-blue"
                            title={p.is_collab_filled ? 'Reopen position' : 'Mark filled'}
                          >
                            <Users className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setProjectToDelete(p)}
                          className="p-1 hover:text-[#ff5555]"
                          title="Delete listing"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(projectToDelete)}
        title="Delete listing?"
        description={`Are you sure you want to permanently delete "${projectToDelete?.title}"? All associated data, pitches, and download assets will be removed.`}
        confirmText="Delete listing"
        cancelText="Cancel"
        isDanger={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setProjectToDelete(null)}
      />
    </div>
  );
}
