'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import {
  Send,
  Search,
  Trash2,
  MessageSquare,
  ArrowLeft,
  Circle,
  WifiOff,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Message, ChatThread } from '@/types/message';
import Avatar from '@/components/ui/Avatar';
import { getDisplayHandle } from '@/lib/user';
import { toast } from 'sonner';

interface MessagesTabProps {
  initialRecipientId?: string | null;
  onUnreadChange?: (count: number) => void;
}

export default function MessagesTab({ initialRecipientId, onUnreadChange }: MessagesTabProps) {
  const { user } = useAuth();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadKey, setActiveThreadKey] = useState<string | null>(null);
  const [activeThread, setActiveThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingThreads, setIsLoadingThreads] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Monitor network connection state for reconnection indicator
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load threads
  const loadThreads = async () => {
    if (!user) return;
    setIsLoadingThreads(true);

    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!sender_id(*),
          receiver:profiles!receiver_id(*),
          project:projects(id, title)
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const threadMap = new Map<string, ChatThread>();

      data?.forEach((msg: any) => {
        const isMeSender = msg.sender_id === user.id;
        if (isMeSender && msg.deleted_by_sender) return;
        if (!isMeSender && msg.deleted_by_receiver) return;

        const otherProfile = isMeSender ? msg.receiver : msg.sender;
        const threadKey =
          msg.thread_key ||
          `${[msg.sender_id, msg.receiver_id].sort().join(':')}:${msg.project_id || ''}`;

        if (!threadMap.has(threadKey)) {
          threadMap.set(threadKey, {
            thread_key: threadKey,
            other_user: otherProfile || {
              id: isMeSender ? msg.receiver_id : msg.sender_id,
              username: 'User',
              reputation_score: 100,
              github_url: null,
            },
            project_id: msg.project_id,
            project_title: msg.project?.title,
            last_message: msg,
            unread_count: !isMeSender && !msg.is_read ? 1 : 0,
          });
        } else if (!isMeSender && !msg.is_read) {
          const curr = threadMap.get(threadKey)!;
          curr.unread_count += 1;
        }
      });

      const threadList = Array.from(threadMap.values());
      setThreads(threadList);

      const totalUnread = threadList.reduce((acc, t) => acc + t.unread_count, 0);
      onUnreadChange?.(totalUnread);

      // Handle initial recipient or auto-select
      if (initialRecipientId && initialRecipientId !== user.id) {
        const existing = threadList.find((t) => t.other_user.id === initialRecipientId);
        if (existing) {
          setActiveThreadKey(existing.thread_key);
          setActiveThread(existing);
        } else {
          const { data: recProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', initialRecipientId)
            .maybeSingle();

          const tempThreadKey = `${[user.id, initialRecipientId].sort().join(':')}:`;
          const newThread: ChatThread = {
            thread_key: tempThreadKey,
            other_user: recProfile || {
              id: initialRecipientId,
              username: 'New Contact',
              reputation_score: 100,
              github_url: null,
            },
            last_message: {
              id: 'temp',
              sender_id: user.id,
              receiver_id: initialRecipientId,
              thread_key: tempThreadKey,
              content: 'Conversation started.',
              is_read: true,
              created_at: new Date().toISOString(),
            },
            unread_count: 0,
          };
          setThreads([newThread, ...threadList]);
          setActiveThreadKey(tempThreadKey);
          setActiveThread(newThread);
        }
      } else if (!activeThreadKey && threadList.length > 0 && typeof window !== 'undefined' && window.innerWidth >= 1024) {
        setActiveThreadKey(threadList[0].thread_key);
        setActiveThread(threadList[0]);
      }
    } catch (e) {
      console.error('Error fetching chat threads:', e);
    } finally {
      setIsLoadingThreads(false);
    }
  };

  useEffect(() => {
    loadThreads();
  }, [user?.id, initialRecipientId]);

  // Load messages for active thread & Realtime sync
  useEffect(() => {
    if (!activeThreadKey || !user) return;

    const fetchMessages = async () => {
      setIsLoadingMessages(true);
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*, sender:profiles!sender_id(*)')
          .eq('thread_key', activeThreadKey)
          .order('created_at', { ascending: true });

        if (!error && data) {
          const filtered = data.filter((m) => {
            if (m.sender_id === user.id) return !m.deleted_by_sender;
            return !m.deleted_by_receiver;
          });
          setMessages(filtered);

          await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('thread_key', activeThreadKey)
            .eq('receiver_id', user.id)
            .eq('is_read', false);

          // Update unread count locally
          setThreads((prev) =>
            prev.map((t) => (t.thread_key === activeThreadKey ? { ...t, unread_count: 0 } : t))
          );
        }
      } catch (e) {
        console.error('Error loading messages:', e);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    fetchMessages();

    const channel = supabase
      .channel(`chat-thread-${activeThreadKey}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `thread_key=eq.${activeThreadKey}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeThreadKey, user?.id]);

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !user || !activeThread) return;

    const content = messageInput.trim();
    setMessageInput('');
    setIsSending(true);

    const optimisticId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: optimisticId,
      sender_id: user.id,
      receiver_id: activeThread.other_user.id,
      project_id: activeThread.project_id || null,
      thread_key: activeThread.thread_key,
      content,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: activeThread.other_user.id,
          project_id: activeThread.project_id || null,
          thread_key: activeThread.thread_key,
          content,
          is_read: false,
        })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setMessages((prev) => prev.map((m) => (m.id === optimisticId ? data : m)));
      }
    } catch {
      toast.error('Failed to send message.');
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
    } finally {
      setIsSending(false);
    }
  };

  // Soft delete thread
  const handleDeleteConversation = async () => {
    if (!user || !activeThread) return;
    if (!confirm('Hide this conversation from your inbox?')) return;

    try {
      await supabase
        .from('messages')
        .update({ deleted_by_sender: true })
        .eq('thread_key', activeThread.thread_key)
        .eq('sender_id', user.id);

      await supabase
        .from('messages')
        .update({ deleted_by_receiver: true })
        .eq('thread_key', activeThread.thread_key)
        .eq('receiver_id', user.id);

      toast.success('Conversation removed.');
      loadThreads();
      setActiveThread(null);
      setActiveThreadKey(null);
    } catch {
      toast.error('Failed to remove conversation.');
    }
  };

  const filteredThreads = useMemo(() => {
    if (!searchQuery) return threads;
    return threads.filter(
      (t) =>
        t.other_user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.project_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.last_message.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [threads, searchQuery]);

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-semibold text-white tracking-tight">
            Messages
          </h1>
          <p className="font-sans text-sm text-muted mt-1.5">
            Conversations about listings and collaborations.
          </p>
        </div>

        {/* Offline / Reconnecting Indicator (Only visible when offline/reconnecting) */}
        {!isOnline && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber/10 border border-amber/30 text-amber text-xs font-sans">
            <span className="w-2 h-2 rounded-full bg-amber animate-pulse" />
            <span>Reconnecting...</span>
          </div>
        )}
      </div>

      {/* Two-pane Container */}
      <div className="h-[calc(100dvh-var(--topbar-h)-180px)] min-h-[500px] max-h-[820px] w-full border border-line bg-surface rounded-card flex overflow-hidden shadow-xl relative">
        {/* LEFT PANE: Conversation List */}
        <div
          className={`w-full lg:w-80 xl:w-96 border-r border-line flex flex-col bg-surface transition-all ${
            activeThreadKey ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* List Search (visible when threads > 8) */}
          {threads.length > 8 && (
            <div className="p-3 border-b border-line">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full pl-8 pr-3 py-1.5 bg-surface-2 border border-line rounded-lg text-xs font-sans text-white placeholder:text-muted focus:outline-none focus:border-white/30"
                />
              </div>
            </div>
          )}

          {/* Thread List */}
          <div className="flex-1 overflow-y-auto divide-y divide-line">
            {isLoadingThreads ? (
              <div className="p-8 text-center text-xs font-sans text-muted">
                Loading conversations...
              </div>
            ) : filteredThreads.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mx-auto text-muted">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div className="space-y-1 max-w-xs mx-auto">
                  <p className="font-sans font-medium text-sm text-white">No conversations yet</p>
                  <p className="font-sans text-xs text-muted">
                    Message a seller from any listing to start a conversation.
                  </p>
                </div>
                <div className="pt-2">
                  <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-black hover:bg-neutral-200 font-sans text-xs font-semibold transition-colors shadow-sm"
                  >
                    Browse projects
                  </Link>
                </div>
              </div>
            ) : (
              filteredThreads.map((t) => {
                const isSelected = activeThreadKey === t.thread_key;

                return (
                  <button
                    key={t.thread_key}
                    type="button"
                    onClick={() => {
                      setActiveThreadKey(t.thread_key);
                      setActiveThread(t);
                    }}
                    className={`w-full p-3.5 text-left flex items-start gap-3 transition-colors ${
                      isSelected ? 'bg-white/8' : 'hover:bg-white/[0.03]'
                    }`}
                  >
                    <Avatar username={t.other_user.username} size={36} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-sans font-semibold text-xs text-white truncate">
                          {getDisplayHandle(t.other_user)}
                        </span>
                        <span className="text-[10px] text-muted font-sans">
                          {new Date(t.last_message.created_at).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>

                      {t.project_title && (
                        <span className="inline-block px-1.5 py-0.5 bg-white/5 border border-line text-[10px] font-sans text-[#60a5fa] rounded mb-1 truncate max-w-[180px]">
                          {t.project_title}
                        </span>
                      )}

                      <div className="flex items-center justify-between gap-2">
                        <p className="font-sans text-xs text-muted truncate">
                          {t.last_message.content}
                        </p>
                        {t.unread_count > 0 && (
                          <span className="w-2 h-2 rounded-full bg-brand-red shrink-0" />
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANE: Conversation & Composer */}
        <div
          className={`flex-1 flex flex-col bg-surface-2 ${
            !activeThreadKey ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {activeThread ? (
            <>
              {/* Thread Header */}
              <div className="p-3.5 sm:p-4 border-b border-line bg-surface flex items-center justify-between">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveThread(null);
                      setActiveThreadKey(null);
                    }}
                    className="lg:hidden p-1.5 text-muted hover:text-white rounded-lg transition-colors"
                    aria-label="Back to conversations"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <Avatar username={activeThread.other_user.username} size={32} />
                  <div className="min-w-0">
                    <span className="font-sans font-semibold text-sm text-white block truncate">
                      {getDisplayHandle(activeThread.other_user)}
                    </span>
                    {activeThread.project_title && (
                      <span className="text-xs text-[#60a5fa] font-sans block truncate max-w-[200px] sm:max-w-xs">
                        {activeThread.project_title}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDeleteConversation}
                  className="p-1.5 text-muted hover:text-[#ff5555] transition-colors rounded-lg hover:bg-white/5"
                  title="Hide conversation"
                  aria-label="Hide conversation"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Messages Stream */}
              <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-3 font-sans">
                {isLoadingMessages ? (
                  <div className="p-8 text-center text-xs text-muted">
                    Loading messages...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted">
                    No messages yet. Send a message below.
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMe = m.sender_id === user?.id;
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[85%] sm:max-w-[75%] p-3 font-sans text-xs sm:text-sm rounded-xl leading-relaxed break-words ${
                            isMe
                              ? 'bg-white text-black font-normal'
                              : 'bg-surface border border-line text-white'
                          }`}
                        >
                          {m.content}
                        </div>
                        <span className="text-[10px] text-muted/70 mt-1 px-1 font-sans">
                          {new Date(m.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Composer (Pinned at bottom) */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 sm:p-4 border-t border-line bg-surface flex items-center gap-2"
              >
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-surface-2 border border-line rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder:text-muted focus:outline-none focus:border-white/30"
                />
                <button
                  type="submit"
                  disabled={!messageInput.trim() || isSending}
                  className="p-2.5 rounded-xl bg-white text-black hover:bg-neutral-200 transition-colors disabled:opacity-40"
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            /* Empty State for conversation pane */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-muted">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div className="space-y-1 max-w-xs">
                <p className="font-sans font-medium text-sm text-white">Select a conversation</p>
                <p className="font-sans text-xs text-muted">
                  Pick a thread on the left to read and reply.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
