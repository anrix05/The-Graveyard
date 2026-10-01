'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Bell, CheckCheck, ExternalLink, MessageSquare, DollarSign, Users, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Notification } from '@/types/notification';

export const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch notifications
  useEffect(() => {
    if (!user?.id) return;

    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (data) {
        setNotifications(data as Notification[]);
      }
    };

    fetchNotifications();

    // Subscribe to Realtime notifications
    const channel = supabase
      .channel(`user-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev.slice(0, 9)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  const markAllRead = async () => {
    if (!user?.id || unreadCount === 0) return;
    const now = new Date().toISOString();
    setNotifications((prev) => prev.map((n) => ({ ...n, read_at: now })));
    await supabase.from('notifications').update({ read_at: now }).eq('user_id', user.id).is('read_at', null);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'sale':
        return <DollarSign className="w-3.5 h-3.5 text-[#39ff14]" />;
      case 'claim':
        return <Sparkles className="w-3.5 h-3.5 text-[#fbbf24]" />;
      case 'collab_pitch':
      case 'pitch_accepted':
        return <Users className="w-3.5 h-3.5 text-[#60a5fa]" />;
      default:
        return <MessageSquare className="w-3.5 h-3.5 text-[#ededed]" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-[#9ca3af] hover:text-white transition-colors rounded-sm focus-visible:outline-2 focus-visible:outline-white"
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#ff2a2a] rounded-full shadow-[0_0_8px_#ff2a2a]" />
        )}
      </button>

      {isOpen && (
        <>
          {/* Mobile backdrop */}
          <div 
            className="sm:hidden fixed inset-0 z-modal bg-black/70 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={() => setIsOpen(false)}
          />

          <div 
            className="fixed inset-x-0 bottom-0 z-modal sm:absolute sm:inset-x-auto sm:right-0 sm:bottom-auto sm:top-full sm:mt-2 w-full sm:w-96 max-h-[85dvh] sm:max-h-[500px] bg-surface border border-line shadow-2xl rounded-t-[24px] sm:rounded-2xl flex flex-col safe-pb overflow-hidden animate-in slide-in-from-bottom sm:slide-in-from-top-2 duration-200"
            data-lenis-prevent
          >
            {/* Grab handle on mobile */}
            <div className="sm:hidden w-12 h-1 bg-line rounded-full mx-auto my-2 shrink-0" />

            <div className="p-3.5 sm:p-4 border-b border-line flex items-center justify-between shrink-0 bg-surface-2">
              <span className="font-sans text-sm font-semibold text-white">Transmissions</span>
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs font-mono text-muted hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Mark all read</span>
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="sm:hidden p-1 text-muted hover:text-white"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-line overscroll-contain">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted">No new transmissions.</div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3.5 sm:p-4 text-xs transition-colors hover:bg-surface-2 ${
                      !n.read_at ? 'bg-surface-2/60' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 p-1.5 rounded bg-black/40 border border-white/5 shrink-0">
                        {getIcon(n.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-semibold text-white truncate break-anywhere">{n.title}</span>
                          <span className="text-[10px] font-mono text-[#9ca3af] shrink-0">
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[#9ca3af] line-clamp-2 leading-relaxed break-anywhere">{n.body}</p>
                        {n.link && (
                          <Link
                            href={n.link}
                            onClick={() => setIsOpen(false)}
                            className="inline-flex items-center gap-1 text-[11px] font-mono text-[#60a5fa] hover:underline mt-1.5"
                          >
                            <span>Inspect</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
