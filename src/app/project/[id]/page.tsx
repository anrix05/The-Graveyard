'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Calendar,
  Eye,
  Scale,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  CheckCircle,
  Circle,
  Download,
  Github,
  Copy,
  Check,
  Edit,
  Archive,
  UserCheck,
  RotateCcw,
  Sparkles,
  Clock,
  Code2,
  GitCommit,
  Layers,
  Users,
  FileText,
  AlertCircle,
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Button from '@/components/ui/Button';
import CoverArt from '@/components/CoverArt';
import { ModeBadge, StatusBadge } from '@/components/ui/badge';
import TechBadge from '@/components/TechBadge';
import Avatar from '@/components/ui/Avatar';
import PaymentModal from '@/components/PaymentModal';
import CollabRequestModal from '@/components/CollabRequestModal';
import ScreenshotGallery from '@/components/project/ScreenshotGallery';
import FileTreeViewer from '@/components/project/FileTreeViewer';
import CompactProjectCard from '@/components/project/CompactProjectCard';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';
import { Project, Profile, CollabRole } from '@/types/project';
import { formatINR, formatLOC, formatDeadFor } from '@/lib/format';
import { formatEpitaph } from '@/lib/epitaph';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const projectId = params?.id as string;
  const initialIntent = searchParams?.get('intent');

  const [project, setProject] = useState<Project | null>(null);
  const [seller, setSeller] = useState<Profile | null>(null);
  const [sellerListingCount, setSellerListingCount] = useState(1);
  const [moreFromSeller, setMoreFromSeller] = useState<Project[]>([]);
  const [similarProjects, setSimilarProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(false);

  // Entitlement / Vault state for this user
  const [isEntitled, setIsEntitled] = useState(false);
  const [accessData, setAccessData] = useState<{
    hasArchive: boolean;
    repoUrl: string | null;
    inviteStatus: string;
    inviteError?: string | null;
  } | null>(null);

  // Modals & Action loading
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [isCollabModalOpen, setIsCollabModalOpen] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isRetryingInvite, setIsRetryingInvite] = useState(false);

  // Increment view count via RPC once per session
  useEffect(() => {
    if (!projectId) return;
    const viewedKey = `viewed_${projectId}`;
    if (!sessionStorage.getItem(viewedKey)) {
      supabase.rpc('increment_project_view', { p_id: projectId }).then(() => {
        sessionStorage.setItem(viewedKey, 'true');
      });
    }
  }, [projectId]);

  // Fetch project details, seller, recommendations, and user entitlement
  useEffect(() => {
    async function loadProjectData() {
      if (!projectId) return;
      setIsLoading(true);

      try {
        // 1. Fetch Project
        const { data: pData, error: pErr } = await supabase
          .from('projects')
          .select('*, seller:profiles(*)')
          .eq('id', projectId)
          .single();

        if (pErr || !pData) {
          toast.error('Project not found.');
          setIsLoading(false);
          return;
        }

        const raw = pData as any;
        let pricePaise = 0;
        if (raw.price_paise !== undefined && raw.price_paise !== null) {
          pricePaise = Number(raw.price_paise);
        } else if (raw.price !== undefined && raw.price !== null) {
          pricePaise = Math.round(Number(raw.price) * 100);
        }

        const normalizedProject: Project = {
          ...raw,
          price_paise: pricePaise,
          cause_of_death: raw.cause_of_death || 'other',
          abandoned_on: raw.abandoned_on || null,
          last_commit_at: raw.last_commit_at || null,
          epitaph: raw.epitaph || null,
          revived_at: raw.revived_at || null,
          tagline: raw.tagline || null,
          completion_percent: raw.completion_percent ?? null,
          lines_of_code: raw.lines_of_code ?? null,
          features: Array.isArray(raw.features) ? raw.features : [],
          todo_items: Array.isArray(raw.todo_items) ? raw.todo_items : [],
          setup_notes: raw.setup_notes || null,
          screenshots: Array.isArray(raw.screenshots) ? raw.screenshots : [],
          file_tree: Array.isArray(raw.file_tree) ? raw.file_tree : null,
          collab_roles: Array.isArray(raw.collab_roles) ? raw.collab_roles : null,
          seller: raw.seller || null,
        };

        setProject(normalizedProject);

        // 2. Fetch Seller Profile & listing count
        if (pData.seller_id) {
          if (!raw.seller) {
            const { data: prof } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', pData.seller_id)
              .single();
            if (prof) setSeller(prof);
          } else {
            setSeller(raw.seller);
          }

          const { count } = await supabase
            .from('projects')
            .select('*', { count: 'exact', head: true })
            .eq('seller_id', pData.seller_id)
            .eq('is_archived', false);

          if (count !== null) setSellerListingCount(count);

          // Fetch More From This Seller (up to 3, live only)
          const { data: sellerOthers } = await supabase
            .from('projects')
            .select('*, seller:profiles(*)')
            .eq('seller_id', pData.seller_id)
            .neq('id', projectId)
            .eq('is_sold', false)
            .eq('is_collab_filled', false)
            .eq('is_archived', false)
            .limit(3);

          if (sellerOthers) {
            setMoreFromSeller(sellerOthers as unknown as Project[]);
          }
        }

        // 3. Fetch Similar Projects (same tech or mode, up to 3, live only)
        const { data: similar } = await supabase
          .from('projects')
          .select('*, seller:profiles(*)')
          .neq('id', projectId)
          .eq('interaction_type', normalizedProject.interaction_type)
          .eq('is_sold', false)
          .eq('is_collab_filled', false)
          .eq('is_archived', false)
          .order('views', { ascending: false })
          .limit(3);

        if (similar) {
          setSimilarProjects(similar as unknown as Project[]);
        }

        // 4. Check Entitlement if signed in
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          const res = await fetch(`/api/project-access?projectId=${projectId}`, {
            headers: { Authorization: `Bearer ${session.access_token}` },
          });

          if (res.ok) {
            const acc = await res.json();
            if (acc.isEntitled) {
              setIsEntitled(true);
              setAccessData(acc);
            }
          }
        }
      } catch (err) {
        console.error('Project load failed:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadProjectData();
  }, [projectId]);

  // Handle post-login intent auto-opening
  useEffect(() => {
    if (!isLoading && project && initialIntent) {
      if (initialIntent === 'buy' && !project.is_sold) {
        setIsBuyModalOpen(true);
      } else if (initialIntent === 'apply' && !project.is_collab_filled) {
        setIsCollabModalOpen(true);
      } else if (initialIntent === 'claim' && !isEntitled) {
        handleClaim();
      }
    }
  }, [isLoading, project, initialIntent, isEntitled]);

  // Copy ID to clipboard
  const copyId = () => {
    if (!project) return;
    navigator.clipboard.writeText(project.id);
    setCopiedId(true);
    toast.success('Project ID copied to clipboard');
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Auth gate wrapper
  const requireAuthOrRedirect = (intent: string) => {
    if (!user) {
      router.push(`/login?next=/project/${projectId}&intent=${intent}`);
      return false;
    }
    return true;
  };

  // Free claim execution
  const handleClaim = async () => {
    if (!requireAuthOrRedirect('claim')) return;
    setIsClaiming(true);
    const toastId = toast.loading('Claiming open source fork...');

    try {
      const res = await fetch('/api/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || 'Claim failed');
      }

      toast.success(
        data.alreadyClaimed
          ? 'Already claimed! Access unlocked.'
          : 'Project successfully claimed!',
        { id: toastId }
      );

      setIsEntitled(true);
      setAccessData({
        hasArchive: data.hasArchive,
        repoUrl: data.repoUrl,
        inviteStatus: data.inviteStatus,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Claim failed';
      toast.error(message, { id: toastId });
    } finally {
      setIsClaiming(false);
    }
  };

  // Secure download trigger
  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`/api/secure-download?projectId=${projectId}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error?.message || 'Download failed');

      // Trigger browser download via signed URL
      window.location.href = data.downloadUrl;
      toast.success('Download initiated');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Download failed';
      toast.error(msg);
    } finally {
      setIsDownloading(false);
    }
  };

  // Retry GitHub invite if failed
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
        body: JSON.stringify({ projectId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Retry failed');

      toast.success('Invitation resent! Check your GitHub email.');
      setAccessData((prev) =>
        prev ? { ...prev, inviteStatus: data.inviteStatus } : null
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Retry failed';
      toast.error(msg);
    } finally {
      setIsRetryingInvite(false);
    }
  };

  const isOwner = Boolean(user && project && user.id === project.seller_id);
  const tombstone = project ? formatEpitaph(project) : '';

  // Format last commit date string
  const formattedLastCommit = useMemo(() => {
    if (!project) return null;
    const dateStr = project.last_commit_at || project.abandoned_on;
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }, [project]);

  const deadForText = useMemo(() => {
    return project?.abandoned_on ? formatDeadFor(project.abandoned_on) : null;
  }, [project]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg flex flex-col">
        <Header />
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full animate-pulse">
          <div className="h-6 w-32 bg-surface-2 rounded-full mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-8 space-y-6">
              <div className="aspect-[16/10] w-full bg-surface-2 rounded-card" />
              <div className="h-10 w-3/4 bg-surface-2 rounded-lg" />
              <div className="h-4 w-1/2 bg-surface-2 rounded" />
            </div>
            <div className="lg:col-span-4 h-96 bg-surface-2 rounded-card" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-bg flex flex-col">
        <Header />
        <main className="flex-1 max-w-4xl mx-auto px-4 py-24 text-center">
          <h1 className="text-3xl font-display font-semibold text-white mb-4">
            Codebase Not Found
          </h1>
          <p className="font-sans text-muted mb-8">
            This repository may have been permanently purged or does not exist.
          </p>
          <Button variant="primary" onClick={() => router.push('/')}>
            Back to Marketplace
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const effectiveCover = project.cover_url || (project.screenshots && project.screenshots.length > 0 ? project.screenshots[0] : null);

  return (
    <div className="min-h-screen bg-bg text-fg flex flex-col selection:bg-brand-red selection:text-white">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-sans text-sm font-medium text-muted hover:text-white mb-8 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to marketplace</span>
        </Link>

        {/* 12-Column Main Layout: Left (8 cols) + Right (4 cols sticky) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* ========================================================= */}
          {/* LEFT COLUMN: FULL PROJECT PROFILE */}
          {/* ========================================================= */}
          <div className="lg:col-span-8 space-y-10">
            {/* 1. HERO HEADER */}
            <div className="space-y-6">
              {/* Cover Art / Image Hero */}
              <div
                style={{ viewTransitionName: 'project-cover' }}
                className="relative aspect-[16/10] w-full overflow-hidden rounded-card bg-surface border border-line shadow-2xl"
              >
                {effectiveCover ? (
                  <Image
                    src={effectiveCover}
                    alt={project.title}
                    fill
                    priority
                    unoptimized
                    sizes="(max-width: 1024px) 100vw, 65vw"
                    className="object-cover"
                  />
                ) : (
                  <CoverArt
                    id={project.id}
                    title={project.title}
                    mode={project.interaction_type}
                  />
                )}

                {/* Top Badge Overlay */}
                <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                  <ModeBadge mode={project.interaction_type} size="md" />
                  {project.is_sold && <StatusBadge status="sold" />}
                  {project.is_collab_filled && <StatusBadge status="filled" />}
                </div>

                {/* Completion Chip Top-Right */}
                {project.completion_percent != null && (
                  <div className="absolute top-4 right-4 z-10 font-mono text-xs font-medium text-white/90 px-3 py-1 rounded-full bg-black/85 border border-white/15 tabular-nums">
                    {project.completion_percent}% built
                  </div>
                )}
              </div>

              {/* Title & Tagline */}
              <div className="space-y-2">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-semibold text-white tracking-tight leading-[1.1]">
                  {project.title}
                </h1>

                {project.tagline && (
                  <p className="font-sans text-lg sm:text-xl text-fg/90 leading-snug">
                    {project.tagline}
                  </p>
                )}

                {/* Tombstone line in mono */}
                {tombstone && (
                  <p className="font-mono text-xs text-muted uppercase tracking-wider pt-1">
                    {tombstone}
                  </p>
                )}
              </div>

              {/* Epitaph Pull-quote */}
              {project.epitaph && (
                <div className="p-5 rounded-2xl bg-surface border border-line/80 relative">
                  <span className="font-mono text-[10px] text-brand-red uppercase tracking-widest block mb-1">
                    Epitaph
                  </span>
                  <p className="font-serif italic text-white text-xl sm:text-2xl leading-relaxed">
                    &ldquo;{project.epitaph}&rdquo;
                  </p>
                </div>
              )}

              {/* Meta Row: uploaded date, views, license, live demo */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-3 border-y border-line text-xs font-mono text-muted">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-muted/80" />
                  <span>
                    Listed {new Date(project.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-muted/80" />
                  <span>{project.views || 0} views</span>
                </div>

                {project.license && (
                  <div className="flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-muted/80" />
                    <span>{project.license}</span>
                  </div>
                )}

                {project.demo_url && (
                  <a
                    href={project.demo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-white hover:text-brand-red ml-auto font-sans font-medium transition-colors"
                  >
                    <span>Live demo</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>

            {/* 2. SCREENSHOT GALLERY & LIGHTBOX (if screenshots exist) */}
            {project.screenshots && project.screenshots.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-sans font-semibold text-lg text-white">
                  Interface Screenshots
                </h3>
                <ScreenshotGallery
                  screenshots={project.screenshots}
                  title={project.title}
                />
              </div>
            )}

            {/* 3. STATUS AT DEATH (Unboxed stat row with large numbers) */}
            {(project.completion_percent != null || project.lines_of_code != null || formattedLastCommit || deadForText) && (
              <div className="p-6 rounded-card bg-surface border border-line space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
                  {project.completion_percent != null && (
                    <div>
                      <span className="font-mono text-[11px] text-muted uppercase tracking-wider block">
                        Completion
                      </span>
                      <span className="font-sans font-semibold text-2xl sm:text-3xl text-white tabular-nums">
                        {project.completion_percent}%
                      </span>
                    </div>
                  )}

                  {project.lines_of_code != null && (
                    <div>
                      <span className="font-mono text-[11px] text-muted uppercase tracking-wider block">
                        Lines of code
                      </span>
                      <span className="font-mono font-medium text-2xl sm:text-3xl text-white tabular-nums">
                        {formatLOC(project.lines_of_code)}
                      </span>
                    </div>
                  )}

                  {formattedLastCommit && (
                    <div>
                      <span className="font-mono text-[11px] text-muted uppercase tracking-wider block">
                        Last commit
                      </span>
                      <span className="font-sans font-semibold text-2xl sm:text-3xl text-white">
                        {formattedLastCommit}
                      </span>
                    </div>
                  )}

                  {deadForText && (
                    <div>
                      <span className="font-mono text-[11px] text-muted uppercase tracking-wider block">
                        Dead for
                      </span>
                      <span className="font-mono font-medium text-2xl sm:text-3xl text-brand-red tabular-nums">
                        {deadForText}
                      </span>
                    </div>
                  )}
                </div>

                {/* Thin progress bar */}
                {project.completion_percent != null && (
                  <div className="space-y-1.5 pt-1">
                    <div className="w-full h-1.5 rounded-full bg-surface-2 overflow-hidden">
                      <div
                        className="h-full bg-brand-red rounded-full transition-all duration-500"
                        style={{ width: `${project.completion_percent}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 4. ABOUT THIS PROJECT (Sanitized Markdown) */}
            <div className="space-y-3">
              <h3 className="font-sans font-semibold text-xl text-white">
                About this project
              </h3>
              <div className="p-6 rounded-card bg-surface border border-line">
                <MarkdownRenderer
                  content={project.description || 'No detailed documentation has been published.'}
                />
              </div>
            </div>

            {/* 5. WHAT WORKS / WHAT'S LEFT */}
            {((project.features && project.features.length > 0) || (project.todo_items && project.todo_items.length > 0)) && (
              <div className="space-y-4">
                <h3 className="font-sans font-semibold text-xl text-white">
                  State of the codebase
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left: What works */}
                  {project.features && project.features.length > 0 && (
                    <div className="p-5 rounded-card bg-surface border border-line space-y-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-neon-green" />
                        <h4 className="font-sans font-semibold text-base text-white">
                          What works
                        </h4>
                      </div>
                      <ul className="space-y-2">
                        {project.features.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-fg/85">
                            <span className="text-neon-green font-bold shrink-0 mt-0.5">✓</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Right: What's left */}
                  {project.todo_items && project.todo_items.length > 0 && (
                    <div className="p-5 rounded-card bg-surface border border-line space-y-3">
                      <div className="flex items-center gap-2">
                        <Circle className="w-4 h-4 text-amber" />
                        <h4 className="font-sans font-semibold text-base text-white">
                          What&apos;s left / Known gaps
                        </h4>
                      </div>
                      <ul className="space-y-2">
                        {project.todo_items.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-fg/80">
                            <span className="text-amber font-bold shrink-0 mt-0.5">○</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 6. TECH STACK */}
            {project.tech_stack && project.tech_stack.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-sans font-semibold text-xl text-white">
                  Built with
                </h3>
                <div className="flex flex-wrap items-center gap-2 p-5 rounded-card bg-surface border border-line">
                  {project.tech_stack.map((tech) => (
                    <TechBadge key={tech} tech={tech} size="md" />
                  ))}
                </div>
              </div>
            )}

            {/* 7. WHAT'S INSIDE (File tree viewer) */}
            {project.file_tree && project.file_tree.length > 0 && (
              <FileTreeViewer paths={project.file_tree} />
            )}

            {/* 8. SETUP NOTES */}
            {project.setup_notes && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-brand-red" />
                  <h3 className="font-sans font-semibold text-xl text-white">
                    Setup &amp; Running
                  </h3>
                </div>
                <div className="p-6 rounded-card bg-surface border border-line">
                  <MarkdownRenderer content={project.setup_notes} />
                </div>
              </div>
            )}

            {/* 9. COLLAB ROLES (For collab listings) */}
            {project.interaction_type === 'collab' && project.collab_roles && project.collab_roles.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-accent" />
                  <h3 className="font-sans font-semibold text-xl text-white">
                    Open collaboration roles
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {project.collab_roles.map((role: CollabRole, rIdx: number) => (
                    <div
                      key={rIdx}
                      className="p-5 rounded-card bg-surface border border-line space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-sans font-semibold text-base text-white">
                          {role.role}
                        </h4>
                        <span className="font-mono text-[11px] text-blue-accent px-2 py-0.5 rounded-full bg-blue-accent/10 border border-blue-accent/30 shrink-0">
                          {role.commitment}
                        </span>
                      </div>
                      <p className="font-sans text-xs text-fg/80 leading-relaxed">
                        {role.description}
                      </p>
                    </div>
                  ))}
                </div>

                {project.collab_terms && (
                  <div className="p-4 rounded-xl bg-blue-accent/10 border border-blue-accent/20 flex items-center justify-between gap-4">
                    <span className="font-sans text-xs sm:text-sm text-blue-accent/90">
                      <strong>Compensation Terms:</strong> {project.collab_terms}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* 10. RECOMMENDATIONS: More from this seller & Similar projects */}
            {(moreFromSeller.length > 0 || similarProjects.length > 0) && (
              <div className="pt-8 border-t border-line space-y-8">
                {moreFromSeller.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-sans font-semibold text-lg text-white">
                      More from @{seller?.username || 'operative'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {moreFromSeller.map((p) => (
                        <CompactProjectCard key={p.id} project={p} />
                      ))}
                    </div>
                  </div>
                )}

                {similarProjects.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-sans font-semibold text-lg text-white">
                      Similar codebases
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {similarProjects.map((p) => (
                        <CompactProjectCard key={p.id} project={p} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* RIGHT COLUMN: STICKY MODE-SPECIFIC ACTION PANEL */}
          {/* ========================================================= */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
            <div className="rounded-card bg-surface border border-line p-6 shadow-xl space-y-6">
              {/* Header: Mode & Price */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="font-mono text-xs text-muted uppercase tracking-wider block mb-1">
                    {project.interaction_type === 'buy' ? 'Acquisition Price' : 'Listing Mode'}
                  </span>
                  <div className="font-mono text-3xl font-bold text-white tabular-nums">
                    {project.interaction_type === 'buy'
                      ? formatINR(project.price_paise, { showFreeForZero: false })
                      : project.interaction_type === 'adopt'
                      ? 'Free'
                      : 'Open Collab'}
                  </div>
                </div>
                <ModeBadge mode={project.interaction_type} size="md" />
              </div>

              {/* ACTION BUTTONS (Context-Aware) */}
              <div className="space-y-3">
                {isOwner ? (
                  <div className="space-y-2">
                    <div className="p-3 rounded-xl bg-surface-2 border border-line flex items-center gap-2 text-xs font-mono text-white">
                      <UserCheck className="w-4 h-4 text-neon-green" />
                      <span>You are the author of this listing</span>
                    </div>
                    <Button
                      variant="secondary"
                      className="w-full"
                      onClick={() => router.push(`/edit/${project.id}`)}
                    >
                      <Edit className="w-4 h-4" />
                      <span>Edit Listing Details</span>
                    </Button>
                  </div>
                ) : isEntitled ? (
                  <div className="space-y-3 p-4 rounded-xl bg-neon-green/10 border border-neon-green/30">
                    <div className="flex items-center gap-2 text-neon-green font-mono text-xs font-semibold">
                      <ShieldCheck className="w-4 h-4" />
                      <span>ACCESS UNLOCKED (VAULT)</span>
                    </div>

                    {accessData?.hasArchive && (
                      <Button
                        variant="primary"
                        className="w-full !bg-neon-green !text-black"
                        onClick={handleDownload}
                        disabled={isDownloading}
                      >
                        <Download className="w-4 h-4" />
                        <span>{isDownloading ? 'Preparing ZIP...' : 'Download Code Archive'}</span>
                      </Button>
                    )}

                    {accessData?.repoUrl && (
                      <div className="space-y-2">
                        <a
                          href={accessData.repoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full inline-flex items-center justify-center gap-2 h-11 px-6 rounded-full bg-white text-black font-sans font-semibold text-sm hover:bg-neutral-200 transition-colors"
                        >
                          <Github className="w-4 h-4" />
                          <span>Open GitHub Repository</span>
                        </a>

                        {accessData.inviteStatus === 'failed' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            className="w-full text-xs"
                            onClick={handleRetryInvite}
                            disabled={isRetryingInvite}
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Retry Collaborator Invitation</span>
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ) : project.is_sold ? (
                  <Button variant="secondary" disabled className="w-full opacity-60 cursor-not-allowed">
                    <Archive className="w-4 h-4" />
                    <span>Project Sold Out</span>
                  </Button>
                ) : project.is_collab_filled ? (
                  <Button variant="secondary" disabled className="w-full opacity-60 cursor-not-allowed">
                    <Users className="w-4 h-4" />
                    <span>Collaboration Filled</span>
                  </Button>
                ) : project.interaction_type === 'buy' ? (
                  <Button
                    variant="primary"
                    mode="buy"
                    className="w-full !h-12 !text-base"
                    onClick={() => {
                      if (requireAuthOrRedirect('buy')) {
                        setIsBuyModalOpen(true);
                      }
                    }}
                  >
                    <span>Acquire Codebase</span>
                  </Button>
                ) : project.interaction_type === 'adopt' ? (
                  <Button
                    variant="primary"
                    mode="adopt"
                    className="w-full !h-12 !text-base"
                    onClick={handleClaim}
                    disabled={isClaiming}
                  >
                    <span>{isClaiming ? 'Claiming Fork...' : 'Claim & Fork Code'}</span>
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    mode="collab"
                    className="w-full !h-12 !text-base"
                    onClick={() => {
                      if (requireAuthOrRedirect('apply')) {
                        setIsCollabModalOpen(true);
                      }
                    }}
                  >
                    <span>Apply for Collaboration</span>
                  </Button>
                )}
              </div>

              {/* WHAT YOU GET CHECKLIST (Data-Driven) */}
              <div className="space-y-3 pt-4 border-t border-line">
                <span className="font-mono text-xs text-muted uppercase tracking-wider block">
                  What you get
                </span>
                <ul className="space-y-2 text-xs sm:text-sm font-sans text-fg/85">
                  {project.has_archive && (
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-neon-green shrink-0" />
                      <span>Full source code archive (.zip)</span>
                    </li>
                  )}
                  {project.has_repo && (
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-neon-green shrink-0" />
                      <span>Direct GitHub repository invitation</span>
                    </li>
                  )}
                  {project.license && (
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-neon-green shrink-0" />
                      <span>{project.license} license rights</span>
                    </li>
                  )}
                  {project.setup_notes && (
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-neon-green shrink-0" />
                      <span>Setup &amp; configuration documentation</span>
                    </li>
                  )}
                  {project.demo_url && (
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-neon-green shrink-0" />
                      <span>Live demonstration preview</span>
                    </li>
                  )}
                  {project.interaction_type === 'collab' && (
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-blue-accent shrink-0" />
                      <span>{project.collab_roles?.length || 1} defined role slots ({project.collab_terms || 'Terms to discuss'})</span>
                    </li>
                  )}
                </ul>
              </div>

              {/* SELLER PROFILE CARD */}
              <div className="pt-4 border-t border-line space-y-3">
                <span className="font-mono text-xs text-muted uppercase tracking-wider block">
                  Original Author
                </span>
                <div className="flex items-start gap-3">
                  <Avatar
                    src={seller?.avatar_url}
                    username={seller?.username || 'operative'}
                    size="md"
                    className="w-10 h-10 shrink-0"
                  />
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-sans font-semibold text-sm text-white truncate">
                        @{seller?.username || 'operative'}
                      </span>
                      {seller?.reputation_score != null && (
                        <span className="font-mono text-[10px] text-neon-green/90 px-1.5 py-0.5 rounded-full bg-neon-green/10 border border-neon-green/30">
                          {seller.reputation_score} rep
                        </span>
                      )}
                    </div>
                    {seller?.bio && (
                      <p className="font-sans text-xs text-muted line-clamp-2 leading-relaxed">
                        {seller.bio}
                      </p>
                    )}
                    <span className="font-mono text-[11px] text-muted/70 block">
                      {sellerListingCount} {sellerListingCount === 1 ? 'project listed' : 'projects listed'}
                    </span>
                  </div>
                </div>

                {!isOwner && user && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs text-muted hover:text-white"
                    onClick={() => router.push(`/dashboard?tab=messages&to=${project.seller_id}`)}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Send Message to Seller</span>
                  </Button>
                )}
              </div>

              {/* Project ID copy chip */}
              <div className="pt-3 border-t border-line/60 flex items-center justify-between text-[11px] font-mono text-muted">
                <span>PROJECT_ID</span>
                <button
                  type="button"
                  onClick={copyId}
                  className="flex items-center gap-1 hover:text-white transition-colors"
                >
                  <span className="max-w-[120px] truncate">{project.id}</span>
                  {copiedId ? <Check className="w-3 h-3 text-neon-green" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Sticky Bottom Action Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0a0a0b]/95 border-t border-line p-4 flex items-center justify-between gap-4">
        <div>
          <span className="font-mono text-xs text-muted block">
            {project.interaction_type === 'buy' ? 'Price' : 'Mode'}
          </span>
          <span className="font-mono text-lg font-bold text-white">
            {project.interaction_type === 'buy'
              ? formatINR(project.price_paise, { showFreeForZero: false })
              : project.interaction_type === 'adopt'
              ? 'Free'
              : 'Collab'}
          </span>
        </div>

        {isOwner ? (
          <Button variant="secondary" size="sm" onClick={() => router.push(`/edit/${project.id}`)}>
            Edit Listing
          </Button>
        ) : isEntitled ? (
          <Button variant="primary" mode="buy" size="sm" onClick={handleDownload} disabled={isDownloading}>
            Download ZIP
          </Button>
        ) : project.is_sold || project.is_collab_filled ? (
          <Button variant="secondary" size="sm" disabled>
            Closed
          </Button>
        ) : project.interaction_type === 'buy' ? (
          <Button variant="primary" mode="buy" size="sm" onClick={() => requireAuthOrRedirect('buy') && setIsBuyModalOpen(true)}>
            Acquire
          </Button>
        ) : project.interaction_type === 'adopt' ? (
          <Button variant="primary" mode="adopt" size="sm" onClick={handleClaim} disabled={isClaiming}>
            Claim Free
          </Button>
        ) : (
          <Button variant="primary" mode="collab" size="sm" onClick={() => requireAuthOrRedirect('apply') && setIsCollabModalOpen(true)}>
            Apply
          </Button>
        )}
      </div>

      <Footer />

      {/* Payment Checkout Modal */}
      {isBuyModalOpen && (
        <PaymentModal
          isOpen={isBuyModalOpen}
          onClose={() => setIsBuyModalOpen(false)}
          project={project}
          onSuccess={() => {
            setIsBuyModalOpen(false);
            setIsEntitled(true);
            setProject((prev) => (prev ? { ...prev, is_sold: true } : null));
          }}
        />
      )}

      {/* Collab Request Application Modal */}
      {isCollabModalOpen && (
        <CollabRequestModal
          isOpen={isCollabModalOpen}
          onClose={() => setIsCollabModalOpen(false)}
          project={project}
          onSuccess={() => {
            setIsCollabModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
