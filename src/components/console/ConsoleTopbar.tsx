'use client';

import React from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import SkullMark from '@/components/brand/SkullMark';
import NotificationBell from '@/components/ui/NotificationBell';
import Avatar from '@/components/ui/Avatar';
import { useAuth } from '@/context/AuthContext';
import { ConsoleTab } from './types';

interface ConsoleTopbarProps {
  activeTab: ConsoleTab;
  onOpenMore?: () => void;
}

const TAB_TITLES: Record<ConsoleTab, string> = {
  overview: 'Overview',
  listings: 'My listings',
  vault: 'Vault',
  sales: 'Sales',
  collabs: 'Collabs',
  messages: 'Messages',
  settings: 'Settings',
};

export default function ConsoleTopbar({ activeTab, onOpenMore }: ConsoleTopbarProps) {
  const { user } = useAuth();
  const currentTitle = TAB_TITLES[activeTab] || 'Overview';

  return (
    <header className="sticky top-0 z-30 w-full h-[var(--topbar-h)] bg-bg/90 backdrop-blur-md border-b border-line px-4 sm:px-6 lg:px-8 flex items-center justify-between select-none">
      {/* Desktop Left: Breadcrumb (Console / Section) */}
      <div className="hidden lg:flex items-center gap-2 text-sm font-sans text-muted">
        <Link href="/dashboard?tab=overview" className="hover:text-white transition-colors">
          Console
        </Link>
        <span className="text-muted/50">/</span>
        <span className="text-white font-medium">{currentTitle}</span>
      </div>

      {/* Mobile Left: Brand Logo + Micro Label */}
      <div className="flex lg:hidden items-center gap-2.5">
        <Link href="/" className="flex items-center gap-2 text-white">
          <SkullMark size={22} className="text-white" />
          <span className="font-display font-bold text-base tracking-tight">The Graveyard</span>
        </Link>
        <span className="font-mono text-[9px] tracking-wider text-muted/60 uppercase">
          Console
        </span>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <NotificationBell />

        {/* Mobile Avatar Button (opens more / profile) */}
        <button
          type="button"
          onClick={onOpenMore}
          className="flex lg:hidden items-center justify-center p-0.5 rounded-full hover:ring-2 hover:ring-white/20 transition-all"
          aria-label="User menu"
        >
          <Avatar username={user?.username} size={28} />
        </button>

        {/* The SINGLE Primary CTA inside console: New listing */}
        <Link
          href="/submit"
          className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white text-black font-sans font-semibold text-xs sm:text-sm hover:bg-neutral-200 transition-colors shadow-sm shrink-0"
        >
          <Plus className="w-3.5 sm:w-4 h-3.5 sm:h-4 stroke-[2.5]" />
          <span>New listing</span>
        </Link>
      </div>
    </header>
  );
}
