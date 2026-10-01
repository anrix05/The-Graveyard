'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  User,
  Search,
  Trash2,
  ExternalLink,
  MessageSquare,
  Sparkles,
  ArrowLeft,
  Circle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Message, ChatThread } from '@/types/message';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface ChatInterfaceProps {
  initialRecipientId?: string | null;
}

export default function ChatInterface({ initialRecipientId }: ChatInterfaceProps) {
  const { user } = useAuth();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadKey, setActiveThreadKey] = useState<string | null>(null);
  const [activeThread, setActiveThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isLoadingThreads, setIsLoadingThreads] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 1. Fetch all threads for current user
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

      // Group messages by thread_key
      const threadMap = new Map<string, ChatThread>();

      data?.forEach((msg: any) => {
        const isMeSender = msg.sender_id === user.id;

        // Skip soft-deleted messages
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
              username: 'Operative',
              reputation_score: 100,
              github_url: null,
            },
            project_id: msg.project_id,
            project_title: msg.project?.title,
            last_message: msg,
            unread_count: !isMeSender && !msg.is_read ? 1 : 0,
          });
        }
      });

      const threadList = Array.from(threadMap.values());
      setThreads(threadList);

      // If initialRecipientId passed, find or create thread
      if (initialRecipientId && initialRecipientId !== user.id) {
        const existing = threadList.find((t) => t.other_user.id === initialRecipientId);
        if (existing) {
          setActiveThreadKey(existing.thread_key);
          setActiveThread(existing);
        } else {
          // Fetch recipient profile
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
              content: 'Channel initialized.',
              is_read: true,
              created_at: new Date().toISOString(),
            },
            unread_count: 0,
          };
          setThreads([newThread, ...threadList]);
          setActiveThreadKey(tempThreadKey);
          setActiveThread(newThread);
        }
      } else if (!activeThreadKey && threadList.length > 0) {
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

  // 2. Fetch messages for active thread & mark as read
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
          // Filter out soft deleted
          const filtered = data.filter((m) => {
            if (m.sender_id === user.id) return !m.deleted_by_sender;
            return !m.deleted_by_receiver;
          });
          setMessages(filtered);

          // Mark unread messages as read
          await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('thread_key', activeThreadKey)
            .eq('receiver_id', user.id)
            .eq('is_read', false);
        }
      } catch (e) {
        console.error('Error loading messages:', e);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    fetchMessages();

    // 3. Realtime subscription for incoming messages
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
            // Avoid duplicate if optimistic was added
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

  // Send message handler with optimistic update
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

      // Replace optimistic message with real message
      if (data) {
        setMessages((prev) => prev.map((m) => (m.id === optimisticId ? data : m)));
      }
    } catch (err: unknown) {
      toast.error('Failed to dispatch message.');
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
    } finally {
      setIsSending(false);
    }
  };

  // Soft delete conversation
  const handleDeleteConversation = async () => {
    if (!user || !activeThread) return;
    if (!confirm('Hide this transmission thread from your console?')) return;

    try {
      // Mark as deleted for sender or receiver
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

      toast.success('Conversation removed from view.');
      loadThreads();
      setActiveThread(null);
      setActiveThreadKey(null);
    } catch (e) {
      toast.error('Failed to remove conversation.');
    }
  };

  return (
    <div className="h-[calc(100dvh-140px)] min-h-[460px] max-h-[820px] w-full border border-line bg-surface rounded-card flex overflow-hidden shadow-xl relative">
      {/* LEFT PANE: Thread List (Full width on < lg when no active thread; hidden on < lg when thread active; fixed width on >= lg) */}
      <div
        className={`w-full lg:w-80 xl:w-96 border-r border-line flex flex-col bg-surface transition-all ${
          activeThreadKey ? 'hidden lg:flex' : 'flex'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-line flex items-center justify-between">
          <span className="font-sans text-sm font-semibold text-white">
            Conversations
          </span>
          <span className="font-mono text-xs text-[#39ff14] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#39ff14] shadow-[0_0_6px_#39ff14]" />
            Live
          </span>
        </div>

        {/* Thread List Scroll */}
        <div className="flex-1 overflow-y-auto divide-y divide-line">
          {isLoadingThreads ? (
            <div className="p-8 text-center font-mono text-xs text-[#9ca3af]">
              Synthesizing channels...
            </div>
          ) : threads.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <MessageSquare className="w-8 h-8 text-[#9ca3af] mx-auto opacity-40" />
              <p className="font-mono text-xs text-[#9ca3af]">No active communications.</p>
              <p className="font-sans text-[11px] text-[#9ca3af]/60">
                Pitches and inquiries will appear here.
              </p>
            </div>
          ) : (
            threads.map((t) => {
              const isSelected = activeThreadKey === t.thread_key;
              return (
                <button
                  key={t.thread_key}
                  onClick={() => {
                    setActiveThreadKey(t.thread_key);
                    setActiveThread(t);
                  }}
                  className={`w-full p-3.5 text-left flex items-start gap-3 transition-colors ${
                    isSelected ? 'bg-[#1e1e1e]' : 'hover:bg-[#181818]'
                  }`}
                >
                  <Avatar src={t.other_user.avatar_url} username={t.other_user.username} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-display font-semibold text-xs text-white truncate">
                        @{t.other_user.username}
                      </span>
                      <span className="font-mono text-[10px] text-[#9ca3af]">
                        {new Date(t.last_message.created_at).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>

                    {/* Project chip if thread is tied to project */}
                    {t.project_title && (
                      <span className="inline-block px-1.5 py-0.5 bg-black/40 border border-white/5 font-mono text-[10px] text-[#60a5fa] rounded mb-1 truncate max-w-[180px]">
                        Project: {t.project_title}
                      </span>
                    )}

                    <p className="font-sans text-xs text-[#9ca3af] truncate">
                      {t.last_message.content}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT PANE: Conversation View */}
      <div className={`flex-1 flex flex-col bg-surface-2 ${!activeThreadKey ? 'hidden lg:flex' : 'flex'}`}>
        {activeThread ? (
          <>
            {/* Thread Header */}
            <div className="p-3.5 sm:p-4 border-b border-line bg-surface flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => {
                    setActiveThread(null);
                    setActiveThreadKey(null);
                  }}
                  className="lg:hidden p-1.5 -ml-1 text-muted hover:text-white hover:bg-surface-2 rounded-lg transition-colors flex items-center"
                  aria-label="Back to conversations"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <Avatar src={activeThread.other_user.avatar_url} username={activeThread.other_user.username} size={32} />
                <div className="min-w-0">
                  <span className="font-sans font-semibold text-sm text-white block truncate">
                    @{activeThread.other_user.username}
                  </span>
                  {activeThread.project_title && (
                    <span className="font-mono text-xs text-[#60a5fa] flex items-center gap-1 truncate max-w-[200px] sm:max-w-xs">
                      <span>Thread: {activeThread.project_title}</span>
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={handleDeleteConversation}
                className="p-1.5 text-muted hover:text-[#ff2a2a] transition-colors rounded"
                title="Hide thread"
                aria-label="Delete thread"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Messages Stream */}
            <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-3">
              {isLoadingMessages ? (
                <div className="p-8 text-center font-mono text-xs text-muted">
                  Loading messages...
                </div>
              ) : messages.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted">
                  Beginning of secure channel. Send a message below.
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
                        className={`max-w-[85%] sm:max-w-[75%] p-3 font-sans text-xs sm:text-sm rounded-xl leading-relaxed break-anywhere ${
                          isMe
                            ? 'bg-white text-black font-normal'
                            : 'bg-surface border border-line text-white'
                        }`}
                      >
                        {m.content}
                      </div>
                      <span className="font-mono text-[10px] text-muted mt-1 px-1">
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

            {/* Message Input Box - Sticky at bottom with safe-area padding */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-line bg-surface flex gap-2 sticky bottom-0 safe-pb">
              <Input
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Type your transmission..."
                className="flex-1 h-10 font-sans text-base sm:text-xs"
              />
              <Button
                variant="primary"
                mode="brand"
                size="sm"
                type="submit"
                disabled={!messageInput.trim() || isSending}
                isLoading={isSending}
                rightIcon={<Send className="w-3.5 h-3.5" />}
              >
                Send
              </Button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted">
            <MessageSquare className="w-10 h-10 mb-3 opacity-30" />
            <h3 className="font-display font-semibold text-white text-base">Select a conversation</h3>
            <p className="font-sans text-xs max-w-xs mt-1">
              Choose an active transmission from the left to view messages or negotiate with developers.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
