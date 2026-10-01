'use client';

import React, { useState, useRef, useEffect, useId } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  LayoutDashboard,
  Shield,
  MessageSquare,
  Settings,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import SkullMark from '@/components/brand/SkullMark';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import NotificationBell from '@/components/ui/NotificationBell';
import { cn } from '@/lib/utils';

export const Header: React.FC = () => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const prevFocusRef = useRef<HTMLElement | null>(null);
  const navTrackId = useId();

  // Scrolled state detection via IntersectionObserver sentinel instead of scroll state loops
  useEffect(() => {
    const sentinel = document.createElement('div');
    sentinel.setAttribute('data-sentinel', 'nav-top');
    sentinel.style.position = 'absolute';
    sentinel.style.top = '0';
    sentinel.style.left = '0';
    sentinel.style.width = '100%';
    sentinel.style.height = '16px';
    sentinel.style.pointerEvents = 'none';
    sentinel.style.zIndex = '-1';
    document.body.appendChild(sentinel);

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsScrolled(!entry.isIntersecting);
      },
      { threshold: 0 }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
      if (sentinel.parentNode) {
        sentinel.parentNode.removeChild(sentinel);
      }
    };
  }, []);

  // Close user dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Body scroll lock and focus management for mobile menu
  useEffect(() => {
    if (isMobileMenuOpen) {
      prevFocusRef.current = document.activeElement as HTMLElement | null;
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setIsMobileMenuOpen(false);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
        if (prevFocusRef.current) {
          prevFocusRef.current.focus();
        }
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isMobileMenuOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    { label: 'Browse', href: '/' },
    { label: 'Submit project', href: '/submit' },
  ];

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-header w-full transition-colors duration-200 select-none',
          'h-[60px] lg:h-[68px] landscape-compact-nav flex items-center pt-[env(safe-area-inset-top,0px)]',
          isScrolled
            ? 'bg-[#0a0a0b]/90 border-b border-line shadow-lg backdrop-blur-md'
            : 'bg-transparent border-b border-transparent'
        )}
      >
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between px-4 sm:px-6">
          {/* Left: Logo & Wordmark */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group shrink-0"
            aria-label="The Graveyard home"
          >
            <div className="relative" data-intro-target="logo">
              <SkullMark className="h-[26px] w-[26px] text-brand-red transition-transform group-hover:rotate-12 duration-200" />
            </div>
            <span className="font-display text-[19px] font-semibold tracking-tight text-white whitespace-nowrap group-hover:text-neutral-200 transition-colors">
              The Graveyard
            </span>
          </Link>

          {/* Center: Sliding Pill Nav Track (Collapses below lg and at 200% zoom) */}
          <nav
            className="hidden lg:flex items-center p-1 rounded-full bg-white/[0.04] border border-line"
            onMouseLeave={() => setHoveredLink(null)}
          >
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const isHovered = hoveredLink === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onMouseEnter={() => setHoveredLink(link.href)}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'relative px-3.5 py-1 xl:px-5 xl:py-1.5 rounded-full font-sans text-[15px] font-medium transition-colors z-10',
                    isActive ? 'text-white' : 'text-muted hover:text-fg'
                  )}
                >
                  {(isHovered || (!hoveredLink && isActive)) && (
                    <motion.div
                      layoutId={`nav-pill-${navTrackId}`}
                      className="absolute inset-0 bg-white/10 rounded-full -z-10"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right: Auth State & Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <NotificationBell />

                {/* User Dropdown */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    type="button"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="h-10 flex items-center gap-2 rounded-full px-2 py-1 border border-line bg-surface-2 hover:border-white/20 transition-colors"
                  >
                    <Avatar username={user.username || 'operative'} size="sm" />
                    <span className="hidden sm:inline font-mono text-xs text-fg px-1 max-w-[120px] truncate">
                      @{user.username || 'operative'}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-muted mr-1" />
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-modal bg-surface border border-line p-2 shadow-2xl z-dropdown animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-3 py-2 border-b border-line mb-1">
                        <p className="font-sans text-xs font-semibold text-white truncate">
                          {user.username || 'Operative'}
                        </p>
                        <p className="font-mono text-[11px] text-muted truncate">
                          {user.email}
                        </p>
                      </div>

                      <Link
                        href="/dashboard"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-sans text-muted hover:text-white hover:bg-surface-2 rounded-xl transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        <span>Console & listings</span>
                      </Link>

                      <Link
                        href="/dashboard?tab=vault"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-sans text-muted hover:text-white hover:bg-surface-2 rounded-xl transition-colors"
                      >
                        <Shield className="w-4 h-4 text-neon-green" />
                        <span>Operative Vault</span>
                      </Link>

                      <Link
                        href="/dashboard?tab=messages"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-sans text-muted hover:text-white hover:bg-surface-2 rounded-xl transition-colors"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Messages</span>
                      </Link>

                      <Link
                        href="/dashboard?tab=settings"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-sans text-muted hover:text-white hover:bg-surface-2 rounded-xl transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        <span>Settings</span>
                      </Link>

                      <div className="my-1 border-t border-line" />

                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-sans text-brand-red hover:bg-brand-red/10 rounded-xl transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign out</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  href="/login"
                  className="h-10 px-3.5 flex items-center justify-center font-sans text-[15px] font-medium text-muted hover:text-white transition-colors"
                >
                  Sign in
                </Link>
                <Link href="/login?mode=signup">
                  <Button variant="primary" mode="brand" size="sm">
                    Get started
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Toggle Button (Shows on < lg and at 200% zoom) */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden h-10 w-10 flex items-center justify-center rounded-full border border-line text-muted hover:text-white transition-colors"
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Full-screen Solid Mobile Menu (No blur, high-contrast, locked scroll, safe areas) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            ref={mobileMenuRef}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.16 }}
            className="fixed inset-0 top-[60px] lg:top-[68px] z-modal bg-[#0a0a0b] text-white flex flex-col justify-between px-6 py-8 pb-[max(2rem,env(safe-area-inset-bottom,0px))] overflow-y-auto min-h-[calc(100dvh-60px)] lg:hidden"
          >
            <nav className="flex flex-col gap-6 pt-4">
              {navLinks.map((link, idx) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04, duration: 0.2 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="font-display text-4xl font-semibold tracking-tight text-white hover:text-muted transition-colors block"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </nav>

            <div className="pt-8 border-t border-line space-y-3">
              {!user ? (
                <>
                  <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="block">
                    <Button variant="secondary" size="md" fullWidth>
                      Sign in
                    </Button>
                  </Link>
                  <Link href="/login?mode=signup" onClick={() => setIsMobileMenuOpen(false)} className="block">
                    <Button variant="primary" mode="brand" size="md" fullWidth>
                      Get started
                    </Button>
                  </Link>
                </>
              ) : (
                <div className="space-y-2">
                  <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="block">
                    <Button variant="secondary" size="md" fullWidth>
                      Console & listings
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="md"
                    fullWidth
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      logout();
                    }}
                    className="text-brand-red"
                  >
                    Sign out
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;