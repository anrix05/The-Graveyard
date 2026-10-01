'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  Skull,
  ArrowDown,
  ArrowRight,
  Flame,
  Sparkles,
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FilterBar, { SortOption } from '@/components/FilterBar';
import ProjectCard from '@/components/ProjectCard';
import FeaturedResurrections from '@/components/FeaturedResurrections';
import HowItWorksStack from '@/components/HowItWorksStack';
import { ProjectCardSkeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';
import PaymentModal from '@/components/PaymentModal';
import CollabRequestModal from '@/components/CollabRequestModal';
import SplitText from '@/components/motion/SplitText';
import Reveal from '@/components/motion/Reveal';
import Magnetic from '@/components/motion/Magnetic';
import { motion } from 'framer-motion';
import { useIntroDone } from '@/hooks/useIntroDone';
import { Project, InteractionType, MarketplaceStats } from '@/types/project';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { extractFeaturedFromList } from '@/lib/featured';
import { toast } from 'sonner';

// Dynamically import heavy interactive motion components on client only
const SoulsCanvas = dynamic(() => import('@/components/hero/SoulsCanvas'), { ssr: false });
const CustomCursor = dynamic(() => import('@/components/motion/CustomCursor'), { ssr: false });
const TechMarquee = dynamic(() => import('@/components/TechMarquee'), { ssr: false });
const ResurrectedWall = dynamic(() => import('@/components/ResurrectedWall'), { ssr: false });

export default function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const introDone = useIntroDone();

  // Search & Filter State (synced to URL)
  const initialMode = (searchParams.get('mode') as InteractionType) || 'all';
  const initialSearch = searchParams.get('q') || searchParams.get('search') || '';
  const initialSort = (searchParams.get('sort') as SortOption) || 'newest';
  const initialTechs = searchParams.get('tech')
    ? searchParams.get('tech')!.split(',').filter(Boolean)
    : [];
  const initialIncludeResurrected = searchParams.get('resurrected') === 'true';

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [activeMode, setActiveMode] = useState<InteractionType | 'all'>(initialMode);
  const [selectedTechs, setSelectedTechs] = useState<string[]>(initialTechs);
  const [activeSort, setActiveSort] = useState<SortOption>(initialSort);
  const [includeResurrected, setIncludeResurrected] = useState(initialIncludeResurrected);

  // Debounce search input (250ms)
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedQuery(searchQuery), 250);
    return () => clearTimeout(handler);
  }, [searchQuery]);
  const deferredQuery = React.useDeferredValue(debouncedQuery);

  // Feed pagination state (batches of 12)
  const [visibleLimit, setVisibleLimit] = useState(12);

  // Reset pagination on filter or search changes
  useEffect(() => {
    setVisibleLimit(12);
  }, [searchQuery, activeMode, selectedTechs, activeSort, includeResurrected]);

  // Data states
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<MarketplaceStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [selectedProjectForBuy, setSelectedProjectForBuy] = useState<Project | null>(null);
  const [selectedProjectForCollab, setSelectedProjectForCollab] = useState<Project | null>(null);

  // Sync state to URL search parameters without breaking canonical '/'
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (activeMode !== 'all') params.set('mode', activeMode);
    if (selectedTechs.length > 0) params.set('tech', selectedTechs.join(','));
    if (activeSort !== 'newest') params.set('sort', activeSort);
    if (includeResurrected) params.set('resurrected', 'true');

    const newUrl = params.toString() ? `/?${params.toString()}` : '/';
    window.history.replaceState(null, '', newUrl);
  }, [searchQuery, activeMode, selectedTechs, activeSort, includeResurrected]);

  // Fetch projects and stats
  const fetchMarketplaceData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch RPC Stats
      const { data: statsData, error: statsErr } = await supabase.rpc('get_marketplace_stats');
      if (!statsErr && statsData) {
        setStats(statsData as MarketplaceStats);
      }

      // 2. Fetch Projects (Resilient to unapplied migrations)
      let rawProjects: any[] | null = null;
      let projectsErr: any = null;

      const primaryRes = await supabase
        .from('projects')
        .select(`
          *,
          seller:profiles!projects_seller_id_fkey(
            id,
            username,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (primaryRes.error) {
        console.warn('Primary fetch with seller join failed, trying plain select fallback:', primaryRes.error.message);
        const fallbackRes = await supabase
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false });

        if (fallbackRes.error) {
          projectsErr = fallbackRes.error;
        } else {
          rawProjects = fallbackRes.data || [];
          if (rawProjects.length > 0) {
            const sellerIds = Array.from(new Set(rawProjects.map((p) => p.seller_id).filter(Boolean)));
            if (sellerIds.length > 0) {
              const { data: profs } = await supabase
                .from('profiles')
                .select('id, username, avatar_url')
                .in('id', sellerIds);

              const profMap = new Map((profs || []).map((pr) => [pr.id, pr]));
              rawProjects = rawProjects.map((p) => ({
                ...p,
                seller: profMap.get(p.seller_id) || null,
              }));
            }
          }
        }
      } else {
        rawProjects = primaryRes.data || [];
      }

      if (projectsErr) {
        console.error('Failed to load projects:', projectsErr.message);
        toast.error('Could not load marketplace projects');
      } else if (rawProjects) {
        const normalized: Project[] = rawProjects
          .filter((p) => !p.is_archived)
          .map((p) => {
            let pricePaise = 0;
            if (p.price_paise !== undefined && p.price_paise !== null) {
              pricePaise = Number(p.price_paise);
            } else if (p.price !== undefined && p.price !== null) {
              pricePaise = Math.round(Number(p.price) * 100);
            }

            return {
              ...p,
              price_paise: pricePaise,
              cause_of_death: p.cause_of_death || 'other',
              abandoned_on: p.abandoned_on || null,
              last_commit_at: p.last_commit_at || null,
              epitaph: p.epitaph || null,
              revived_at: p.revived_at || null,
              views: p.views || 0,
              has_archive: Boolean(p.has_archive),
              has_repo: Boolean(p.has_repo),
              is_sold: Boolean(p.is_sold),
              is_collab_filled: Boolean(p.is_collab_filled),
              is_archived: Boolean(p.is_archived),
            } as Project;
          });

        setAllProjects(normalized);
      }
    } catch (err: unknown) {
      console.error('Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketplaceData();
  }, []);

  // Separate revived projects for Resurrected Wall
  const revivedProjects = useMemo(() => {
    return allProjects.filter((p) => p.is_sold || p.is_collab_filled || p.revived_at);
  }, [allProjects]);

  // Top featured projects for bento grid using Workstream A algorithm
  const featuredProjects = useMemo(() => {
    return extractFeaturedFromList(allProjects);
  }, [allProjects]);

  // Client-side filtering & single-source counts
  const { filteredFeed, synchronizedCounts } = useMemo(() => {
    const query = deferredQuery.toLowerCase().trim();

    // Base filter (search, tech stack, and resurrected toggle)
    const baseList = allProjects.filter((p) => {
      // Sold/filled visibility
      if (!includeResurrected && (p.is_sold || p.is_collab_filled)) {
        return false;
      }

      // Search match
      if (query) {
        const titleMatch = p.title.toLowerCase().includes(query);
        const descMatch = (p.description || '').toLowerCase().includes(query);
        const epitaphMatch = (p.epitaph || '').toLowerCase().includes(query);
        const techMatch = Array.isArray(p.tech_stack) && p.tech_stack.some((t) => t.toLowerCase().includes(query));
        if (!titleMatch && !descMatch && !epitaphMatch && !techMatch) return false;
      }

      // Tech Stack filter
      if (selectedTechs.length > 0) {
        const hasMatch = Array.isArray(p.tech_stack) && selectedTechs.some((st) =>
          p.tech_stack.some((pt) => pt.toLowerCase() === st.toLowerCase())
        );
        if (!hasMatch) return false;
      }

      return true;
    });

    // Counts reflecting current filters
    const counts = {
      all: baseList.length,
      buy: baseList.filter((p) => p.interaction_type === 'buy').length,
      adopt: baseList.filter((p) => p.interaction_type === 'adopt').length,
      collab: baseList.filter((p) => p.interaction_type === 'collab').length,
    };

    // Mode specific filter
    let modeFiltered = baseList;
    if (activeMode !== 'all') {
      modeFiltered = baseList.filter((p) => p.interaction_type === activeMode);
    }

    // Sorting
    const sorted = [...modeFiltered].sort((a, b) => {
      if (activeSort === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (activeSort === 'views') {
        return (b.views || 0) - (a.views || 0);
      }
      if (activeSort === 'price_asc') {
        return (a.price_paise || 0) - (b.price_paise || 0);
      }
      if (activeSort === 'price_desc') {
        return (b.price_paise || 0) - (a.price_paise || 0);
      }
      if (activeSort === 'longest_dead') {
        const dateA = a.abandoned_on ? new Date(a.abandoned_on).getTime() : 0;
        const dateB = b.abandoned_on ? new Date(b.abandoned_on).getTime() : 0;
        return dateA - dateB;
      }
      return 0;
    });

    return { filteredFeed: sorted, synchronizedCounts: counts };
  }, [allProjects, deferredQuery, activeMode, selectedTechs, activeSort, includeResurrected]);

  // Card action dispatcher
  const handleCardAction = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();

    // If unauthenticated, redirect with intent
    if (!user) {
      router.push(`/login?next=/project/${project.id}&intent=${project.interaction_type}`);
      return;
    }

    if (project.interaction_type === 'buy') {
      setSelectedProjectForBuy(project);
    } else if (project.interaction_type === 'adopt') {
      executeClaim(project);
    } else if (project.interaction_type === 'collab') {
      setSelectedProjectForCollab(project);
    }
  };

  // Instant free claim
  const executeClaim = async (project: Project) => {
    try {
      const res = await fetch('/api/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to claim project');
      }

      if (data.alreadyClaimed) {
        toast.info('Already in your Vault', {
          description: 'You have already claimed this repository.',
        });
      } else {
        toast.success('Project claimed successfully!', {
          description: 'Added to your Operative Vault with instant download access.',
        });
        if (data.transactionId) {
          router.push(`/orders/${data.transactionId}`);
          return;
        }
      }
      fetchMarketplaceData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Claim failed';
      toast.error(msg);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setActiveMode('all');
    setSelectedTechs([]);
    setActiveSort('newest');
    setIncludeResurrected(false);
  };

  return (
    <div className="min-h-dvh bg-bg text-fg flex flex-col font-sans">
      <CustomCursor />
      <Header />

      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        {/* ================= HERO SECTION ================= */}
        <section className="relative min-h-[min(88svh,900px)] landscape-short-auto flex flex-col justify-center items-center text-center px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-10 sm:pb-12 overflow-hidden select-none">
          {/* Static Film Grain (High tier only, no blend mode) */}
          <div className="hero-grain" />

          {/* Souls Particle Canvas (renders background glow, canvas or CSS fallback) */}
          <SoulsCanvas />

          <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center space-y-5 sm:space-y-6">
            {/* Status Pill */}
            <motion.div
              data-hero-text
              initial={{ opacity: 0, y: 8 }}
              animate={introDone ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
              transition={{ duration: 0.5, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-2 border border-line text-xs font-mono flex-wrap justify-center max-w-full"
            >
              <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse shrink-0" />
              <span className="text-muted">Live terminal</span>
              <span className="text-line">•</span>
              <span className="text-white font-medium">
                {stats?.resurrected || 14} codebases resurrected
              </span>
            </motion.div>

            {/* Main Headline: Fits at 320px without breaking words */}
            <h1
              data-hero-text
              className="text-hero-display font-display font-semibold text-white tracking-tight leading-[0.98] text-balance break-anywhere max-w-[14ch] mx-auto hyphens-auto"
            >
              <span className="block">
                <SplitText delay={0.08}>Where dead code</SplitText>
              </span>
              <motion.span
                className="block mt-1 sm:mt-2"
                initial={{ opacity: 0, y: 12 }}
                animate={introDone ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
                transition={{ duration: 0.6, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
              >
                <span>gets </span>
                <span className="font-accent italic font-normal text-brand-red inline-block">
                  resurrected
                </span>
              </motion.span>
            </h1>

            {/* Subline: max-width 58ch, readable font sizing, non-breaking co-founder */}
            <p
              data-hero-text
              className="font-sans text-base sm:text-lg lg:text-xl text-fg/75 max-w-[58ch] mx-auto leading-relaxed break-anywhere [text-wrap:pretty] hyphens-manual"
            >
              Abandoned prototypes, unlaunched MVPs, and dormant repositories get a second life.
              Buy exclusive IP, claim free open forks, or find a <span className="whitespace-nowrap">co&#8209;founder</span>.
            </p>

            {/* Hero CTAs: Stack full-width on mobile */}
            <div
              data-hero-text
              className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 pt-3 w-full sm:w-auto max-w-xs sm:max-w-none"
            >
              <Magnetic>
                <a
                  href="#marketplace-feed"
                  className="inline-flex items-center justify-center h-[48px] sm:h-[52px] px-8 rounded-full bg-white text-black font-sans font-semibold text-[15px] hover:bg-neutral-200 transition-colors shadow-lg w-full sm:w-auto"
                >
                  Browse projects
                </a>
              </Magnetic>

              <Link
                href="/submit"
                className="inline-flex items-center justify-center h-[48px] sm:h-[52px] px-8 rounded-full bg-surface-2 border border-line text-white hover:border-white/20 hover:bg-surface-3 transition-colors text-[15px] font-medium w-full sm:w-auto"
              >
                List a dead project
              </Link>
            </div>

            {/* Centered Scroll Indicator - hidden on landscape short heights */}
            <div
              data-hero-text
              className="pt-6 sm:pt-8 landscape-short-hidden flex flex-col items-center gap-2 select-none pointer-events-none"
            >
              <span className="font-mono text-[11px] uppercase tracking-widest text-muted">Scroll</span>
              <div className="w-[1.5px] h-8 bg-line relative overflow-hidden rounded-full">
                <div className="w-full h-1/2 bg-white/70 animate-scroll-indicator" />
              </div>
            </div>
          </div>
        </section>

        {/* ================= UNBOXED LIVE STATS ROW ================= */}
        <section className="py-10 sm:py-12 border-t border-line/60 bg-surface/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 text-center">
              <div className="space-y-1">
                <div className="text-2xl sm:text-4xl lg:text-5xl font-display font-semibold text-white tabular-nums">
                  {stats?.live_total || allProjects.filter((p) => !p.is_sold && !p.is_collab_filled).length}
                </div>
                <div className="font-mono text-[11px] uppercase tracking-widest text-muted">
                  Live projects
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-2xl sm:text-4xl lg:text-5xl font-display font-semibold text-neon-green tabular-nums">
                  {stats?.for_sale || allProjects.filter((p) => p.interaction_type === 'buy' && !p.is_sold).length}
                </div>
                <div className="font-mono text-[11px] uppercase tracking-widest text-muted">
                  For sale
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-2xl sm:text-4xl lg:text-5xl font-display font-semibold text-amber tabular-nums">
                  {stats?.free_forks || allProjects.filter((p) => p.interaction_type === 'adopt').length}
                </div>
                <div className="font-mono text-[11px] uppercase tracking-widest text-muted">
                  Free forks
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-2xl sm:text-4xl lg:text-5xl font-display font-semibold text-blue-accent tabular-nums">
                  {stats?.open_collabs || allProjects.filter((p) => p.interaction_type === 'collab' && !p.is_collab_filled).length}
                </div>
                <div className="font-mono text-[11px] uppercase tracking-widest text-muted">
                  Open collabs
                </div>
              </div>

              <div className="space-y-1 col-span-2 sm:col-span-1">
                <div className="text-2xl sm:text-4xl lg:text-5xl font-display font-semibold text-brand-red tabular-nums">
                  {stats?.resurrected || revivedProjects.length}
                </div>
                <div className="font-mono text-[11px] uppercase tracking-widest text-muted">
                  Resurrected
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= TECH MARQUEE ================= */}
        <TechMarquee />

        {/* ================= HOW IT WORKS STACK ================= */}
        <HowItWorksStack />

        {/* ================= FEATURED RESURRECTIONS BENTO ================= */}
        {featuredProjects.length >= 2 && (
          <FeaturedResurrections
            projects={featuredProjects}
            onActionClick={handleCardAction}
          />
        )}

        {/* ================= STICKY FILTER BAR & MAIN FEED ================= */}
        <div id="marketplace-feed" className="scroll-mt-24">
          <FilterBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            activeMode={activeMode}
            setActiveMode={setActiveMode}
            selectedTechs={selectedTechs}
            setSelectedTechs={setSelectedTechs}
            activeSort={activeSort}
            setActiveSort={setActiveSort}
            includeResurrected={includeResurrected}
            setIncludeResurrected={setIncludeResurrected}
            totalMatching={filteredFeed.length}
            counts={synchronizedCounts}
            onClearFilters={handleClearFilters}
          />

          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {isLoading ? (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(clamp(260px,22vw,340px),1fr))] gap-6 items-stretch">
                {Array.from({ length: 6 }).map((_, i) => (
                  <ProjectCardSkeleton key={i} />
                ))}
              </div>
            ) : filteredFeed.length > 0 ? (
              <>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(clamp(260px,22vw,340px),1fr))] gap-6 items-stretch">
                  {filteredFeed.slice(0, visibleLimit).map((project, idx) => (
                    <Reveal key={project.id} delay={Math.min(idx * 0.04, 0.3)}>
                      <ProjectCard
                        project={project}
                        onActionClick={handleCardAction}
                      />
                    </Reveal>
                  ))}
                </div>

                {filteredFeed.length > visibleLimit && (
                  <div className="pt-12 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setVisibleLimit((prev) => prev + 12)}
                      className="h-12 px-8 rounded-full bg-surface-2 border border-line text-white hover:border-white/20 hover:bg-surface-3 transition-colors text-sm font-medium shadow-md flex items-center gap-2"
                    >
                      <span>Load more dead codebases</span>
                      <span className="font-mono text-xs text-muted">
                        ({filteredFeed.length - visibleLimit} remaining)
                      </span>
                    </button>
                  </div>
                )}
              </>
            ) : (
              <EmptyState
                title="No dead projects match your criteria"
                description="Try loosening your filters or search keywords to uncover other buried codebases."
                actionLabel="Clear all filters"
                onAction={handleClearFilters}
              />
            )}
          </section>
        </div>

        {/* ================= RESURRECTED WALL ================= */}
        <div className="contain-content-auto">
          <ResurrectedWall projects={revivedProjects} />
        </div>

        {/* ================= CTA BAND ================= */}
        <section className="py-24 relative overflow-hidden text-center border-t border-line contain-content-auto">
          <div className="ambient-glow-cta top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          <div className="relative z-10 max-w-2xl mx-auto px-4 space-y-6">
            <h2 className="text-3xl sm:text-5xl font-display font-semibold text-white tracking-tight">
              Got a dead project?
            </h2>
            <p className="font-sans text-muted text-base sm:text-lg">
              Don’t let your engineering rot in private repos. Pass it to a builder who will ship it.
            </p>
            <div>
              <Magnetic>
                <Link
                  href="/submit"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-black font-sans font-semibold text-sm hover:bg-neutral-200 transition-colors shadow-xl"
                >
                  <span>List it now</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Magnetic>
            </div>
          </div>
        </section>
      </main>

      {/* ================= MODALS ================= */}
      {selectedProjectForBuy && (
        <PaymentModal
          project={selectedProjectForBuy}
          isOpen={Boolean(selectedProjectForBuy)}
          onClose={() => setSelectedProjectForBuy(null)}
          onSuccess={(transactionId) => {
            fetchMarketplaceData();
            setSelectedProjectForBuy(null);
            if (transactionId) {
              router.push(`/orders/${transactionId}`);
            }
          }}
        />
      )}

      {selectedProjectForCollab && (
        <CollabRequestModal
          project={selectedProjectForCollab}
          isOpen={Boolean(selectedProjectForCollab)}
          onClose={() => setSelectedProjectForCollab(null)}
          onSuccess={() => {
            fetchMarketplaceData();
            const projId = selectedProjectForCollab.id;
            setSelectedProjectForCollab(null);
            router.push(`/collab/sent?project=${projId}`);
          }}
        />
      )}

      <Footer />
    </div>
  );
}
