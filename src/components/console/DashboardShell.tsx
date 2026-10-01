'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import ConsoleSidebar from './ConsoleSidebar';
import ConsoleTopbar from './ConsoleTopbar';
import ConsoleBottomNav from './ConsoleBottomNav';
import { ConsoleTab } from './types';

interface DashboardShellProps {
  activeTab: ConsoleTab;
  onTabChange: (tab: ConsoleTab) => void;
  children: React.ReactNode;
  unreadMessagesCount?: number;
  pendingPitchesCount?: number;
}

export default function DashboardShell({
  activeTab,
  onTabChange,
  children,
  unreadMessagesCount = 0,
  pendingPitchesCount = 0,
}: DashboardShellProps) {
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  return (
    <div data-console-shell="true" className="min-h-dvh bg-bg text-fg flex flex-col relative antialiased">
      {/* Desktop Fixed Left Sidebar (>= lg) */}
      <ConsoleSidebar
        activeTab={activeTab}
        onTabChange={onTabChange}
        unreadMessagesCount={unreadMessagesCount}
        pendingPitchesCount={pendingPitchesCount}
      />

      {/* Main Column (Offset by 264px on lg) */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-[264px]">
        {/* Sticky Topbar */}
        <ConsoleTopbar
          activeTab={activeTab}
          onOpenMore={() => setIsMoreOpen(true)}
        />

        {/* Console Content Area */}
        <main
          id="main"
          tabIndex={-1}
          className="flex-1 w-full max-w-[1200px] 3xl:max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 pb-28 lg:pb-12 outline-none"
        >
          {children}
        </main>

        {/* Minimal Console Footer */}
        <footer className="w-full max-w-[1200px] 3xl:max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-4 border-t border-line/60 text-xs text-muted flex flex-col sm:flex-row items-center justify-between gap-3 select-none">
          <p className="font-sans text-muted/70">
            © {new Date().getFullYear()} The Graveyard. Where dead code gets resurrected.
          </p>
          <div className="flex items-center gap-4 text-muted/70">
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms
            </Link>
            <span>·</span>
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy
            </Link>
            <span>·</span>
            <Link href="/contact" className="hover:text-white transition-colors">
              Contact
            </Link>
          </div>
        </footer>
      </div>

      {/* Mobile Bottom Navigation (< lg) */}
      <ConsoleBottomNav
        activeTab={activeTab}
        onTabChange={onTabChange}
        isMoreOpen={isMoreOpen}
        setIsMoreOpen={setIsMoreOpen}
        unreadMessagesCount={unreadMessagesCount}
        pendingPitchesCount={pendingPitchesCount}
      />
    </div>
  );
}
