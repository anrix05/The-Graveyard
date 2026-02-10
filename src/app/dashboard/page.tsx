"use client";

import { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { Package, ShoppingBag, Users, Plus, Settings, IndianRupee, Check, X, Github, MessageSquare, ChevronDown } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CyberCard from "@/components/CyberCard";
import CyberButton from "@/components/ui/CyberButton";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { mockProjects } from "@/data/mockProjects";
import { Project } from "@/types/project";
import { Transaction } from "@/types/transaction";
import OperativeCard from "@/components/OperativeCard";
// import ChatInterface from "@/components/ChatInterface"; // Switched to dynamic import
import dynamic from "next/dynamic";

const ChatInterface = dynamic(() => import("@/components/ChatInterface"), {
    loading: () => <div className="p-8 text-center text-cyber-neon font-mono animate-pulse">INITIALIZING_SECURE_CHANNEL...</div>,
    ssr: false // Chat is client-only anyway
});

import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { supabase } from "@/lib/supabase";


// Filter mock projects for different tabs (Simulation)
const myUploads = mockProjects.slice(0, 3);
const purchased = mockProjects.slice(3, 5);
const collaborations = mockProjects.slice(5, 7);

const TABS = [
    { id: "uploads", label: "MY UPLOADS", icon: Package },
    { id: "purchased", label: "PURCHASED", icon: ShoppingBag },
    { id: "sold", label: "SOLD", icon: IndianRupee },
    { id: "collab", label: "COLLABS", icon: Users },
    { id: "messages", label: "MESSAGES", icon: MessageSquare },
    { id: "settings", label: "SETTINGS", icon: Settings },
];

function DashboardContent() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const searchParams = useSearchParams();
    const router = useRouter();

    const initialTab = searchParams.get("tab") || "uploads";
    // Ensure tab exists in our allowed list, else default to uploads
    const validTabs = ["uploads", "purchased", "sold", "collab", "messages", "settings"];
    const [activeTab, setActiveTab] = useState(validTabs.includes(initialTab) ? initialTab : "uploads");
    const [isTabMenuOpen, setIsTabMenuOpen] = useState(false); // Mobile menu state

    // State can hold Projects OR Transactions depending on tab
    const [projects, setProjects] = useState<(Project | Transaction)[]>([]);
    const [requests, setRequests] = useState<Transaction[]>([]); // Incoming collab requests
    const [activePartners, setActivePartners] = useState<Transaction[]>([]); // Accepted collab requests
    const [isLoading, setIsLoading] = useState(true);

    // Update activeTab when URL changes
    useEffect(() => {
        const tab = searchParams.get("tab");
        if (tab && validTabs.includes(tab)) {
            setActiveTab(tab);
        }
    }, [searchParams]);

    // Update URL when tab changes (optional, but good for UX)
    const handleTabChange = (tabId: string) => {
        setActiveTab(tabId);
        // Shallow routing to update URL without reload
        router.push(`/dashboard?tab=${tabId}`, { scroll: false });
    };

    // Settings State
    // Settings State
    const [username, setUsername] = useState("");
    const [upiId, setUpiId] = useState("");
    const [contactInfo, setContactInfo] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // Fetch User's Projects whenever tab or user changes
    useEffect(() => {
        const fetchProjects = async () => {
            if (!user) return;
            setIsLoading(true);
            setProjects([]); // Clear old data first

            // Special Case: Fetch Settings
            if (activeTab === 'settings') {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('username, upi_id, contact_info, phone_number')
                    .eq('id', user.id)
                    .single();

                if (data) {
                    setUsername(data.username || "");
                    setUpiId(data.upi_id || "");
                    setContactInfo(data.contact_info || "");
                    setPhoneNumber(data.phone_number || "");
                }
                setIsLoading(false);
                return;
            }

            try {
                if (activeTab === 'sold') {
                    // Fetch Transactions for Sold Items
                    const { data, error } = await supabase
                        .from('transactions')
                        .select('*, project:projects!inner(title, seller_id), buyer:profiles(username)')
                        .eq('project.seller_id', user.id)
                        .eq('status', 'completed')
                        .gt('amount', 0)
                        .order('created_at', { ascending: false });

                    if (error) throw error;
                    setProjects(data || []);

                } else if (activeTab === 'collab') {
                    // 1. Fetch Incoming Requests (I am seller, status pending)
                    const { data: incoming, error: incomingError } = await supabase
                        .from('transactions')
                        .select('*, project:projects!inner(title, seller_id), buyer:profiles(username)')
                        .eq('project.seller_id', user.id)
                        .eq('status', 'pending')
                        .eq('payment_id', 'COLLAB_REQUEST')
                        .order('created_at', { ascending: false });

                    if (incomingError) console.error("Error fetching requests:", incomingError);
                    setRequests(incoming || []);

                    // 1.5 Fetch Active Partners (I am seller, status completed)
                    const { data: partners, error: partnersError } = await supabase
                        .from('transactions')
                        .select('*, project:projects!inner(*), buyer:profiles(*)') // Get full project + partner info
                        .eq('project.seller_id', user.id)
                        .eq('status', 'completed')
                        .eq('payment_id', 'COLLAB_REQUEST')
                        .order('created_at', { ascending: false });

                    if (partnersError) console.error("Error fetching partners:", partnersError);
                    // MERGE PARTNERS into main projects list

                    // 2. Fetch Active Collaborations (I am buyer/collab, status completed)
                    const { data: activeCollabs, error: activeCollabsError } = await supabase
                        .from('transactions')
                        .select('project:projects(*, seller:profiles(username, contact_info))')
                        .eq('buyer_id', user.id)
                        .eq('status', 'completed')
                        .eq('payment_id', 'COLLAB_REQUEST')
                        .order('created_at', { ascending: false });

                    if (activeCollabsError) throw activeCollabsError;

                    // Prepare Seller Projects (where I am owner, showing Partner's info)
                    const sellerProjects = partners?.map((t: any) => ({
                        ...t.project,
                        seller: t.buyer // Map partner to 'seller' prop so card shows them as the contact
                    })).filter(Boolean) || [];

                    // Prepare Buyer Projects (where I am collaborator, showing Owner's info)
                    const buyerProjects = activeCollabs?.map((t: any) => t.project).filter(Boolean) || [];

                    // Combine and Deduplicate
                    const combined = [...sellerProjects, ...buyerProjects];
                    const uniqueProjects = Array.from(new Map(combined.map(item => [item.id, item])).values());

                    setProjects(uniqueProjects);

                } else if (activeTab === 'purchased') {
                    // Fetch Purchased/Claimed Projects via Transactions
                    const { data, error } = await supabase
                        .from('transactions')
                        .select('project:projects(*)')
                        .eq('buyer_id', user.id)
                        .eq('status', 'completed')
                        .order('created_at', { ascending: false });

                    if (error) throw error;
                    // Map transactions to projects, filtering out 'collab' which belong in Collaborations tab
                    setProjects(data?.map((t: any) => t.project)
                        .filter((p: any) => p && p.interaction_type !== 'collab') // EXCLUDE Collab
                        || []
                    );

                } else {
                    let query = supabase.from('projects').select('*');

                    if (activeTab === 'uploads') {
                        // Fetch projects where seller_id is current user
                        query = query.eq('seller_id', user.id);
                    }

                    const { data, error } = await query;
                    if (error) throw error;
                    setProjects(data || []);
                }

            } catch (error) {
                console.error("Error fetching dashboard projects:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProjects();
    }, [user, activeTab]);

    // ... (existing code)

    // ... (existing code)

    const handleAccept = async (transactionId: string) => {
        if (!confirm("Accept this collaboration request?")) return;

        const { error } = await supabase
            .from('transactions')
            .update({ status: 'completed' })
            .eq('id', transactionId)
            .select('project_id') // Get project ID
            .single();

        if (error) {
            showToast("ERROR: " + error.message, "error");
            return;
        }

        // Also mark project as filled
        const { data: transactionData } = await supabase.from('transactions').select('project_id').eq('id', transactionId).single();

        if (transactionData?.project_id) {
            const { error: projectError } = await supabase
                .from('projects')
                .update({ is_collab_filled: true })
                .eq('id', transactionData.project_id);

            if (!projectError) {
                // Update local projects state if present
                setProjects(prevProjects => prevProjects.map(p =>
                    p.id === transactionData.project_id
                        ? { ...p, is_collab_filled: true }
                        : p
                ));
            } else {
                console.error("Error updating project status:", projectError);
            }
        }

        if (error) {
            showToast("ERROR: " + error.message, "error");
        } else {
            // Remove from requests list
            setRequests(prev => prev.filter(r => r.id !== transactionId));
            showToast("COLLABORATION_ESTABLISHED: Operative added.", "success");
        }
    };

    const handleReject = async (transactionId: string) => {
        if (!confirm("Reject this collaboration request?")) return;

        const { error } = await supabase
            .from('transactions')
            .update({ status: 'failed' })
            .eq('id', transactionId);

        if (error) {
            showToast("ERROR: " + error.message, "error");
        } else {
            // Remove from requests list
            setRequests(prev => prev.filter(r => r.id !== transactionId));
            showToast("REQUEST_TERMINATED", "info");
        }
    };

    const handleDeleteProject = async (projectId: string) => {
        if (!confirm("Are you sure you want to PERMANENTLY delete this project? This action cannot be undone.")) return;
        if (!confirm("Final Warning: Deleting this project will remove it from the marketplace and all associated data.")) return;

        setIsLoading(true);
        try {
            // Delete from storage (if file_url exists)
            const { data: project } = await supabase.from('projects').select('file_url').eq('id', projectId).single();

            if (project?.file_url) {
                await supabase.storage.from('project-files').remove([project.file_url]);
            }

            // Delete project record
            const { error } = await supabase.from('projects').delete().eq('id', projectId);

            if (error) throw error;

            showToast("PROJECT_TERMINATED: Deleted from database.", "success");

            // Remove from local state
            setProjects(prev => prev.filter(p => p.id !== projectId));
        } catch (error: any) {
            console.error("Error deleting project:", error);
            showToast("TERMINATION_FAILED: " + error.message, "error");
        } finally {
            setIsLoading(false);
        }
    };



    const handleSaveSettings = async () => {
        if (!user) return;

        // Validation
        const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
        const phoneRegex = /^\d{10}$/;
        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;

        if (!usernameRegex.test(username)) {
            showToast("INVALID_ID: Username must be 3-20 chars (Letters, Numbers, _).", "error");
            return;
        }

        if (upiId && !upiRegex.test(upiId)) {
            showToast("INVALID_FORMAT: Payment ID format incorrect (user@bank).", "error");
            return;
        }

        if (phoneNumber && !phoneRegex.test(phoneNumber)) {
            showToast("Phone Number must be exactly 10 digits.", "error");
            return;
        }

        setIsSaving(true);
        try {
            // Check for username uniqueness if changed
            // (Skipping for now to keep it simple, but usually good practice)

            const { data, error } = await supabase
                .from('profiles')
                .update({
                    username: username,
                    upi_id: upiId,
                    contact_info: contactInfo,
                    phone_number: phoneNumber
                })
                .eq('id', user.id)
                .select();

            if (error) throw error;

            showToast("Configuration Saved Successfully!", "success");
        } catch (error: any) {
            console.error("Error saving settings:", error);
            showToast(`Failed to save: ${error.message}`, "error");
        } finally {
            setIsSaving(false);
        }
    };


    return (
        <div className="min-h-screen bg-cyber-black text-foreground selection:bg-cyber-red selection:text-white flex flex-col">
            <Header />

            <main className="flex-1 container mx-auto px-4 py-8 md:py-12 space-y-8">

                {/* Dashboard Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-cyber-gray/30 pb-8">
                    <div>
                        <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-2 tracking-wider">
                            <span className="text-cyber-neon mr-4">::</span>
                            OPERATOR DASHBOARD
                        </h1>
                        <p className="text-cyber-muted font-mono text-sm max-w-xl">
                            Manage your digital assets, track sales, and monitor active collaborations.
                        </p>
                    </div>

                    <Link href="/submit">
                        <CyberButton className="bg-cyber-red text-white font-bold tracking-widest cyber-clip-sm">
                            <Plus className="w-5 h-5 mr-2" />
                            NEW UPLOAD
                        </CyberButton>
                    </Link>
                </div>

                {/* Tabs - Mobile Dropdown */}
                <div className="md:hidden relative mb-6 z-30">
                    <button
                        onClick={() => setIsTabMenuOpen(!isTabMenuOpen)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-cyber-black border border-cyber-neon/30 text-cyber-neon font-mono text-sm tracking-widest rounded-md"
                    >
                        <div className="flex items-center gap-2">
                            {(() => {
                                const active = TABS.find(t => t.id === activeTab) || TABS[0];
                                const Icon = active.icon;
                                return (
                                    <>
                                        <Icon className="w-4 h-4" />
                                        <span>{active.label}</span>
                                    </>
                                );
                            })()}
                        </div>
                        <ChevronDown className={cn("w-4 h-4 transition-transform", isTabMenuOpen ? "rotate-180" : "")} />
                    </button>

                    {isTabMenuOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-cyber-black border border-cyber-gray/30 rounded-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            {TABS.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => {
                                            handleTabChange(tab.id); // Update URL and Tab
                                            setProjects([]); // Clear for safety
                                            setIsLoading(true);
                                            setIsTabMenuOpen(false); // Close menu
                                        }}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-4 py-3 font-mono text-sm tracking-widest transition-all text-left border-b border-cyber-gray/10 last:border-0",
                                            isActive
                                                ? "bg-cyber-neon/10 text-cyber-neon"
                                                : "text-cyber-gray hover:text-white hover:bg-cyber-gray/10"
                                        )}
                                    >
                                        <Icon className="w-4 h-4" />
                                        <span>{tab.label.replace('COLLABORATIONS', 'COLLABS')}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Tabs - Height Desktop Only */}
                <div className="hidden md:flex md:flex-row gap-2 pb-2 w-full">
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    handleTabChange(tab.id);
                                    setProjects([]);
                                    setIsLoading(true);
                                }}
                                className={cn(
                                    "flex flex-col md:flex-row items-center justify-center gap-2 md:gap-3 px-2 md:px-6 py-3 font-mono text-[10px] md:text-sm tracking-widest transition-all border rounded-md md:rounded-none md:border-t-0 md:border-x-0 md:border-b-2",
                                    isActive
                                        ? "border-cyber-neon text-cyber-neon bg-cyber-neon/10 md:bg-cyber-neon/5"
                                        : "border-cyber-gray/30 md:border-transparent text-cyber-muted hover:text-white hover:bg-cyber-gray/10"
                                )}
                            >
                                <Icon className="w-5 h-5 md:w-4 md:h-4 mb-1 md:mb-0" />
                                <span className="text-center">{tab.label.replace('COLLABORATIONS', 'COLLABS')}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Content Grid */}
                <div className="min-h-[400px]">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className={activeTab === 'settings' ? "max-w-2xl mx-auto" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"}
                    >
                        {activeTab === 'settings' ? (
                            <div className="bg-cyber-dark/50 border border-cyber-gray/30 p-4 md:p-8 cyber-clip rounded-lg relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-20">
                                    <Settings className="w-16 h-16 md:w-24 md:h-24 text-cyber-neon spin-slow" />
                                </div>

                                <h2 className="text-xl md:text-2xl font-display text-white mb-6 flex items-center gap-3">
                                    <IndianRupee className="w-6 h-6 text-cyber-neon" />
                                    PAYOUT_CONFIGURATION
                                </h2>

                                <div className="space-y-6 relative z-10">
                                    <div>
                                        {/* USER IDENTITY */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                            <div>
                                                <label className="block text-cyber-muted font-mono text-xs uppercase tracking-widest mb-2">
                                                    Operative Codename (Username)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={username}
                                                    onChange={(e) => setUsername(e.target.value)}
                                                    className="w-full bg-cyber-black border border-cyber-gray text-white px-4 py-3 focus:border-cyber-neon focus:outline-none font-mono transition-colors"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-cyber-muted font-mono text-xs uppercase tracking-widest mb-2">
                                                    Secure Comms (Phone)
                                                </label>
                                                <input
                                                    type="tel"
                                                    value={phoneNumber}
                                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                                    placeholder="10-digit number"
                                                    maxLength={10}
                                                    className="w-full bg-cyber-black border border-cyber-gray text-white px-4 py-3 focus:border-cyber-neon focus:outline-none font-mono transition-colors"
                                                />
                                            </div>
                                        </div>

                                        {/* PAYMENT INFO */}
                                        <label className="block text-cyber-muted font-mono text-xs uppercase tracking-widest mb-2">
                                            Registered UPI ID (For Payouts)
                                        </label>
                                        <input
                                            type="text"
                                            value={upiId}
                                            onChange={(e) => setUpiId(e.target.value)}
                                            placeholder="username@bank"
                                            className="w-full bg-cyber-black border border-cyber-gray text-white px-4 py-3 focus:border-cyber-neon focus:outline-none font-mono transition-colors mb-2"
                                        />
                                        <p className="text-[10px] text-cyber-gray mb-6">
                                            * Funds from sales will be transferred to this ID.
                                        </p>

                                        <label className="block text-cyber-muted font-mono text-xs uppercase tracking-widest mb-2">
                                            Secure Contact Channel (For Collaborators)
                                        </label>
                                        <div className="flex flex-col md:flex-row gap-4">
                                            <input
                                                type="text"
                                                value={contactInfo}
                                                onChange={(e) => setContactInfo(e.target.value)}
                                                placeholder="SIGNAL / DISCORD / EMAIL"
                                                className="flex-1 bg-cyber-black border border-cyber-gray text-white px-4 py-3 focus:border-cyber-neon focus:outline-none font-mono transition-colors"
                                            />
                                            <CyberButton
                                                onClick={handleSaveSettings}
                                                disabled={isSaving}
                                                className="bg-cyber-neon text-cyber-black font-bold whitespace-nowrap w-full md:w-auto justify-center"
                                            >
                                                {isSaving ? "SAVING..." : "SAVE_CONFIG"}
                                            </CyberButton>
                                        </div>
                                        <p className="text-[10px] text-cyber-gray mt-2">
                                            * This information is ONLY visible to accepted collaborators.
                                        </p>
                                    </div>

                                    <div className="pt-6 border-t border-cyber-gray/20">
                                        <div className="flex items-center justify-between text-sm font-mono text-cyber-muted mb-2">
                                            <span>ACCOUNT_STATUS</span>
                                            <span className="text-cyber-neon">ACTIVE</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm font-mono text-cyber-muted">
                                            <span>PLATFORM_FEE</span>
                                            <span>5%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : activeTab === 'messages' ? (
                            <div className="col-span-full">
                                <ChatInterface />
                            </div>
                        ) : activeTab === 'sold' ? (
                            <div className="col-span-full space-y-4">
                                {/* Desktop Table View */}
                                <div className="hidden md:block bg-cyber-dark/50 border border-cyber-gray/30 cyber-clip rounded-lg overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-cyber-gray/30 bg-cyber-black/50">
                                                    <th className="p-4 font-mono text-xs text-cyber-muted uppercase tracking-wider">Date</th>
                                                    <th className="p-4 font-mono text-xs text-cyber-muted uppercase tracking-wider">Project</th>
                                                    <th className="p-4 font-mono text-xs text-cyber-muted uppercase tracking-wider">Buyer</th>
                                                    <th className="p-4 font-mono text-xs text-cyber-muted uppercase tracking-wider text-right">Price</th>
                                                    <th className="p-4 font-mono text-xs text-cyber-muted uppercase tracking-wider text-center">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-cyber-gray/10">
                                                {isLoading ? (
                                                    <tr><td colSpan={5} className="p-8 text-center text-cyber-neon font-mono animate-pulse">LOADING_DATA...</td></tr>
                                                ) : projects.length > 0 ? (
                                                    (projects as Transaction[]).map((item) => (
                                                        <tr key={item.id} className="hover:bg-cyber-gray/5 transition-colors group">
                                                            <td className="p-4 font-mono text-sm text-cyber-gray">
                                                                {new Date(item.created_at).toLocaleDateString()}
                                                            </td>
                                                            <td className="p-4 font-display font-bold text-white group-hover:text-cyber-neon transition-colors">
                                                                {item.project?.title || "UNKNOWN_PROJECT"}
                                                            </td>
                                                            <td className="p-4 font-mono text-sm text-white">
                                                                <div className="flex flex-col">
                                                                    <span>{item.buyer?.username || "UNKNOWN_USER"}</span>
                                                                    {item.github_username && (
                                                                        <span className="text-[10px] text-cyber-muted flex items-center gap-1 mt-0.5">
                                                                            <Github className="w-3 h-3" />
                                                                            {item.github_username}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="p-4 font-mono text-sm text-right text-cyber-neon">
                                                                ₹{item.amount}
                                                            </td>
                                                            <td className="p-4 text-center">
                                                                <span className="px-2 py-1 text-[10px] font-bold font-mono bg-cyber-neon/10 text-cyber-neon border border-cyber-neon/30 rounded-sm uppercase">
                                                                    COMPLETED
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={5} className="p-8 text-center text-cyber-muted font-mono">
                                                            NO_SALES_RECORDED
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Mobile Card View */}
                                <div className="md:hidden space-y-4">
                                    {isLoading ? (
                                        <div className="p-8 text-center text-cyber-neon font-mono animate-pulse border border-dashed border-cyber-gray/30 rounded-lg">
                                            LOADING_DATA...
                                        </div>
                                    ) : projects.length > 0 ? (
                                        projects.map((item: any) => (
                                            <div key={item.id} className="bg-cyber-dark/50 border border-cyber-gray/30 rounded-lg p-4 space-y-3">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-display font-bold text-white text-lg leading-tight">
                                                            {item.project?.title || "UNKNOWN_PROJECT"}
                                                        </h4>
                                                        <div className="text-xs font-mono text-cyber-muted mt-1">
                                                            {new Date(item.created_at).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                    <span className="px-2 py-1 text-[10px] font-bold font-mono bg-cyber-neon/10 text-cyber-neon border border-cyber-neon/30 rounded-sm uppercase">
                                                        SOLD
                                                    </span>
                                                </div>

                                                <div className="flex justify-between items-end border-t border-cyber-gray/10 pt-3">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] text-cyber-muted uppercase tracking-wider">Buyer</span>
                                                        <span className="font-mono text-sm text-white">{item.buyer?.username || "UNKNOWN"}</span>
                                                        {item.github_username && (
                                                            <span className="text-[10px] text-cyber-muted flex items-center gap-1 mt-0.5">
                                                                <Github className="w-3 h-3" />
                                                                {item.github_username}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-xl font-mono font-bold text-cyber-neon">
                                                        ₹{item.amount}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-8 text-center text-cyber-muted font-mono border border-dashed border-cyber-gray/30 rounded-lg">
                                            NO_SALES_RECORDED
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : isLoading ? (
                            <div className="col-span-full py-20 text-center text-cyber-neon animate-pulse font-mono">
                                LOADING_DATA_STREAM...
                            </div>
                        ) : (
                            <>
                                {/* Pending Requests Section */}
                                {activeTab === 'collab' && requests.length > 0 && (
                                    <div className="col-span-full mb-8">
                                        <h3 className="text-xl font-display text-cyber-neon mb-4 flex items-center gap-2">
                                            <Users className="w-5 h-5" />
                                            PENDING_REQUESTS
                                        </h3>
                                        <div className="bg-cyber-dark/50 border border-cyber-gray/30 cyber-clip rounded-lg overflow-hidden">
                                            <table className="w-full text-left border-collapse">
                                                <thead className="bg-cyber-black/50 border-b border-cyber-gray/30">
                                                    <tr>
                                                        <th className="p-4 font-mono text-xs text-cyber-muted uppercase tracking-wider">Requester</th>
                                                        <th className="p-4 font-mono text-xs text-cyber-muted uppercase tracking-wider">Project</th>
                                                        <th className="p-4 font-mono text-xs text-cyber-muted uppercase tracking-wider">Application</th>
                                                        <th className="p-4 font-mono text-xs text-cyber-muted uppercase tracking-wider text-right">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-cyber-gray/10">
                                                    {requests.map((request) => (
                                                        <tr key={request.id} className="hover:bg-cyber-gray/5">
                                                            <td className="p-4 font-mono text-sm text-white">
                                                                {request.buyer?.username}
                                                            </td>
                                                            <td className="p-4 font-display font-bold text-white">
                                                                {request.project?.title}
                                                            </td>
                                                            <td className="p-4 font-mono text-sm text-cyber-gray">
                                                                {request.metadata ? (
                                                                    <div className="flex flex-col gap-1">
                                                                        <span className="text-white text-xs block" title="Contact Info">
                                                                            {request.metadata.contact}
                                                                        </span>
                                                                        <span className="text-[10px] text-cyber-muted truncate max-w-[200px] block" title={request.metadata.specialization}>
                                                                            {request.metadata.specialization}
                                                                        </span>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-cyber-muted text-xs italic">Legacy Request</span>
                                                                )}
                                                            </td>
                                                            <td className="p-4 text-right">
                                                                <div className="flex items-center justify-end gap-2">
                                                                    <button
                                                                        onClick={() => handleAccept(request.id)}
                                                                        className="p-2 hover:bg-green-500/20 text-green-500 border border-transparent hover:border-green-500/50 rounded transition-all"
                                                                        title="Accept"
                                                                    >
                                                                        <Check className="w-4 h-4" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleReject(request.id)}
                                                                        className="p-2 hover:bg-red-500/20 text-red-500 border border-transparent hover:border-red-500/50 rounded transition-all"
                                                                        title="Reject"
                                                                    >
                                                                        <X className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* Active Partners Table Removed - Merged into Main Grid */}

                                {/* Card Grid for Projects (Collaborations I'm in OR My Uploads OR Purchased) */}
                                {projects.length > 0 && (
                                    (projects as Project[]).map((project) => (
                                        <motion.div
                                            key={project.id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <CyberCard
                                                project={project}
                                                isOwner={activeTab === 'uploads' || activeTab === 'sold'}
                                                isPurchased={activeTab === 'purchased'}
                                                isCollaborator={activeTab === 'collab'}
                                                onDelete={activeTab === 'uploads' ? handleDeleteProject : undefined}
                                            />
                                        </motion.div>
                                    ))
                                )}
                                {/* Show "No Data" only if NO requests AND NO active partners AND NO projects */}
                                {(activeTab !== 'collab' || (requests.length === 0 && activePartners.length === 0)) && projects.length === 0 && (
                                    <div className="col-span-full py-20 text-center border border-dashed border-cyber-gray/30 rounded-lg bg-cyber-dark/20">
                                        <p className="font-display tracking-widest text-cyber-muted text-xl">NO_DATA_FOUND</p>
                                        <p className="font-mono text-sm text-cyber-gray mt-2">This sector is empty.</p>
                                    </div>
                                )}
                            </>
                        )}
                    </motion.div>
                </div>

            </main>

            <Footer />
        </div>
    );
}

export default function DashboardPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen bg-cyber-black text-cyber-neon font-mono animate-pulse">
                INITIALIZING_DASHBOARD_PROTOCOL...
            </div>
        }>
            <DashboardContent />
        </Suspense>
    );
}
