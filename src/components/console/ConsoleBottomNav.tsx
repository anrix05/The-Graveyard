'use client';

import React from 'react';
import Link from 'next/link';
import {
  LayoutGrid,
  Layers,
  Shield,
  MessageSquare,
  MoreHorizontal,
  IndianRupee,
  Users,
  Settings,
  ArrowLeft,
  LogOut,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getDisplayHandle } from '@/lib/user';
import Avatar from '@/components/ui/Avatar';
import { ConsoleTab } from './types';

interface ConsoleBottomNavProps {
  activeTab: ConsoleTab;
  onTabChange: (tab: ConsoleTab) => void;
  isMoreOpen: boolean;
  setIsMoreOpen: (open: boolean) => void;
  unreadMessagesCount?: number;
  pendingPitchesCount?: number;
}

export default function ConsoleBottomNav({
  activeTab,
  onTabChange,
  isMoreOpen,
  setIsMoreOpen,
  unreadMessagesCount = 0,
  pendingPitchesCount = 0,
}: ConsoleBottomNavProps) {
  const { user, logout } = useAuth();
  const displayHandle = getDisplayHandle(user);

  const mainTabs: {
    id: ConsoleTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutGrid },
    { id: 'listings', label: 'Listings', icon: Layers },
    { id: 'vault', label: 'Vault', icon: Shield },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
  ];

  return (
    <>
      {/* Mobile Bottom Bar (< lg) */}
      <nav
        aria-label="Mobile console navigation"
        className="lg:hidden fixed bottom-0 inset-x-0 z-header bg-bg/95 backdrop-blur-md border-t border-line px-2 py-1.5 safe-pb flex items-center justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.6)]"
      >
        {mainTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const count = tab.id === 'messages' ? unreadMessagesCount : 0;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setIsMoreOpen(false);
                onTabChange(tab.id);
              }}
              className={`flex-1 flex flex-col items-center justify-center py-1 gap-1 text-[11px] font-sans transition-colors relative ${
                isActive ? 'text-white font-semibold' : 'text-muted hover:text-white'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-muted'}`} />
                {count > 0 && (
                  <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-[#ff2a2a] text-white text-[9px] font-mono flex items-center justify-center font-bold">
                    {count}
                  </span>
                )}
              </div>
              <span>{tab.label}</span>
            </button>
          );
        })}

        {/* More Tab */}
        <button
          type="button"
          onClick={() => setIsMoreOpen(!isMoreOpen)}
          className={`flex-1 flex flex-col items-center justify-center py-1 gap-1 text-[11px] font-sans transition-colors relative ${
            isMoreOpen || ['sales', 'collabs', 'settings'].includes(activeTab)
              ? 'text-white font-semibold'
              : 'text-muted hover:text-white'
          }`}
        >
          <div className="relative">
            <MoreHorizontal className="w-5 h-5 text-muted" />
            {pendingPitchesCount > 0 && (
              <span className="absolute -top-1 -right-2 w-2 h-2 rounded-full bg-[#ff2a2a]" />
            )}
          </div>
          <span>More</span>
        </button>
      </nav>

      {/* "More" Sheet Overlay */}
      {isMoreOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="More console options"
          className="lg:hidden fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex flex-col justify-end animate-in fade-in duration-200"
          onClick={() => setIsMoreOpen(false)}
        >
          <div
            className="bg-surface border-t border-line rounded-t-3xl p-6 space-y-4 max-h-[80dvh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div className="flex items-center gap-3">
                <Avatar username={user?.username} size={36} />
                <div className="min-w-0">
                  <span
                    title={displayHandle}
                    className="font-sans font-medium text-sm text-white block truncate"
                  >
                    {displayHandle}
                  </span>
                  <span className="text-xs text-muted block truncate">
                    {user?.email || 'Authenticated'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMoreOpen(false)}
                className="p-1 rounded-full text-muted hover:text-white"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-links */}
            <div className="space-y-1 py-1">
              <button
                type="button"
                onClick={() => {
                  setIsMoreOpen(false);
                  onTabChange('sales');
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 text-sm font-sans text-white text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <IndianRupee className="w-4 h-4 text-muted" />
                  <span>Sales</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMoreOpen(false);
                  onTabChange('collabs');
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 text-sm font-sans text-white text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-muted" />
                  <span>Collabs</span>
                </div>
                {pendingPitchesCount > 0 && (
                  <span className="bg-[#ff2a2a]/20 text-[#ff5555] px-2 py-0.5 text-xs font-mono rounded-full font-medium">
                    {pendingPitchesCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMoreOpen(false);
                  onTabChange('settings');
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-sm font-sans text-white text-left transition-colors"
              >
                <Settings className="w-4 h-4 text-muted" />
                <span>Settings</span>
              </button>
            </div>

            <div className="h-px bg-line" />

            {/* Utility actions */}
            <div className="space-y-1 pt-1">
              <Link
                href="/"
                onClick={() => setIsMoreOpen(false)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-sm font-sans text-muted hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to site</span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  setIsMoreOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl text-[#ff5555] hover:bg-[#ff2a2a]/10 text-sm font-sans transition-colors text-left"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
