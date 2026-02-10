"use client";

import { useState, useEffect, useRef } from "react";
import { useToast } from "@/context/ToastContext";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Message, ChatUser } from "@/types/message";
import { Send, User, Search, MoreVertical, Phone, Video, ArrowLeft, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import CyberButton from "./ui/CyberButton";
import { motion, AnimatePresence } from "framer-motion";

export default function ChatInterface() {
    const { user } = useAuth();
    const [conversations, setConversations] = useState<ChatUser[]>([]);
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // 1. Fetch Conversations (Unique Users)
    useEffect(() => {
        if (!user) return;

        const fetchConversations = async () => {
            setIsLoading(true);
            try {
                // Get all messages where user is sender OR receiver
                const { data, error } = await supabase
                    .from("messages")
                    .select("*, sender:profiles!sender_id(username), receiver:profiles!receiver_id(username)")
                    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
                    .order("created_at", { ascending: false });

                if (error) throw error;

                // Process into unique conversations
                const uniqueUsers = new Map<string, ChatUser>();

                data?.forEach((msg: any) => {
                    const isMeSender = msg.sender_id === user.id;

                    // Skip if deleted by me
                    if (isMeSender && msg.deleted_by_sender) return;
                    if (!isMeSender && msg.deleted_by_receiver) return;

                    const partnerId = isMeSender ? msg.receiver_id : msg.sender_id;
                    const partnerUsername = isMeSender
                        ? msg.receiver?.username
                        : msg.sender?.username;

                    if (!uniqueUsers.has(partnerId)) {
                        uniqueUsers.set(partnerId, {
                            id: partnerId,
                            username: partnerUsername || "Unknown User",
                            last_message: msg.content,
                            last_message_time: msg.created_at,
                        });
                    }
                });

                setConversations(Array.from(uniqueUsers.values()));

                // Auto-select first chat if none selected
                if (!activeChatId && uniqueUsers.size > 0) {
                    // Optional: setActiveChatId(Array.from(uniqueUsers.keys())[0]);
                }

            } catch (error) {
                console.error("Error fetching conversations:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchConversations();

        // Subscribe to NEW conversations (simplified: just refreshing lists on new message)
        // Ideally we'd have a separate subscription for the list vs the active chat
    }, [user]);

    // 1.5 Handle "chat_with" query param
    const searchParams = useSearchParams();
    const chatWithId = searchParams.get("chat_with");

    useEffect(() => {
        if (!chatWithId || !user || isLoading || (conversations.length === 0 && isLoading)) return; // Wait for initial load

        const targetId = chatWithId;

        // Check if already in conversations
        const existing = conversations.find(c => c.id === targetId);
        if (existing) {
            setActiveChatId(targetId);
        } else {
            // Fetch profile and add to list
            const fetchTargetProfile = async () => {
                const { data, error } = await supabase.from('profiles').select('username').eq('id', targetId).single();
                if (data) {
                    const newConv: ChatUser = {
                        id: targetId,
                        username: data.username || "Unknown",
                        last_message: "New Connection",
                        last_message_time: new Date().toISOString()
                    };
                    setConversations(prev => {
                        // Double check it wasn't added while fetching
                        if (prev.find(c => c.id === targetId)) return prev;
                        return [newConv, ...prev];
                    });
                    setActiveChatId(targetId);
                }
            };
            fetchTargetProfile();
        }
    }, [chatWithId, user, isLoading, conversations]);

    // 2. Fetch Messages for Active Chat & Subscribe
    useEffect(() => {
        if (!user || !activeChatId) return;

        const fetchMessages = async () => {
            const { data, error } = await supabase
                .from("messages")
                .select("*")
                .or(`and(sender_id.eq.${user.id},receiver_id.eq.${activeChatId}),and(sender_id.eq.${activeChatId},receiver_id.eq.${user.id})`)
                .order("created_at", { ascending: true });

            if (error) console.error("Error loading chat:", error);
            else setMessages(data || []);
        };

        fetchMessages();

        // Realtime Subscription
        const channel = supabase
            .channel(`chat:${activeChatId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                    filter: `sender_id=in.(${user.id},${activeChatId})`,
                    // Note: Supabase filter might be tricky with OR, so we might receive all and filter client side or distinct channels
                },
                (payload) => {
                    const newMsg = payload.new as Message;
                    // Verify it belongs to this chat
                    if (
                        (newMsg.sender_id === user.id && newMsg.receiver_id === activeChatId) ||
                        (newMsg.sender_id === activeChatId && newMsg.receiver_id === user.id)
                    ) {
                        setMessages((prev) => [...prev, newMsg]);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, activeChatId]);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const { showToast } = useToast();

    // ... (existing code)

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user || !activeChatId) return;

        const msgContent = newMessage.trim();
        setNewMessage(""); // Optimistic clear

        const { error } = await supabase.from("messages").insert({
            sender_id: user.id,
            receiver_id: activeChatId,
            content: msgContent,
        });

        if (error) {
            console.error("Error sending message:", error);
            showToast("TRANSMISSION_FAILED: " + error.message, "error");
        }
    };

    const handleDeleteChat = async () => {
        if (!activeChatId || !user) return;
        if (!confirm("DELETE_CHANNEL: Are you sure? This will remove the conversation from your view.")) return;

        // 1. Mark sent messages as deleted_by_sender
        const { error: senderError } = await supabase
            .from('messages')
            .update({ deleted_by_sender: true })
            .eq('sender_id', user.id)
            .eq('receiver_id', activeChatId);

        // 2. Mark received messages as deleted_by_receiver
        const { error: receiverError } = await supabase
            .from('messages')
            .update({ deleted_by_receiver: true })
            .eq('receiver_id', user.id)
            .eq('sender_id', activeChatId);

        if (senderError || receiverError) {
            console.error("Error deleting chat:", senderError || receiverError);
            showToast("DELETE_FAILED: Protocol Error.", "error");
        } else {
            // Remove from local state
            setConversations(prev => prev.filter(c => c.id !== activeChatId));
            setActiveChatId(null);
            showToast("CHANNEL_TERMINATED", "success");
        }
    };



    const activeUser = conversations.find(c => c.id === activeChatId);

    return (
        <div className="flex h-[80vh] md:h-[600px] bg-cyber-dark/50 border border-cyber-gray/30 rounded-lg overflow-hidden cyber-clip">

            {/* Sidebar - User List */}
            <div className={cn(
                "w-full md:w-1/3 border-r border-cyber-gray/30 flex-col",
                activeChatId ? "hidden md:flex" : "flex"
            )}>
                <div className="p-4 border-b border-cyber-gray/30 bg-cyber-black/20">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-cyber-muted" />
                        <input
                            type="text"
                            placeholder="SEARCH_OPERATIVES..."
                            className="w-full bg-cyber-black border border-cyber-gray/50 rounded pl-9 pr-3 py-2 text-sm text-white focus:border-cyber-neon focus:outline-none font-mono"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div className="p-4 text-center text-cyber-muted font-mono animate-pulse">LOADING_NET...</div>
                    ) : conversations.length === 0 ? (
                        <div className="p-4 text-center text-cyber-muted font-mono text-sm opacity-50">NO_ACTIVE_CHANNELS</div>
                    ) : (
                        conversations.map(conv => (
                            <button
                                key={conv.id}
                                onClick={() => setActiveChatId(conv.id)}
                                className={cn(
                                    "w-full p-4 flex items-center gap-3 hover:bg-cyber-gray/10 transition-colors text-left border-b border-cyber-gray/10",
                                    activeChatId === conv.id ? "bg-cyber-neon/5 border-l-2 border-l-cyber-neon" : "border-l-2 border-l-transparent"
                                )}
                            >
                                <div className="w-10 h-10 rounded-full bg-cyber-gray/30 flex items-center justify-center border border-cyber-gray/50">
                                    <User className="w-5 h-5 text-cyber-muted" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <span className={cn("font-bold text-sm truncate", activeChatId === conv.id ? "text-white" : "text-cyber-gray")}>
                                            {conv.username}
                                        </span>
                                        {conv.last_message_time && (
                                            <span className="text-[10px] text-cyber-muted font-mono">
                                                {new Date(conv.last_message_time).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-cyber-muted truncate font-mono opacity-70">
                                        {conv.last_message}
                                    </p>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className={cn(
                "flex-1 flex-col bg-cyber-black/40",
                !activeChatId ? "hidden md:flex" : "flex"
            )}>
                {activeChatId ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b border-cyber-gray/30 flex items-center gap-3 bg-cyber-dark/80 backdrop-blur-sm">
                            <button
                                onClick={() => setActiveChatId(null)}
                                className="md:hidden p-2 -ml-2 text-cyber-muted hover:text-white"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>

                            <div className="flex items-center gap-3 flex-1">
                                <div className="w-10 h-10 rounded-full bg-cyber-neon/10 border border-cyber-neon/30 flex items-center justify-center">
                                    <User className="w-5 h-5 text-cyber-neon" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white tracking-wide">{activeUser?.username}</h3>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                        <span className="text-[10px] text-cyber-muted font-mono">ENCRYPTED_CONNECTION_ACTIVE</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleDeleteChat}
                                className="p-2 text-cyber-red hover:bg-cyber-red/10 rounded-md transition-colors"
                                title="DELETE_CHANNEL"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Messages List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-cyber-muted opacity-50 space-y-2">
                                    <div className="w-16 h-16 rounded-full bg-cyber-gray/10 flex items-center justify-center">
                                        <MessageCircle className="w-8 h-8" />
                                    </div>
                                    <p className="font-mono text-sm">BEGIN_TRANSMISSION</p>
                                </div>
                            ) : (
                                messages.map((msg) => {
                                    const isMe = msg.sender_id === user?.id;
                                    return (
                                        <motion.div
                                            key={msg.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={cn(
                                                "flex",
                                                isMe ? "justify-end" : "justify-start"
                                            )}
                                        >
                                            <div className={cn(
                                                "max-w-[70%] rounded-lg p-3 text-sm relative",
                                                isMe
                                                    ? "bg-cyber-neon/10 text-white border border-cyber-neon/30 rounded-tr-none"
                                                    : "bg-cyber-gray/20 text-white border border-cyber-gray/30 rounded-tl-none"
                                            )}>
                                                <p>{msg.content}</p>
                                                <span className="text-[10px] opacity-70 block text-right mt-1 font-mono">
                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </motion.div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleSendMessage} className="p-4 border-t border-cyber-gray/30 bg-cyber-dark/50">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a secure message..."
                                    className="flex-1 bg-cyber-black border border-cyber-gray/50 rounded-md px-4 py-3 text-sm text-white focus:border-cyber-neon focus:outline-none font-mono"
                                />
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim()}
                                    className="bg-cyber-neon hover:bg-cyber-neon/80 text-cyber-black p-3 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-cyber-muted space-y-4 opacity-50">
                        <div className="w-24 h-24 rounded-full bg-cyber-gray/10 flex items-center justify-center border border-cyber-gray/20">
                            <span className="text-4xl">💬</span>
                        </div>
                        <div className="text-center">
                            <h3 className="text-xl font-display tracking-widest text-white mb-2">NO_SIGNAL</h3>
                            <p className="font-mono text-sm max-w-xs">Select an operative from the database to establish a secure comms link.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// Helper icon
function MessageCircle({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
        </svg>
    )
}
