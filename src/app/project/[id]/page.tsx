"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Project, Profile } from "@/types/project";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TechBadge from "@/components/TechBadge";
import { motion } from "framer-motion";
import { GitFork, IndianRupee, Users, ArrowLeft, ShieldAlert, Cpu, Calendar, User as UserIcon, Lock, Eye, MessageSquare } from "lucide-react";
import CyberButton from "@/components/ui/CyberButton";
import Link from "next/link";
import { useToast } from "@/context/ToastContext";

import PaymentModal from "@/components/PaymentModal";
import CollabRequestModal from "@/components/CollabRequestModal";

export default function ProjectDetailsPage() {
    const { id } = useParams();
    const { user } = useAuth();
    const router = useRouter();

    const [project, setProject] = useState<Project | null>(null);
    const [seller, setSeller] = useState<Profile | null>(null);
    const [partner, setPartner] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [isCollabModalOpen, setIsCollabModalOpen] = useState(false);

    const [hasPendingRequest, setHasPendingRequest] = useState(false);

    useEffect(() => {
        const fetchProject = async () => {
            if (!id) return;
            setIsLoading(true);

            // Fetch Project
            const { data: projectData, error: projectError } = await supabase
                .from('projects')
                .select('*')
                .eq('id', id)
                .single();

            if (projectError) {
                console.error("Error fetching project:", projectError);
                setIsLoading(false);
                return;
            }

            setProject(projectData);

            // Fetch Seller
            if (projectData.seller_id) {
                const { data: sellerData, error: sellerError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', projectData.seller_id)
                    .single();

                if (!sellerError) {
                    setSeller(sellerData);
                }
            }

            // Check for pending request if user is logged in
            if (user) {
                // If I am the seller AND project is filled, fetch the PARTNER
                if (user.id === projectData.seller_id && projectData.is_collab_filled) {
                    const { data: partnerTx } = await supabase
                        .from('transactions')
                        .select('buyer:profiles(*)')
                        .eq('project_id', id)
                        .eq('status', 'completed')
                        .eq('payment_id', 'COLLAB_REQUEST')
                        .single();

                    if (partnerTx?.buyer) {
                        setPartner(partnerTx.buyer as unknown as Profile);
                    }
                }

                // If I am the buyer, check for my pending request
                const { data: existingRequests } = await supabase
                    .from('transactions')
                    .select('id')
                    .eq('project_id', id)
                    .eq('buyer_id', user.id)
                    .eq('status', 'pending')
                    .limit(1);

                if (existingRequests && existingRequests.length > 0) {
                    setHasPendingRequest(true);
                }
            }

            setIsLoading(false);
        };

        fetchProject();

        // Increment View Count (Once per session per project)
        const viewedKey = `viewed_${id}`;
        if (!sessionStorage.getItem(viewedKey)) {
            supabase.rpc('increment_project_view', { p_id: id }).then(({ error }) => {
                if (error) console.error("Error incrementing view:", error);
                else sessionStorage.setItem(viewedKey, 'true');
            });
        }
    }, [id, user]);

    const [isArchiving, setIsArchiving] = useState(false);

    const { showToast } = useToast();

    // ... (existing code for state)

    const handleArchive = async () => {
        const isCurrentlyArchived = project?.is_archived;
        const action = isCurrentlyArchived ? "unarchive" : "archive";

        if (!confirm(`Are you sure you want to ${action} this project?`)) return;

        setIsArchiving(true);
        const { error } = await supabase
            .from('projects')
            .update({ is_archived: !isCurrentlyArchived })
            .eq('id', project.id);

        if (error) {
            console.error("Archive Error:", error);
            showToast(`Error ${action}ing project: ` + error.message, "error");
            setIsArchiving(false);
        } else {
            // Reload to reflect changes
            window.location.reload();
        }
    };

    const [isClaiming, setIsClaiming] = useState(false);

    const handleAction = async () => {
        if (!user) {
            showToast("ACCESS_DENIED: Please login to acquire assets.", "warning");
            return;
        }

        // DIRECT CLAIM FOR FREE PROJECTS
        if (project.interaction_type === 'adopt' || project.price === 0) {
            if (!confirm("Confirm you want to claim this project for free?")) return;

            setIsClaiming(true);
            try {
                // Call Secure API to Claim
                // Get Session Token
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) throw new Error("No active session");

                const res = await fetch('/api/claim-project', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`
                    },
                    body: JSON.stringify({ projectId: project.id })
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Claim failed');

                showToast("ASSET_ACQUIRED: Project claimed successfully.", "success");
                // Refresh page
                window.location.reload();
            } catch (error: any) {
                console.error("Error claiming project:", error);
                showToast("CLAIM_FAILED: " + error.message, "error");
            } finally {
                setIsClaiming(false);
            }
            return;
        }

        // Open Payment/Claim Modal
        setIsPaymentOpen(true);
    };

    const handlePaymentSuccess = () => {
        // Refresh page to update AuthContext (purchased_ids) and UI
        window.location.reload();
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-cyber-black text-foreground flex flex-col">
                <Header />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-cyber-neon font-mono animate-pulse text-xl">
                        ACCESSING_ARCHIVES...
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    if (!project) {
        return (
            <div className="min-h-screen bg-cyber-black text-foreground flex flex-col">
                <Header />
                <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                    <ShieldAlert className="w-16 h-16 text-red-500" />
                    <h1 className="text-2xl font-display text-white">FILE_CORRUPTED_OR_MISSING</h1>
                    <Link href="/" className="text-cyber-neon hover:underline font-mono">
                        // RETURN_TO_BASE
                    </Link>
                </div>
                <Footer />
            </div>
        );
    }

    const isOwner = user?.id === project.seller_id;
    const isPurchased = user?.purchased_ids?.includes(project.id);
    const isCollaborator = user?.collab_ids?.includes(project.id);

    // Determine Status Logic
    let actionLabel = "";
    let actionIcon = null;
    let actionColor = "";

    switch (project.interaction_type) {
        case 'buy':
            actionLabel = `PURCHASE (₹${project.price})`;
            actionIcon = <IndianRupee className="w-5 h-5" />;
            actionColor = "bg-cyber-neon text-cyber-black hover:shadow-glow-neon";
            break;
        case 'adopt':
            actionLabel = "CLAIM FOR FREE";
            actionIcon = <GitFork className="w-5 h-5" />;
            actionColor = "bg-cyber-gray text-white hover:bg-white hover:text-black";
            break;
        case 'collab':
            actionLabel = "REQUEST ACCESS";
            actionIcon = <Users className="w-5 h-5" />;
            actionColor = "bg-blue-600 text-white hover:bg-blue-500 hover:shadow-glow-blue";
            break;
    }

    return (
        <div className="min-h-screen bg-cyber-black text-foreground selection:bg-cyber-red selection:text-white flex flex-col">
            <Header />

            <main className="flex-1 container mx-auto px-4 py-8 md:py-12">

                {/* Back Button */}
                <Link href={isOwner || isPurchased || isCollaborator ? "/dashboard" : "/"} className="inline-flex items-center text-cyber-muted hover:text-cyber-red transition-colors mb-8 font-mono text-lg group tracking-wide">
                    <ArrowLeft className="w-5 h-5 mr-3 group-hover:-translate-x-1 transition-transform" />
                    {isOwner || isPurchased || isCollaborator ? "Back to Dashboard" : "Back to Graveyard"}
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
                    {/* Left Column: Visuals & Tech */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="lg:col-span-2 space-y-8"
                    >
                        {/* Header Box */}
                        <div className="relative border border-cyber-gray/30 bg-cyber-dark/30 p-8 cyber-clip">
                            <div className="absolute top-0 right-0 p-2">
                                <span className={`inline-block px-3 py-1 text-xs font-bold font-mono border ${project.interaction_type === 'buy' ? 'border-cyber-neon text-cyber-neon' :
                                    (project.interaction_type === 'collab' && project.is_collab_filled) ? 'border-purple-500 text-purple-500 shadow-glow-purple' :
                                        project.interaction_type === 'collab' ? 'border-blue-500 text-blue-500' :
                                            'border-white text-white'
                                    }`}>
                                    {(project.interaction_type === 'collab' && project.is_collab_filled) ? "PARTNERED" : project.interaction_type.toUpperCase()}
                                </span>
                            </div>

                            <h1 className="font-display text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
                                {project.title}
                            </h1>

                            <div className="flex flex-wrap items-center gap-6 text-cyber-muted font-mono text-sm max-w-2xl">
                                <div className="flex items-center gap-2">
                                    <UserIcon className="w-4 h-4" />
                                    <span>SELLER: <span className="text-white">{seller?.username || "UNKNOWN_USER"}</span></span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    <span>UPLOADED: <span className="text-white w-32 truncate">{new Date(project.created_at).toLocaleDateString()}</span></span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Eye className="w-4 h-4" />
                                    <span>VIEWS: <span className="text-white">{project.views || 0}</span></span>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="prose prose-invert max-w-none prose-p:text-cyber-muted prose-headings:font-display prose-headings:text-white">
                            <h3 className="text-xl font-display font-bold text-white border-l-2 border-cyber-red pl-4 mb-4 uppercase tracking-wider">
                                PROJECT MANIFEST
                            </h3>
                            <p className="whitespace-pre-wrap leading-relaxed">
                                {project.description}
                            </p>
                        </div>

                        {/* Tech Stack */}
                        <div className="space-y-4">
                            <h3 className="text-xl font-display font-bold text-white border-l-2 border-cyber-neon pl-4 uppercase tracking-wider">
                                HARDWARE REQS
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {project.tech_stack.map((tech) => (
                                    <TechBadge key={tech} tech={tech} />
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    {/* Right Column: Action Panel */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="lg:col-span-1"
                    >
                        <div className="sticky top-24 border border-cyber-gray/30 bg-cyber-dark/50 p-6 cyber-clip backdrop-blur-sm space-y-6">

                            {/* Terminal Header */}
                            <div className="border-b border-cyber-gray/30 pb-4 mb-4">
                                <div className="font-mono text-xs text-cyber-muted">
                                    {(project.interaction_type === 'collab' && project.is_collab_filled && (isOwner || isCollaborator))
                                        ? "WORKSPACE_TERMINAL"
                                        : "TRANSACTION_TERMINAL"}
                                </div>
                                <div className="text-xs text-cyber-gray mt-1">ID: {project.id.slice(0, 8)}</div>
                            </div>

                            {/* Price / Contact Display */}
                            <div className="text-center py-6 bg-cyber-black/50 cyber-clip-sm border border-cyber-gray/10">
                                {(project.interaction_type === 'collab' && project.is_collab_filled && (isOwner || isCollaborator)) ? (
                                    <>
                                        <div className="text-cyber-muted text-xs font-mono mb-2 uppercase tracking-widest">
                                            {isOwner ? "PARTNER IDENTITY" : "SELLER IDENTITY"}
                                        </div>
                                        <div className="text-xl font-display text-white mb-1">
                                            {isOwner ? (partner?.username || "UNKNOWN") : (seller?.username || "UNKNOWN")}
                                        </div>
                                        <div className="text-xs font-mono text-cyber-neon break-all px-4">
                                            {isOwner ? (partner?.contact_info || "NO_DATA") : (seller?.contact_info || "NO_DATA")}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="text-cyber-muted text-xs font-mono mb-2 uppercase tracking-widest">
                                            Current Valuation
                                        </div>
                                        <div className="text-4xl font-display font-bold text-white">
                                            {project.interaction_type === 'adopt' ? "FREE" : `₹${project.price}`}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-4">
                                {!isOwner && (
                                    <Link href={`/dashboard?tab=messages&chat_with=${project.seller_id}`}>
                                        <CyberButton className="w-full bg-cyber-gray/20 text-white hover:bg-cyber-gray/40 border-cyber-gray/50 mb-3 block text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <MessageSquare className="w-4 h-4" />
                                                <span>MESSAGE_SELLER</span>
                                            </div>
                                        </CyberButton>
                                    </Link>
                                )}

                                {isOwner ? (
                                    <div className="p-4 bg-cyber-red/10 border border-cyber-red/30 text-center">
                                        <h3 className="text-cyber-red font-bold font-display uppercase tracking-widest mb-2">OWNER_ACCESS</h3>
                                        <p className="text-xs text-cyber-muted mb-4">You own this artifact.</p>
                                        <div className="flex flex-col gap-2">
                                            <Link href={`/edit/${project.id}`} className="w-full">
                                                <button className="w-full py-2 bg-cyber-red/20 text-cyber-red font-mono text-sm hover:bg-cyber-red/30 transition-colors uppercase border border-cyber-red/50">
                                                    Edit Metadata
                                                </button>
                                            </Link>
                                            <button
                                                onClick={handleArchive}
                                                disabled={isArchiving}
                                                className="w-full py-2 bg-transparent text-cyber-muted font-mono text-sm hover:text-white transition-colors uppercase border border-cyber-gray/30 disabled:opacity-50"
                                            >
                                                {isArchiving ? "PROCESSING..." : project.is_archived ? "UNARCHIVE" : "ARCHIVE"}
                                            </button>
                                        </div>
                                    </div>
                                ) : isCollaborator ? (
                                    <div className="p-4 bg-blue-500/10 border border-blue-500/30 text-center">
                                        <h3 className="text-blue-400 font-bold font-display uppercase tracking-widest mb-2">PARTNER_ACCESS</h3>
                                        <div className="space-y-4">
                                            <button
                                                onClick={async () => {
                                                    if (project.file_url) {
                                                        try {
                                                            const { data: { session } } = await supabase.auth.getSession();
                                                            if (!session) throw new Error("No session");

                                                            const res = await fetch('/api/secure-download', {
                                                                method: 'POST',
                                                                headers: {
                                                                    'Content-Type': 'application/json',
                                                                    'Authorization': `Bearer ${session.access_token}`
                                                                },
                                                                body: JSON.stringify({ projectId: project.id })
                                                            });
                                                            const data = await res.json();
                                                            if (data.url) {
                                                                window.open(data.url, '_blank');
                                                            } else {
                                                                throw new Error(data.error || "Download failed");
                                                            }
                                                        } catch (err: any) {
                                                            showToast("DOWNLOAD_ERROR: " + err.message, "error");
                                                        }
                                                    } else {
                                                        showToast("FILE_NOT_FOUND: No source attached.", "error");
                                                    }
                                                }}
                                                className="w-full py-2 bg-blue-500/20 text-blue-400 font-bold font-mono hover:bg-blue-500/30 transition-all cyber-clip-sm flex items-center justify-center gap-2 text-xs"
                                            >
                                                <Cpu className="w-3 h-3" />
                                                ACCESS_SOURCE
                                            </button>

                                            {project.repo_link && (
                                                <button
                                                    onClick={() => window.open(project.repo_link, '_blank')}
                                                    className="w-full py-2 bg-purple-500/20 text-purple-400 font-bold font-mono hover:bg-purple-500/30 transition-all cyber-clip-sm flex items-center justify-center gap-2 text-xs mt-2"
                                                >
                                                    <GitFork className="w-3 h-3" />
                                                    REPOSITORY
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ) : isPurchased ? (
                                    <div className="p-4 bg-cyber-neon/10 border border-cyber-neon/30 text-center">
                                        <h3 className="text-cyber-neon font-bold font-display uppercase tracking-widest mb-2">ACCESS_GRANTED</h3>
                                        <button
                                            onClick={async () => {
                                                if (project.file_url) {
                                                    try {
                                                        const { data: { session } } = await supabase.auth.getSession();
                                                        if (!session) throw new Error("No session");

                                                        const res = await fetch('/api/secure-download', {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
                                                            body: JSON.stringify({ projectId: project.id })
                                                        });
                                                        const data = await res.json();
                                                        if (data.url) window.open(data.url, '_blank');
                                                        else showToast("DOWNLOAD_ERROR: " + (data.error || "Failed"), "error");
                                                    } catch (err: any) {
                                                        showToast("DOWNLOAD_ERROR: " + err.message, "error");
                                                    }
                                                } else {
                                                    showToast("FILE_NOT_FOUND: No source attached.", "error");
                                                }
                                            }}
                                            className="w-full py-3 bg-cyber-neon text-cyber-black font-bold font-mono hover:shadow-glow-neon transition-all cyber-clip-sm flex items-center justify-center gap-2"
                                        >
                                            <Cpu className="w-4 h-4" />
                                            DOWNLOAD_SOURCE
                                        </button>

                                        {project.repo_link && (
                                            <>
                                                <button
                                                    onClick={() => window.open(project.repo_link, '_blank')}
                                                    className="w-full py-3 bg-purple-500/20 text-purple-400 font-bold font-mono hover:bg-purple-500/30 transition-all cyber-clip-sm flex items-center justify-center gap-2 mt-2"
                                                >
                                                    <GitFork className="w-4 h-4" />
                                                    OPEN REPOSITORY
                                                </button>
                                                <p className="text-[10px] text-cyber-muted text-center mt-2 italic">
                                                    *Access to the repository will be granted shortly. Check your GitHub notifications.
                                                </p>
                                            </>
                                        )}
                                    </div>
                                ) : hasPendingRequest ? (
                                    <div className="p-4 bg-blue-500/10 border border-blue-500/30 text-center">
                                        <h3 className="text-blue-400 font-bold font-display uppercase tracking-widest mb-2">REQUEST_PENDING</h3>
                                        <p className="text-xs text-cyber-muted mb-4">Waiting for seller confirmation.</p>
                                        <button disabled className="w-full py-3 bg-blue-500/20 text-blue-400 font-bold font-mono cyber-clip-sm flex items-center justify-center gap-2 opacity-75 cursor-not-allowed">
                                            <Users className="w-4 h-4" />
                                            WAITING...
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        {project.repo_link && (
                                            <div className="mb-4 p-3 bg-cyber-black/50 border border-cyber-gray/20 flex items-center gap-3 opacity-75">
                                                <div className="p-2 bg-cyber-gray/20 rounded-full">
                                                    <Lock className="w-4 h-4 text-cyber-muted" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-xs font-bold text-cyber-muted font-display tracking-wider">REPOSITORY LOCKED</p>
                                                    <p className="text-[10px] text-cyber-gray font-mono">
                                                        Source code link hidden until access is granted.
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        <button
                                            onClick={async () => {
                                                if (!user) {
                                                    router.push("/login");
                                                    return;
                                                }
                                                if (project.interaction_type === 'collab') {
                                                    // Open Collab Modal
                                                    setIsCollabModalOpen(true);
                                                } else {
                                                    handleAction();
                                                }
                                            }}
                                            className={`w-full py-4 font-bold tracking-widest cyber-clip-sm flex items-center justify-center gap-2 transition-all ${actionColor}`}
                                        >
                                            {actionIcon}
                                            {actionLabel}
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Security Note */}
                            <div className="flex items-start gap-3 pt-6 border-t border-cyber-gray/30">
                                <ShieldAlert className="w-4 h-4 text-cyber-muted shrink-0 mt-0.5" />
                                <p className="text-[10px] text-cyber-gray leading-tight">
                                    The Graveyard verifies code integrity but does not guarantee runtime stability.
                                    All acquisitions are final.
                                </p>
                            </div>

                        </div >
                    </motion.div >
                </div >

                {/* Payment Modal */}
                {
                    project && (
                        <PaymentModal
                            isOpen={isPaymentOpen}
                            onClose={() => setIsPaymentOpen(false)}
                            project={project}
                            onSuccess={handlePaymentSuccess}
                        />
                    )
                }

                {/* Collab Request Modal */}
                {project && (
                    <CollabRequestModal
                        isOpen={isCollabModalOpen}
                        onClose={() => setIsCollabModalOpen(false)}
                        onSubmit={async (contact, specialization) => {
                            const { error } = await supabase.from('transactions').insert({
                                project_id: project.id,
                                buyer_id: user!.id,
                                amount: 0,
                                status: 'pending',
                                payment_id: 'COLLAB_REQUEST',
                                metadata: { contact, specialization }
                            });
                            if (error) {
                                showToast("REQUEST_FAILED: " + error.message, "error");
                                throw error;
                            } else {
                                setHasPendingRequest(true);
                                showToast("REQUEST_SENT: Seller notified of interest.", "success");
                            }
                        }}
                        projectTitle={project.title}
                    />
                )}
            </main >
            <Footer />
        </div >
    );
}
