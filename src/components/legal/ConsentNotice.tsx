'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ShieldCheck, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import { IS_ANALYTICS_CONFIGURED, IS_ANALYTICS_ENABLED } from '@/lib/env';
import { isAnalyticsOptedOut, setAnalyticsOptOut } from '@/lib/analytics';
import useIntroDone from '@/hooks/useIntroDone';

const CONSENT_CHOICE_KEY = 'graveyard:cookie-consent:v1';
const TWELVE_MONTHS_MS = 365 * 24 * 60 * 60 * 1000;

export default function ConsentNotice() {
  const pathname = usePathname();
  const isIntroDone = useIntroDone();
  const [isVisible, setIsVisible] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isOptedOut, setIsOptedOut] = useState(false);

  useEffect(() => {
    if (!IS_ANALYTICS_CONFIGURED) return;

    setIsOptedOut(isAnalyticsOptedOut());

    // Check if user already made a choice within 12 months
    try {
      const stored = localStorage.getItem(CONSENT_CHOICE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Date.now() - parsed.timestamp < TWELVE_MONTHS_MS) {
          return; // Choice is still valid
        }
      }
    } catch {
      // Storage error
    }

    if (isIntroDone) {
      setIsVisible(true);
    }
  }, [isIntroDone]);

  // Listen for open settings custom event (triggered from footer or privacy page)
  useEffect(() => {
    const handleOpenSettings = () => {
      setIsOptedOut(isAnalyticsOptedOut());
      setIsSettingsOpen(true);
    };
    window.addEventListener('graveyard:open-cookie-settings', handleOpenSettings);
    return () => window.removeEventListener('graveyard:open-cookie-settings', handleOpenSettings);
  }, []);

  // Listen for Escape key to dismiss settings modal
  useEffect(() => {
    if (!isSettingsOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSettingsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSettingsOpen]);

  const saveChoice = (optOut: boolean) => {
    try {
      localStorage.setItem(
        CONSENT_CHOICE_KEY,
        JSON.stringify({ timestamp: Date.now(), optOut })
      );
    } catch {
      // Storage error
    }
    setAnalyticsOptOut(optOut);
    setIsOptedOut(optOut);
    setIsVisible(false);
    setIsSettingsOpen(false);
  };

  if (!IS_ANALYTICS_CONFIGURED) return null;

  // Don't show banner on auth pages or responsive preview to prevent overlaying forms
  const isAuthPage =
    pathname?.startsWith('/login') ||
    pathname?.startsWith('/forgot-password') ||
    pathname?.startsWith('/reset-password') ||
    pathname?.startsWith('/onboarding') ||
    pathname?.startsWith('/auth') ||
    pathname?.startsWith('/design-system/responsive');

  return (
    <>
      {/* Non-blocking Banner */}
      {isVisible && !isAuthPage && (
        <aside
          role="complementary"
          aria-label="Privacy and cookies"
          className="fixed bottom-4 left-4 right-4 sm:right-auto sm:max-w-md z-40 bg-surface/95 border border-line rounded-2xl p-4 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-300"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-surface-2 border border-line shrink-0 text-[#39ff14]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1.5 min-w-0 flex-1">
              <h3 className="font-display font-semibold text-sm text-white">
                Privacy &amp; Analytics
              </h3>
              <p className="font-sans text-xs text-muted leading-relaxed">
                We use essential cookies to keep you signed in and privacy-friendly analytics that don't use tracking cookies.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1.5">
                <Button
                  variant="primary"
                  mode="brand"
                  size="sm"
                  onClick={() => saveChoice(false)}
                >
                  Got it
                </Button>
                <Button
                  variant="secondary"
                  mode="neutral"
                  size="sm"
                  onClick={() => saveChoice(true)}
                >
                  Opt out of analytics
                </Button>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* Cookie Settings Modal Dialog (reopened via footer link) */}
      {isSettingsOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-settings-title"
          className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsSettingsOpen(false);
            }
          }}
        >
          <div className="bg-surface border border-line rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <h3 id="cookie-settings-title" className="font-display font-semibold text-base text-white">
                Privacy &amp; Cookie Settings
              </h3>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="text-muted hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                aria-label="Close settings"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 font-sans text-xs text-muted leading-relaxed">
              <div className="p-3 bg-surface-2 rounded-xl border border-line space-y-1">
                <span className="font-semibold text-white block text-sm">Essential Cookies</span>
                <p>Required for authentication sessions and security. Cannot be switched off.</p>
              </div>

              <div className="p-3 bg-surface-2 rounded-xl border border-line flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="font-semibold text-white block text-sm">Privacy-Friendly Analytics</span>
                  <p>
                    {IS_ANALYTICS_ENABLED
                      ? "Cookieless usage metrics with zero tracking cookies and zero PII."
                      : "Cookieless telemetry with zero tracking cookies and zero PII (active in production with consent)."}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={!isOptedOut}
                    onChange={(e) => {
                      const enabled = e.target.checked;
                      setAnalyticsOptOut(!enabled);
                      setIsOptedOut(!enabled);
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-6 bg-surface border border-line rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-line after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#39ff14]" />
                </label>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="primary"
                mode="brand"
                size="sm"
                onClick={() => {
                  try {
                    localStorage.setItem(
                      CONSENT_CHOICE_KEY,
                      JSON.stringify({ timestamp: Date.now(), optOut: isOptedOut })
                    );
                  } catch {}
                  setIsSettingsOpen(false);
                }}
              >
                Save Preferences
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
