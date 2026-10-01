'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  LayoutGrid,
  Layers,
  Shield,
  IndianRupee,
  Users,
  MessageSquare,
  Settings,
  ArrowLeft,
  LogOut,
  User as UserIcon,
  ChevronUp,
} from 'lucide-react';
import SkullMark from '@/components/brand/SkullMark';
import Avatar from '@/components/ui/Avatar';
import { useAuth } from '@/context/AuthContext';
import { getDisplayHandle } from '@/lib/user';
import { ConsoleTab } from './types';

interface ConsoleSidebarProps {
  activeTab: ConsoleTab;
  onTabChange: (tab: ConsoleTab) => void;
  unreadMessagesCount?: number;
  pendingPitchesCount?: number;
}

const NAV_ITEMS: {
  id: ConsoleTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'listings', label: 'My listings', icon: Layers },
  { id: 'vault', label: 'Vault', icon: Shield },
  { id: 'sales', label: 'Sales', icon: IndianRupee },
  { id: 'collabs', label: 'Collabs', icon: Users },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function ConsoleSidebar({
  activeTab,
  onTabChange,
  unreadMessagesCount = 0,
  pendingPitchesCount = 0,
}: ConsoleSidebarProps) {
  const { user, logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const displayHandle = getDisplayHandle(user);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <aside
      aria-label="Console navigation"
      className="hidden lg:flex fixed top-0 left-0 bottom-0 w-[264px] z-40 bg-bg border-r border-line flex-col justify-between select-none"
    >
      {/* Top Section: Brand + Navigation */}
      <div className="flex flex-col p-4 space-y-6">
        {/* Brand Header */}
        <div className="px-2 pt-1">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-white hover:opacity-85 transition-opacity group"
          >
            <SkullMark size={24} className="text-white group-hover:scale-105 transition-transform" />
            <span className="font-display font-bold text-lg tracking-tight text-white">
              The Graveyard
            </span>
          </Link>
          <span className="font-mono text-[10px] tracking-widest text-muted/70 uppercase block mt-1 px-0.5">
            Console
          </span>
        </div>

        {/* Navigation Items */}
        <nav aria-label="Console" className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const count =
              item.id === 'messages'
                ? unreadMessagesCount
                : item.id === 'collabs'
                  ? pendingPitchesCount
                  : 0;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-sans text-sm transition-colors text-left ${
                  isActive
                    ? 'bg-white/8 text-white font-medium'
                    : 'text-muted hover:bg-white/5 hover:text-white'
                }`}
              >
                {/* 3px Accent indicator on left */}
                {isActive && (
                  <motion.span
                    layoutId="console-sidebar-active"
                    className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-[#ff2a2a]"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}

                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-white' : 'text-muted'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {/* Badge count */}
                {count > 0 && (
                  <span className="bg-[#ff2a2a]/20 text-[#ff5555] px-2 py-0.5 text-xs font-mono rounded-full font-medium">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: User Card & Back Link */}
      <div className="p-4 border-t border-line space-y-2">
        {/* User Card with Dropdown */}
        <div ref={userMenuRef} className="relative">
          <button
            type="button"
            onClick={() => setIsUserMenuOpen((prev) => !prev)}
            className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors text-left group"
          >
            <div className="flex items-center gap-3 min-w-0">
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
            <ChevronUp
              className={`w-4 h-4 text-muted transition-transform duration-150 ${
                isUserMenuOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* User Popover Menu */}
          {isUserMenuOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-2 p-1.5 bg-surface-2 border border-line rounded-xl shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-2 duration-150 space-y-1">
              <Link
                href={`/?seller=${user?.username || ''}`}
                onClick={() => setIsUserMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-sans text-muted hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>View public profile</span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  setIsUserMenuOpen(false);
                  onTabChange('settings');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-sans text-muted hover:text-white hover:bg-white/5 rounded-lg transition-colors text-left"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Settings</span>
              </button>
              <div className="h-px bg-line my-1" />
              <button
                type="button"
                onClick={() => {
                  setIsUserMenuOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-sans text-[#ff5555] hover:bg-[#ff2a2a]/10 rounded-lg transition-colors text-left"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>

        {/* Back to site link */}
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-2 text-xs font-sans text-muted hover:text-white transition-colors rounded-lg hover:bg-white/5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to site</span>
        </Link>
      </div>
    </aside>
  );
}
