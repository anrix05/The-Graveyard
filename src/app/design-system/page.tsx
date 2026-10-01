'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ModeBadge, StatusBadge } from '@/components/ui/badge';
import TechBadge from '@/components/TechBadge';
import ProjectCard from '@/components/ProjectCard';
import FeaturedResurrections from '@/components/FeaturedResurrections';
import CardFooter from '@/components/CardFooter';
import CoverArt from '@/components/CoverArt';
import TechMarquee from '@/components/TechMarquee';
import ScreenshotGallery from '@/components/project/ScreenshotGallery';
import FileTreeViewer from '@/components/project/FileTreeViewer';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';
import usePerfTier from '@/hooks/usePerfTier';
import useHeroFxMode from '@/hooks/useHeroFxMode';
import { HeroFxMode } from '@/lib/perf';
import SoulsCanvas from '@/components/hero/SoulsCanvas';
import { Project } from '@/types/project';
import { ArrowRight, CheckCircle2, Circle, Clock, Code2, Users, RotateCcw } from 'lucide-react';
import { formatLOC, formatDeadFor } from '@/lib/format';
import { replayIntro } from '@/lib/intro';
import SkullMark from '@/components/brand/SkullMark';

const SAMPLE_PROJECTS: Project[] = [
  {
    id: 'sample-buy-1',
    seller_id: 'dev-1',
    title: 'InvoiceForge Multi-Tenant',
    tagline: 'Multi-tenant invoicing SaaS with GST-ready PDFs.',
    description: 'A production-tested invoicing application built for Indian and global freelancers. Features recurring invoice generation, dynamic PDF watermarking, and client magic links.',
    interaction_type: 'buy',
    price_paise: 499900,
    tech_stack: ['nextjs', 'typescript', 'supabase', 'tailwind'],
    cause_of_death: 'lost_interest',
    abandoned_on: '2025-03-10',
    last_commit_at: '2025-03-24T10:00:00Z',
    created_at: '2025-03-10T00:00:00Z',
    completion_percent: 85,
    lines_of_code: 14200,
    epitaph: 'Sent 40 invoices. Got paid for none of them, including my own.',
    has_archive: true,
    has_repo: true,
    is_sold: false,
    views: 420,
    features: [
      'Multi-tenant workspaces with strict Supabase RLS policies',
      'GST-ready invoice PDFs with CGST, SGST, IGST automated split',
      'Automated recurring invoices with cron schedules',
      'Client portal with instant magic-link authentication',
      'One-click CSV & JSON ledger exports'
    ],
    todo_items: [
      'Credit note generator & multi-currency invoice rates',
      'Mobile responsive invoice visual editor canvas'
    ],
    setup_notes: '### Quickstart\n\n```bash\npnpm install\npnpm supabase start\npnpm dev\n```\n\n**Required Environment Variables:**\n- `NEXT_PUBLIC_SUPABASE_URL`\n- `NEXT_PUBLIC_SUPABASE_ANON_KEY`\n- `PAYMENT_KEY_ID`',
    file_tree: [
      'app/(dashboard)/invoices/page.tsx',
      'app/(dashboard)/clients/page.tsx',
      'app/api/invoices/[id]/pdf/route.ts',
      'components/invoice/InvoiceEditor.tsx',
      'lib/gst.ts',
      'lib/pdf/template.tsx',
      'supabase/migrations/0001_init.sql',
      'supabase/migrations/0002_rls.sql',
      'package.json',
      'README.md',
      'SETUP.md',
      'LICENSE'
    ],
    screenshots: [
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1280&q=80',
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1280&q=80',
      'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&w=1280&q=80'
    ],
    seller: {
      id: 'dev-1',
      username: 'demo_seller',
      avatar_url: 'https://api.dicebear.com/7.x/shapes/svg?seed=demo_seller',
      github_url: 'https://github.com/demo_seller',
    },
  },
  {
    id: 'sample-adopt-2',
    seller_id: 'dev-2',
    title: 'TinyAuth Rust Microservice',
    tagline: 'A tiny self-hosted auth service. Sessions, OAuth and API keys in one binary.',
    description: 'Reinvented auth so you do not have to. Built completely in Rust with Argon2 password hashing and SQLite/PostgreSQL storage adapter layers.',
    interaction_type: 'adopt',
    price_paise: 0,
    tech_stack: ['rust', 'docker', 'postgresql'],
    cause_of_death: 'scope_creep',
    abandoned_on: '2024-11-15',
    last_commit_at: '2024-11-28T09:00:00Z',
    created_at: '2024-11-15T00:00:00Z',
    completion_percent: 70,
    lines_of_code: 9800,
    epitaph: 'Reinvented auth so you do not have to. Then remembered why nobody does.',
    has_archive: true,
    has_repo: true,
    is_sold: false,
    views: 310,
    features: [
      'Argon2id password hashing with constant-time verification',
      'Opaque session tokens with configurable rotation',
      'Scoped API keys with token revocation endpoint',
      'Under 25MB standalone scratch Docker container'
    ],
    todo_items: [
      'Passkey / WebAuthn standard credential support',
      'Web-based administration UI for token audit logs'
    ],
    file_tree: [
      'src/main.rs',
      'src/routes/auth.rs',
      'src/routes/oauth.rs',
      'src/session.rs',
      'src/keys.rs',
      'migrations/001_users.sql',
      'Dockerfile',
      'Cargo.toml',
      'README.md',
      'LICENSE'
    ],
    seller: {
      id: 'dev-2',
      username: 'rohan_golang',
      avatar_url: 'https://api.dicebear.com/7.x/shapes/svg?seed=rohan_golang',
      github_url: 'https://github.com/rohan_golang',
    },
  },
  {
    id: 'sample-collab-3',
    seller_id: 'dev-3',
    title: 'Lanternly AI Meeting Notes',
    tagline: 'AI meeting notes that turn calls into tasks. Needs a mobile dev and a designer.',
    description: 'Real-time audio transcription pipeline that extracts action items directly into Jira, Linear, and Slack. Looking for co-founders to own the mobile experience and product craft.',
    interaction_type: 'collab',
    price_paise: 0,
    tech_stack: ['react', 'typescript', 'nodejs'],
    cause_of_death: 'no_time',
    abandoned_on: '2026-01-05',
    last_commit_at: '2026-01-18T14:30:00Z',
    created_at: '2026-01-05T00:00:00Z',
    completion_percent: 60,
    lines_of_code: 6400,
    collab_terms: 'Equity split (10–15% each)',
    collab_roles: [
      {
        role: 'Mobile Developer (React Native / Expo)',
        commitment: '8–10 hrs/week',
        description: 'Build the recording and notes playback experience on iOS and Android with background sync.'
      },
      {
        role: 'Product Designer',
        commitment: '5–6 hrs/week',
        description: 'Own the design system, mobile UI/UX, and interactive onboarding flow.'
      }
    ],
    epitaph: 'The web app works. The phone app is a sketch on a napkin.',
    has_archive: true,
    has_repo: true,
    is_sold: false,
    views: 540,
    features: [
      'Whisper transcription pipeline with diarized speaker tags',
      'LLM action-item extraction with assignee detection',
      'Two-way calendar sync with Google Calendar & Outlook'
    ],
    todo_items: [
      'Native iOS / Android audio recorder module',
      'Self-serve Stripe billing and subscription tiers'
    ],
    seller: {
      id: 'dev-3',
      username: 'priya_builds',
      avatar_url: 'https://api.dicebear.com/7.x/shapes/svg?seed=priya_builds',
      github_url: 'https://github.com/priya_builds',
    },
  },
];

export default function DesignSystemPage() {
  const [activeTab, setActiveTab] = useState<'typography' | 'tokens' | 'components' | 'cards' | 'detail' | 'motion'>('cards');
  const { tier, setTier } = usePerfTier();
  const { mode: fxMode, setMode: setFxMode } = useHeroFxMode();
  const [fxSetting, setFxSetting] = useState<HeroFxMode | 'auto'>('auto');

  const flagship = SAMPLE_PROJECTS[0];

  return (
    <div className="min-h-dvh bg-bg text-fg flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
        {/* Header with Live Perf Tier Switcher */}
        <div className="border-b border-line pb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="space-y-3">
            <span className="font-mono text-xs uppercase tracking-widest text-brand-red block">
              Design System v2.7
            </span>
            <h1 className="text-4xl sm:text-5xl font-display font-semibold text-white tracking-tight">
              Craft &amp; Architecture
            </h1>
            <p className="text-muted text-base max-w-2xl leading-relaxed">
              Bento grid alignment, full-detail project architecture, universal CardFooter, mobile hero motion, and performance governance.
            </p>
          </div>

          {/* Actions & Live Switchers */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link href="/design-system/responsive">
              <Button
                variant="secondary"
                mode="brand"
                size="sm"
                leftIcon={<Users className="w-3.5 h-3.5" />}
              >
                Responsive Simulator
              </Button>
            </Link>

            {/* Perf Tier Switcher */}
            <div className="flex items-center gap-1.5 p-1.5 bg-surface rounded-full border border-line">
              <span className="font-mono text-xs text-muted px-2">Tier:</span>
              {(['high', 'mid', 'low'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTier(t)}
                  className={`px-3 py-1 text-xs font-mono rounded-full capitalize transition-colors cursor-pointer ${
                    tier === t
                      ? 'bg-white text-black font-semibold shadow-sm'
                      : 'bg-surface-2 text-muted hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Hero FX Mode Switcher */}
            <div className="flex items-center gap-1 p-1 bg-surface rounded-full border border-line">
              <span className="font-mono text-xs text-muted px-2">Hero FX:</span>
              {(['auto', 'canvas-desktop', 'canvas-mobile', 'css', 'static'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setFxSetting(m);
                    setFxMode(m);
                  }}
                  className={`px-2.5 py-1 text-[11px] font-mono rounded-full uppercase transition-colors cursor-pointer ${
                    fxSetting === m
                      ? 'bg-brand-red text-white font-semibold shadow-sm'
                      : 'bg-surface-2 text-muted hover:text-white'
                  }`}
                >
                  {m === 'auto' ? 'Auto' : m.replace('canvas-', '')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 pb-2 border-b border-line">
          {[
            { id: 'cards', label: 'Bento & Cards (v2.2)' },
            { id: 'detail', label: 'Detail Page Sections (v2.2)' },
            { id: 'components', label: 'Pill Buttons & Badges' },
            { id: 'tokens', label: 'Surfaces & Radii' },
            { id: 'typography', label: 'Typography' },
            { id: 'motion', label: 'Motion & Governor' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 text-xs sm:text-sm font-sans rounded-full transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'text-muted hover:text-white hover:bg-surface-2'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: CARDS & BENTO (V2.2) */}
        {activeTab === 'cards' && (
          <div className="space-y-16 animate-in fade-in duration-200">
            {/* Completion Percent Chip Showcase */}
            <section className="p-6 sm:p-8 bg-surface rounded-card border border-line space-y-4">
              <h2 className="font-display text-xl font-semibold text-white">Completion Percent Chips</h2>
              <p className="font-sans text-xs text-muted">
                Mounted on the top-right corner of card covers to provide immediate progress transparency.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <span className="font-mono text-[11px] font-semibold tracking-wider text-muted bg-bg/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-line">
                  45% built
                </span>
                <span className="font-mono text-[11px] font-semibold tracking-wider text-muted bg-bg/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-line">
                  70% built
                </span>
                <span className="font-mono text-[11px] font-semibold tracking-wider text-muted bg-bg/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-line">
                  85% built
                </span>
                <span className="font-mono text-[11px] font-semibold tracking-wider text-muted bg-bg/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-line">
                  95% built
                </span>
              </div>
            </section>

            {/* Featured Bento Section: 3-Item State */}
            <section className="space-y-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-neon-green inline-block animate-pulse" />
                  <h2 className="font-display text-xl font-semibold text-white">Featured Bento Grid (3-Item State)</h2>
                </div>
                <p className="text-xs text-muted font-sans">
                  Desktop bento: 12-column grid with 300px row height and 24px gap. Left spans columns 1–7 and 2 rows (624px tall). Right two compact cards span columns 8–12, 1 row each (300px tall).
                </p>
              </div>
              <FeaturedResurrections projects={SAMPLE_PROJECTS.slice(0, 3)} />
            </section>

            {/* Featured Bento Section: 2-Item Fallback State */}
            <section className="space-y-6">
              <div className="space-y-1">
                <h2 className="font-display text-xl font-semibold text-white">Featured Bento Grid (2-Item Equal Fallback)</h2>
                <p className="text-xs text-muted font-sans">
                  Fallback state when 2 items exist: two equal vertical cards side by side with identical height and alignment.
                </p>
              </div>
              <FeaturedResurrections projects={SAMPLE_PROJECTS.slice(0, 2)} />
            </section>

            {/* Featured Bento Section: 1-Item Fallback State */}
            <section className="space-y-6">
              <div className="space-y-1">
                <h2 className="font-display text-xl font-semibold text-white">Featured Bento Grid (1-Item Full Width Fallback)</h2>
                <p className="text-xs text-muted font-sans">
                  Fallback state when only 1 item exists: single full-width curated card.
                </p>
              </div>
              <FeaturedResurrections projects={SAMPLE_PROJECTS.slice(0, 1)} />
            </section>

            {/* Shared CardFooter Showcase */}
            <section className="p-6 sm:p-8 bg-surface rounded-card border border-line space-y-6">
              <h2 className="font-display text-xl font-semibold text-white">Universal CardFooter Component</h2>
              <p className="font-sans text-xs text-muted">
                One unified footer used across all card variants: seller gradient avatar + @username on the left, tabular price / collab pill + 40px circular arrow button on the right.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-bg rounded-xl border border-line">
                  <span className="font-mono text-[10px] text-muted uppercase block mb-3">Buy listing footer</span>
                  <CardFooter project={SAMPLE_PROJECTS[0]} />
                </div>
                <div className="p-4 bg-bg rounded-xl border border-line">
                  <span className="font-mono text-[10px] text-muted uppercase block mb-3">Adopt listing footer</span>
                  <CardFooter project={SAMPLE_PROJECTS[1]} />
                </div>
                <div className="p-4 bg-bg rounded-xl border border-line">
                  <span className="font-mono text-[10px] text-muted uppercase block mb-3">Collab listing footer</span>
                  <CardFooter project={SAMPLE_PROJECTS[2]} />
                </div>
              </div>
            </section>

            {/* Regular Marketplace Grid */}
            <section className="space-y-6">
              <h2 className="font-display text-xl font-semibold text-white">Regular Marketplace Cards (Even Heights)</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {SAMPLE_PROJECTS.map((p) => (
                  <ProjectCard key={p.id} project={p} />
                ))}
              </div>
            </section>
          </div>
        )}

        {/* TAB 2: DETAIL PAGE PREVIEW (V2.2) */}
        {activeTab === 'detail' && (
          <div className="space-y-16 animate-in fade-in duration-200">
            {/* Status at Death Stat Row */}
            <section className="space-y-4">
              <h2 className="font-display text-xl font-semibold text-white">Status at Death Stat Row</h2>
              <div className="bg-surface/50 border border-line/60 rounded-2xl p-6 sm:p-8">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                  <div>
                    <span className="font-mono text-[11px] uppercase tracking-wider text-muted block mb-1">
                      Completion
                    </span>
                    <span className="font-sans text-3xl sm:text-4xl font-semibold text-white tabular-nums">
                      {flagship.completion_percent}%
                    </span>
                  </div>

                  <div>
                    <span className="font-mono text-[11px] uppercase tracking-wider text-muted block mb-1">
                      Lines of code
                    </span>
                    <span className="font-sans text-3xl sm:text-4xl font-semibold text-white tabular-nums">
                      {formatLOC(flagship.lines_of_code || 0)}
                    </span>
                  </div>

                  <div>
                    <span className="font-mono text-[11px] uppercase tracking-wider text-muted block mb-1">
                      Last commit
                    </span>
                    <span className="font-sans text-xl sm:text-2xl font-semibold text-white">
                      Mar 2025
                    </span>
                  </div>

                  <div>
                    <span className="font-mono text-[11px] uppercase tracking-wider text-muted block mb-1">
                      Dead for
                    </span>
                    <span className="font-sans text-xl sm:text-2xl font-semibold text-muted tabular-nums">
                      {formatDeadFor(flagship.abandoned_on)}
                    </span>
                  </div>
                </div>

                <div className="mt-6 w-full h-1.5 bg-line rounded-full overflow-hidden">
                  <div
                    className="h-full bg-neon-green rounded-full transition-all duration-500"
                    style={{ width: `${flagship.completion_percent}%` }}
                  />
                </div>
              </div>
            </section>

            {/* Screenshot Gallery Preview */}
            <section className="space-y-4">
              <h2 className="font-display text-xl font-semibold text-white">Screenshot Gallery with Lightbox</h2>
              <p className="text-xs text-muted font-sans">
                Main 16:10 preview with clickable thumbnail strip. Opens Radix modal lightbox with arrow-key navigation and Esc to exit.
              </p>
              <ScreenshotGallery screenshots={flagship.screenshots || []} title={flagship.title} />
            </section>

            {/* What works / What is left */}
            <section className="space-y-4">
              <h2 className="font-display text-xl font-semibold text-white">What Works / What&apos;s Left Lists</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-surface/50 border border-line/60 rounded-2xl p-6 sm:p-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-neon-green shrink-0" />
                    <h3 className="font-sans text-lg font-semibold text-white">What works</h3>
                  </div>
                  <ul className="space-y-2.5">
                    {flagship.features?.map((f, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-fg/80 leading-relaxed">
                        <span className="text-neon-green font-mono text-sm mt-0.5">✓</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Circle className="w-5 h-5 text-amber shrink-0" />
                    <h3 className="font-sans text-lg font-semibold text-white">What&apos;s left / Known gaps</h3>
                  </div>
                  <ul className="space-y-2.5">
                    {flagship.todo_items?.map((t, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-fg/70 leading-relaxed">
                        <span className="text-amber font-mono text-sm mt-0.5">○</span>
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* Collapsible File Tree */}
            <section className="space-y-4">
              <h2 className="font-display text-xl font-semibold text-white">Collapsible File Tree Viewer</h2>
              <p className="text-xs text-muted font-sans">
                Hierarchical folder expansion, file icons by extension, 360px internal scroll with lenis wheel prevention.
              </p>
              <FileTreeViewer paths={flagship.file_tree || []} />
            </section>

            {/* Collab Roles Cards */}
            <section className="space-y-4">
              <h2 className="font-display text-xl font-semibold text-white">Collab Roles Cards</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {SAMPLE_PROJECTS[2].collab_roles?.map((r, i) => (
                  <div key={i} className="p-5 bg-surface rounded-xl border border-line space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-sans font-semibold text-white text-base">{r.role}</h3>
                      <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-surface-2 text-brand-purple border border-brand-purple/20 shrink-0">
                        {r.commitment}
                      </span>
                    </div>
                    <p className="text-sm text-fg/70 leading-relaxed">{r.description}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Markdown Setup Notes Preview */}
            <section className="space-y-4">
              <h2 className="font-display text-xl font-semibold text-white">Setup Notes with Markdown &amp; Copy Button</h2>
              <div className="p-6 bg-surface rounded-xl border border-line">
                <MarkdownRenderer content={flagship.setup_notes || ''} />
              </div>
            </section>
          </div>
        )}

        {/* TAB 3: COMPONENTS */}
        {activeTab === 'components' && (
          <div className="space-y-12 animate-in fade-in duration-200">
            {/* Pill Buttons System */}
            <section className="p-6 sm:p-8 bg-surface rounded-card border border-line space-y-6">
              <h2 className="font-display text-xl font-semibold text-white">Pill Button System (40 / 48 / 56px)</h2>
              <div className="flex flex-wrap items-center gap-4">
                <Button variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Primary Action
                </Button>
                <Button variant="primary" mode="buy" size="md">
                  Buy Codebase
                </Button>
                <Button variant="primary" mode="adopt" size="md">
                  Claim Free Fork
                </Button>
                <Button variant="primary" mode="collab" size="md">
                  Apply Co-founder
                </Button>
                <Button variant="secondary" size="md">
                  Secondary Pill
                </Button>
                <Button variant="ghost" size="md">
                  Ghost Underline
                </Button>
                <Button variant="danger" size="md">
                  Danger Action
                </Button>
              </div>
            </section>

            {/* Pill Badges */}
            <section className="p-6 sm:p-8 bg-surface rounded-card border border-line space-y-6">
              <h2 className="font-display text-xl font-semibold text-white">Pill Badges with Colored Dots</h2>
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-xs text-muted mr-3">Mode Badges:</span>
                  <ModeBadge mode="buy" />
                  <ModeBadge mode="adopt" />
                  <ModeBadge mode="collab" />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-xs text-muted mr-3">Status Badges:</span>
                  <StatusBadge status="live" label="Live" />
                  <StatusBadge status="sold" label="Sold" />
                  <StatusBadge status="revived" label="Revived" />
                  <StatusBadge status="claimed" label="Claimed" />
                  <StatusBadge status="filled" label="Filled" />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-muted mr-3">Tech Pills:</span>
                  {['rust', 'typescript', 'go', 'python', 'docker', 'threejs'].map((t) => (
                    <TechBadge key={t} tech={t} />
                  ))}
                </div>
              </div>
            </section>

            {/* Inputs */}
            <section className="p-6 sm:p-8 bg-surface rounded-card border border-line space-y-6 max-w-xl">
              <h2 className="font-display text-xl font-semibold text-white">Form Inputs (12px Radius)</h2>
              <div className="space-y-4">
                <Input placeholder="Standard 12px input with hairline focus" />
                <Textarea placeholder="Textarea with Geist body text and hairline border" rows={3} />
              </div>
            </section>
          </div>
        )}

        {/* TAB 4: SURFACES & RADII */}
        {activeTab === 'tokens' && (
          <div className="space-y-12 animate-in fade-in duration-200">
            <section className="p-6 sm:p-8 bg-surface rounded-card border border-line space-y-6">
              <h2 className="font-display text-xl font-semibold text-white">Surfaces &amp; Layers</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="p-6 bg-bg rounded-card border border-line space-y-2">
                  <span className="font-mono text-xs text-muted">bg-bg</span>
                  <p className="text-sm text-fg/80">Base canvas background</p>
                </div>
                <div className="p-6 bg-surface rounded-card border border-line space-y-2">
                  <span className="font-mono text-xs text-muted">bg-surface</span>
                  <p className="text-sm text-fg/80">Primary card &amp; container surface</p>
                </div>
                <div className="p-6 bg-surface-2 rounded-card border border-line space-y-2">
                  <span className="font-mono text-xs text-muted">bg-surface-2</span>
                  <p className="text-sm text-fg/80">Elevated interactive surface</p>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* TAB 5: TYPOGRAPHY */}
        {activeTab === 'typography' && (
          <div className="space-y-12 animate-in fade-in duration-200">
            <section className="p-6 sm:p-8 bg-surface rounded-card border border-line space-y-6">
              <h2 className="font-display text-xl font-semibold text-white">Font Stack</h2>
              <div className="space-y-6">
                <div>
                  <span className="font-mono text-xs text-muted">Bricolage Grotesque (font-display)</span>
                  <h1 className="text-3xl sm:text-4xl font-display font-semibold text-white mt-1">
                    Featured resurrections
                  </h1>
                </div>
                <div>
                  <span className="font-mono text-xs text-muted">Instrument Serif (font-serif italic)</span>
                  <p className="font-serif italic text-2xl text-fg/90 mt-1">
                    &ldquo;Sent 40 invoices. Got paid for none of them, including my own.&rdquo;
                  </p>
                </div>
                <div>
                  <span className="font-mono text-xs text-muted">Geist Sans (font-sans)</span>
                  <p className="font-sans text-base text-fg/80 mt-1 max-w-xl leading-relaxed">
                    Geist delivers uncompromised legibility for interface labels, paragraphs, and markdown documents.
                  </p>
                </div>
                <div>
                  <span className="font-mono text-xs text-muted">Geist Mono (font-mono)</span>
                  <p className="font-mono text-sm text-fg/70 mt-1">
                    COMPLETION 85% · 14.2k LOC · DEAD FOR 1y 6m
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* TAB 6: MOTION */}
        {activeTab === 'motion' && (
          <div className="space-y-12 animate-in fade-in duration-200">
            <section className="p-6 sm:p-8 bg-surface rounded-card border border-line space-y-4">
              <h2 className="font-display text-xl font-semibold text-white">Performance Governor &amp; Tiers (v2.7)</h2>
              <p className="font-sans text-sm text-fg/80 leading-relaxed max-w-2xl">
                The Graveyard dynamically adjusts its visual richness based on device capabilities, hardware concurrency, pointer precision, and battery health:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                <div className={`p-4 rounded-xl border ${tier === 'high' ? 'border-neon-green bg-neon-green/5' : 'border-line bg-surface-2'}`}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-sans font-semibold text-white text-base">High Tier</h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neon-green/10 text-neon-green border border-neon-green/20">Desktop</span>
                  </div>
                  <p className="font-sans text-xs text-muted mt-2 leading-relaxed">
                    Full hero canvas (55 particles @ 30fps), dynamic legibility mask, pointer repulsion, centered custom cursor ring, view transitions, Lenis smooth scroll, magnetic controls.
                  </p>
                </div>

                <div className={`p-4 rounded-xl border ${tier === 'mid' ? 'border-amber bg-amber/5' : 'border-line bg-surface-2'}`}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-sans font-semibold text-white text-base">Mid Tier</h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber/10 text-amber border border-amber/20">Mobile &amp; Touch</span>
                  </div>
                  <p className="font-sans text-xs text-muted mt-2 leading-relaxed">
                    Lightweight mobile canvas (20–26 particles @ 24fps cap, DPR 1, scroll velocity, touch ripple), dynamic legibility mask, native cursor, Lenis smooth scroll.
                  </p>
                </div>

                <div className={`p-4 rounded-xl border ${tier === 'low' ? 'border-brand-red bg-brand-red/5' : 'border-line bg-surface-2'}`}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-sans font-semibold text-white text-base">Low Tier / Battery</h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand-red/10 text-brand-red border border-brand-red/20">Fallback</span>
                  </div>
                  <p className="font-sans text-xs text-muted mt-2 leading-relaxed">
                    Pure CSS fallback (drifting ambient glow + 10 floating glyphs in safe zones) or static gradient. Zero JS frame loops, native scrolling, no magnetic effects.
                  </p>
                </div>
              </div>
            </section>

            {/* Live Hero FX Sandbox Preview */}
            <section className="p-6 sm:p-8 bg-surface rounded-card border border-line space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-neon-green animate-pulse" />
                    <h2 className="font-display text-xl font-semibold text-white">Hero Motion Sandbox (v2.7)</h2>
                  </div>
                  <p className="font-sans text-sm text-fg/80 max-w-xl">
                    Live interactive preview of hero background motion. Active mode:{' '}
                    <code className="font-mono text-xs text-brand-red bg-surface-2 px-2 py-0.5 rounded border border-line">
                      {fxMode}
                    </code>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-surface-2 rounded-full border border-line">
                  {(['auto', 'canvas-desktop', 'canvas-mobile', 'css', 'static'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setFxSetting(m);
                        setFxMode(m);
                      }}
                      className={`px-3 py-1 text-xs font-mono rounded-full uppercase transition-colors cursor-pointer ${
                        fxSetting === m
                          ? 'bg-brand-red text-white font-semibold shadow-sm'
                          : 'text-muted hover:text-white'
                      }`}
                    >
                      {m === 'auto' ? 'Auto' : m.replace('canvas-', '')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sandbox viewport container simulating hero */}
              <div className="relative h-64 sm:h-80 w-full rounded-2xl border border-line bg-[#0a0a0b] overflow-hidden flex flex-col items-center justify-center text-center p-6 select-none">
                <SoulsCanvas />

                <div className="relative z-10 space-y-3 max-w-md">
                  <div
                    data-hero-text
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-2 border border-line text-xs font-mono text-white"
                  >
                    <span>Dynamic Legibility Mask Active</span>
                  </div>
                  <h3 data-hero-text className="text-xl sm:text-2xl font-display font-semibold text-white">
                    Where dead code gets resurrected
                  </h3>
                  <p data-hero-text className="text-xs sm:text-sm font-sans text-fg/75">
                    Glyphs drift into margins and gaps, safely avoiding this text column on all screens.
                  </p>
                </div>
              </div>
            </section>

            {/* Intro Animation Section */}
            <section className="p-6 sm:p-8 bg-surface rounded-card border border-line space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <SkullMark className="w-5 h-5 text-brand-red" />
                    <h2 className="font-display text-xl font-semibold text-white">One-Time Skull Intro Animation</h2>
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono uppercase bg-brand-red/10 border border-brand-red/20 text-brand-red">
                      v2.3
                    </span>
                  </div>
                  <p className="font-sans text-sm text-fg/80 max-w-2xl">
                    Cinematic 6-slice vector assembly, neon ignition, hold pulse, and FLIP flight into the navbar logo. Plays once per browser session on <code className="text-xs font-mono text-neon-green">/</code>.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => replayIntro()}
                  className="gap-2 shrink-0 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  Replay Intro
                </Button>
              </div>

              {/* Timeline Table */}
              <div className="overflow-x-auto border border-line rounded-xl">
                <table className="w-full text-left font-sans text-xs">
                  <thead className="bg-surface-2 border-b border-line text-muted uppercase font-mono tracking-wider text-[11px]">
                    <tr>
                      <th className="px-4 py-3">Time Window</th>
                      <th className="px-4 py-3">Phase</th>
                      <th className="px-4 py-3">Visual Action</th>
                      <th className="px-4 py-3">Color Transition</th>
                      <th className="px-4 py-3">Easing &amp; Performance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line text-fg/80">
                    <tr>
                      <td className="px-4 py-3 font-mono text-muted">0 – 150ms</td>
                      <td className="px-4 py-3 font-medium text-white">Vignette Fade</td>
                      <td className="px-4 py-3">Full black overlay (#050505) fades in with 6% center ambient red glow</td>
                      <td className="px-4 py-3 font-mono">#050505</td>
                      <td className="px-4 py-3 text-muted">Zero blur, pre-rendered radial gradient</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono text-muted">150 – 1100ms</td>
                      <td className="px-4 py-3 font-medium text-white">Slice Assembly</td>
                      <td className="px-4 py-3">6 equal-width slices slide from alternating vertical offsets (±24px to ±60px, ±3.5°) with 70ms outward stagger</td>
                      <td className="px-4 py-3 font-mono text-white">#4a4a4a → #f2f2f2</td>
                      <td className="px-4 py-3 text-muted">cubic-bezier(0.16, 1, 0.3, 1)</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono text-muted">1100 – 1500ms</td>
                      <td className="px-4 py-3 font-medium text-white">Settle</td>
                      <td className="px-4 py-3">Slice seams close cleanly; entire skull scales 0.96 → 1.00</td>
                      <td className="px-4 py-3 font-mono text-white">#f2f2f2</td>
                      <td className="px-4 py-3 text-muted">Hardware transform only</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono text-muted">1500 – 1900ms</td>
                      <td className="px-4 py-3 font-medium text-neon-green">Ignite (Resurrection)</td>
                      <td className="px-4 py-3">Skull turns brand red; eye sockets and nose flash vivid neon green with radial aura</td>
                      <td className="px-4 py-3 font-mono text-brand-red">#ff2a2a + #39ff14</td>
                      <td className="px-4 py-3 text-muted">Color transition + pre-rendered radial glow</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono text-muted">1900 – 2200ms</td>
                      <td className="px-4 py-3 font-medium text-white">Hold Pulse</td>
                      <td className="px-4 py-3">Subtle 2% scale pulse hold before departure flight</td>
                      <td className="px-4 py-3 font-mono text-brand-red">#ff2a2a</td>
                      <td className="px-4 py-3 text-muted">cubic-bezier(0.34, 1.56, 0.64, 1)</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono text-muted">2200 – 3000ms</td>
                      <td className="px-4 py-3 font-medium text-brand-red">FLIP Navbar Flight</td>
                      <td className="px-4 py-3">Transforms from center viewport directly onto [data-intro-target="logo"] in navbar; overlay fades to 0</td>
                      <td className="px-4 py-3 font-mono">Overlay → transparent</td>
                      <td className="px-4 py-3 text-muted">FLIP getBoundingClientRect(), 700ms easeInOut</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Behavior & Execution Rules Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-surface-2 border border-line space-y-1.5">
                  <h4 className="font-mono text-xs text-white uppercase tracking-wider font-semibold">Scope &amp; Storage</h4>
                  <p className="font-sans text-xs text-muted leading-relaxed">
                    Default <code className="text-neon-green font-mono">sessionStorage: graveyard:intro:v1</code>. Marks seen at initial launch to prevent reload loops. Supports local (7-day) and always scopes.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-surface-2 border border-line space-y-1.5">
                  <h4 className="font-mono text-xs text-white uppercase tracking-wider font-semibold">Bypass Conditions</h4>
                  <p className="font-sans text-xs text-muted leading-relaxed">
                    Auto-skipped on <code className="text-amber font-mono">prefers-reduced-motion</code>, <code className="text-amber font-mono">saveData</code>, <code className="text-amber font-mono">navigator.webdriver</code>, <code className="text-amber font-mono">?intro=0</code>, or low performance tier.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-surface-2 border border-line space-y-1.5">
                  <h4 className="font-mono text-xs text-white uppercase tracking-wider font-semibold">Failsafes &amp; A11y</h4>
                  <p className="font-sans text-xs text-muted leading-relaxed">
                    CSS 4s timer failsafe hides overlay unconditionally. Fast 250ms skip on Esc / click / keydown. App root set to <code className="text-white font-mono">inert</code> while active.
                  </p>
                </div>
              </div>
            </section>

            <TechMarquee />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
